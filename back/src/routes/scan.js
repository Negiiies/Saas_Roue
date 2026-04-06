const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const crypto = require('crypto')
const rateLimit = require('express-rate-limit')

const scanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100, // 100 en dev, réduire à 10 en prod
  message: { error: 'Trop de scans depuis cette adresse' }
})

// ─── Quand un client scanne le QR code ───────────────────────────────────────
router.get('/:wheelId', scanLimiter, async (req, res) => {
  const ip = req.ip
  const wheelId = parseInt(req.params.wheelId)
  const fingerprint = req.headers['x-fingerprint'] || null

  try {
    const wheel = await prisma.wheel.findUnique({
      where: { id: wheelId },
      include: {
        rewards: true,
        business: {
          include: { company: { select: { isActive: true, id: true } } }
        }
      }
    })

    if (!wheel) return res.status(404).json({ error: 'Roue introuvable' })
    if (wheel.business.status === 'blocked') return res.status(403).json({ error: 'Commerce non disponible' })

    const business = wheel.business
    if (business.status === 'inactive') return res.status(403).json({ error: 'Commerce inactif' })
    if (business.status === 'expired') return res.status(403).json({ error: "Période d'essai expirée" })
    if (business.status === 'trial' && business.trialEndsAt && new Date() > new Date(business.trialEndsAt)) {
      return res.status(403).json({ error: "Période d'essai expirée" })
    }

    // Vérifier si déjà participé — par fingerprint (priorité) ou par IP
    const existingScan = await prisma.scan.findFirst({
      where: {
        wheelId,
        ...(fingerprint
          ? { fingerprint }
          : { ip }
        )
      },
      include: { reward: true }
    })

    if (existingScan) {
      return res.json({
        token: existingScan.token,
        wheel,
        alreadyScanned: true,
        hasSpun: existingScan.hasSpun,
        existingScan: existingScan.hasSpun ? {
          status: existingScan.status,
          reward: existingScan.reward,
          secretCode: existingScan.secretCode,
          wonAt: existingScan.wonAt,
          expiresAt: existingScan.expiresAt
        } : null
      })
    }

    // Créer le scan avec fingerprint
    const scan = await prisma.scan.create({
      data: {
        token: crypto.randomUUID(),
        ip,
        fingerprint,
        wheelId
      }
    })

    res.json({ token: scan.token, wheel, alreadyScanned: false })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Quand le client tourne la roue ──────────────────────────────────────────
router.post('/spin', async (req, res) => {
  const { token } = req.body

  try {
    const scan = await prisma.scan.findUnique({
      where: { token },
      include: {
        wheel: {
          include: {
            business: {
              include: { company: { select: { isActive: true, id: true } } }
            }
          }
        }
      }
    })

    if (!scan) return res.status(404).json({ error: 'Token invalide' })
    if (scan.hasSpun) return res.status(400).json({ error: 'Roue déjà tournée' })

    const business = scan.wheel.business
    if (business.status === 'inactive') return res.status(403).json({ error: 'Commerce inactif' })
    if (business.status === 'expired') return res.status(403).json({ error: "Période d'essai expirée" })
    if (business.status === 'blocked') return res.status(403).json({ error: 'Commerce non disponible' })
    if (business.status === 'trial' && business.trialEndsAt && new Date() > new Date(business.trialEndsAt)) {
      return res.status(403).json({ error: "Période d'essai expirée" })
    }

    const rewards = await prisma.reward.findMany({ where: { wheelId: scan.wheelId } })

    const rand = Math.random() * 100
    let cumul = 0
    let winner = rewards[rewards.length - 1]
    for (const reward of rewards) {
      cumul += reward.probability
      if (rand <= cumul) { winner = reward; break }
    }

    const wonAt = new Date()
    const expiresAt = new Date(wonAt.getTime() + 24 * 60 * 60 * 1000)

    let secretCode = null
    let status = 'lost'

    if (!winner.isLosing) {
      secretCode = crypto.randomBytes(4).toString('hex').toUpperCase()
      status = 'won'
    }

    const updatedScan = await prisma.scan.update({
      where: { token },
      data: {
        hasSpun: true,
        rewardId: winner.id,
        secretCode,
        status,
        wonAt,
        expiresAt: winner.isLosing ? null : expiresAt
      },
      include: { reward: true }
    })

    res.json({
      reward: winner,
      secretCode: updatedScan.secretCode,
      wonAt: wonAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      expiresAt: expiresAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      date: wonAt.toLocaleDateString('fr-FR')
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Validation du code secret par le personnel ───────────────────────────────
router.post('/validate', async (req, res) => {
  const { secretCode } = req.body

  if (!secretCode) return res.status(400).json({ error: 'Code manquant' })

  try {
    const scan = await prisma.scan.findFirst({
      where: { secretCode: secretCode.toUpperCase() },
      include: {
        reward: true,
        wheel: {
          include: { business: true }
        }
      }
    })

    if (!scan) return res.status(404).json({ error: 'Code invalide' })
    if (scan.status === 'used') return res.status(400).json({ error: 'Ce code a déjà été utilisé' })
    if (scan.status === 'lost') return res.status(400).json({ error: 'Ce code ne correspond pas à un gain' })

    if (scan.expiresAt && new Date() > new Date(scan.expiresAt)) {
      return res.status(400).json({ error: 'Ce code a expiré' })
    }

    await prisma.scan.update({
      where: { id: scan.id },
      data: { status: 'used', usedAt: new Date() }
    })

    res.json({
      valid: true,
      reward: scan.reward,
      business: scan.wheel.business,
      usedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const crypto = require('crypto')
const rateLimit = require('express-rate-limit')

const scanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.ip,
  message: { error: 'Trop de scans depuis cette adresse' }
})

// Quand un client scanne le QR code
router.get('/:wheelId', scanLimiter, async (req, res) => {
  const ip = req.ip
  const wheelId = parseInt(req.params.wheelId)

  try {
    const wheel = await prisma.wheel.findUnique({
      where: { id: wheelId },
      include: { rewards: true }
    })
    if (!wheel) return res.status(404).json({ error: 'Roue introuvable' })

    const recentScan = await prisma.scan.findFirst({
      where: {
        ip,
        wheelId,
        hasSpun: false,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }
      }
    })

    let token
    if (recentScan) {
      token = recentScan.token
    } else {
      const scan = await prisma.scan.create({
        data: {
          token: crypto.randomUUID(),
          ip,
          wheelId
        }
      })
      token = scan.token
    }

    res.json({ token, wheel })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Quand le client tourne la roue
router.post('/spin', async (req, res) => {
  const { token } = req.body

  try {
    const scan = await prisma.scan.findUnique({ where: { token } })
    if (!scan) return res.status(404).json({ error: 'Token invalide' })
    if (scan.hasSpun) return res.status(400).json({ error: 'Roue déjà tournée' })

    const rewards = await prisma.reward.findMany({ where: { wheelId: scan.wheelId } })

    // Tirage au sort
    const rand = Math.random() * 100
    let cumul = 0
    let winner = rewards[rewards.length - 1]
    for (const reward of rewards) {
      cumul += reward.probability
      if (rand <= cumul) { winner = reward; break }
    }

    // Générer le code journalier
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const todayCount = await prisma.scan.count({
      where: {
        wheelId: scan.wheelId,
        hasSpun: true,
        wonAt: { gte: startOfDay }
      }
    })

    const dailyCode = todayCount + 1
    const wonAt = new Date()

    // Mettre à jour le scan
    await prisma.scan.update({
      where: { token },
      data: {
        hasSpun: true,
        dailyCode,
        wonAt,
        rewardId: winner.id
      }
    })

    res.json({
      reward: winner,
      dailyCode: String(dailyCode).padStart(3, '0'),
      wonAt: wonAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const rateLimit = require('express-rate-limit')

const validateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Trop de tentatives' }
})

// ─── Valider un code secret ───────────────────────────────────────────────────
// POST /api/validate  { secretCode: "A3F7B2C1" }
router.post('/', validateLimiter, async (req, res) => {
  const { secretCode } = req.body

  if (!secretCode || typeof secretCode !== 'string') {
    return res.status(400).json({ error: 'Code requis' })
  }

  try {
    const scan = await prisma.scan.findUnique({
      where: { secretCode: secretCode.toUpperCase().trim() },
      include: {
        reward: true,
        wheel: {
          include: { business: true }
        }
      }
    })

    // Code inexistant
    if (!scan) {
      return res.status(404).json({ valid: false, reason: 'Code invalide' })
    }

    // Code déjà utilisé
    if (scan.status === 'used') {
      return res.status(400).json({
        valid: false,
        reason: 'Code déjà utilisé',
        usedAt: scan.usedAt
      })
    }

    // Code expiré
    if (scan.expiresAt && new Date() > scan.expiresAt) {
      await prisma.scan.update({ where: { id: scan.id }, data: { status: 'expired' } })
      return res.status(400).json({ valid: false, reason: 'Code expiré' })
    }

    // Code perdu (isLosing) — ne devrait pas avoir de secretCode, mais sécurité
    if (scan.status === 'lost') {
      return res.status(400).json({ valid: false, reason: 'Code invalide' })
    }

    // ✅ Code valide → marquer comme utilisé
    await prisma.scan.update({
      where: { id: scan.id },
      data: { status: 'used', usedAt: new Date() }
    })

    return res.json({
      valid: true,
      reward: {
        label: scan.reward?.label,
        color: scan.reward?.color,
        emoji: scan.reward?.emoji
      },
      business: scan.wheel.business.name,
      wheel: scan.wheel.name,
      wonAt: scan.wonAt
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
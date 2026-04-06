const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const auth = require('../middlewares/authMiddleware')
const { body, validationResult } = require('express-validator')

// ─── Créer une roue ───────────────────────────────────────────────────────────
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Nom requis'),
  body('businessId').isInt().withMessage('businessId invalide'),
  body('rewards').isArray({ min: 1 }).withMessage('Au moins une récompense requise'),
  body('rewards.*.label').trim().notEmpty().withMessage('Label requis'),
  body('rewards.*.probability').isFloat({ min: 0, max: 100 }).withMessage('Probabilité invalide'),
  body('rewards.*.color').notEmpty().withMessage('Couleur requise'),
  body('googleReviewUrl').isURL().withMessage('URL Google invalide'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { name, businessId, rewards, googleReviewUrl } = req.body

  try {
    const business = await prisma.business.findFirst({
      where: { id: businessId, companyId: req.companyId }
    })
    if (!business) return res.status(403).json({ error: 'Commerce introuvable' })

    const total = rewards.reduce((sum, r) => sum + r.probability, 0)
    if (Math.round(total) !== 100) return res.status(400).json({ error: 'Les probabilités doivent totaliser 100%' })

    const wheel = await prisma.wheel.create({
      data: {
        name,
        googleReviewUrl,
        businessId,
        rewards: {
          create: rewards.map(r => ({
            label: r.label,
            probability: r.probability,
            color: r.color,
            isLosing: r.isLosing || false
          }))
        }
      },
      include: { rewards: true }
    })

    res.status(201).json(wheel)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Lister les roues d'un commerce ──────────────────────────────────────────
router.get('/business/:businessId', auth, async (req, res) => {
  try {
    const business = await prisma.business.findFirst({
      where: { id: parseInt(req.params.businessId), companyId: req.companyId }
    })
    if (!business) return res.status(403).json({ error: 'Commerce introuvable' })

    const wheels = await prisma.wheel.findMany({
      where: { businessId: parseInt(req.params.businessId) },
      include: { rewards: true }
    })

    // Auto-renouvellement et calcul statut engagement
    const updated = await Promise.all(wheels.map(async wheel => {
      if (!wheel.hasEngagement || !wheel.engagementStart) {
        return { ...wheel, engagementStatus: 'none' }
      }

      const start = new Date(wheel.engagementStart)
      const endDate = new Date(start)
      endDate.setMonth(endDate.getMonth() + wheel.engagementMonths)
      const now = new Date()
      const twoMonthsBefore = new Date(endDate)
      twoMonthsBefore.setMonth(twoMonthsBefore.getMonth() - 2)

      let engagementStatus = 'active'

      if (now >= endDate) {
        if (wheel.autoRenew) {
          // Renouvellement automatique
          await prisma.wheel.update({
            where: { id: wheel.id },
            data: { engagementStart: now, engagementStatus: 'active' }
          })
          engagementStatus = 'active'
        } else {
          engagementStatus = 'expired'
          await prisma.wheel.update({
            where: { id: wheel.id },
            data: { engagementStatus: 'expired' }
          })
        }
      } else if (now >= twoMonthsBefore) {
        engagementStatus = 'expiring'
        await prisma.wheel.update({
          where: { id: wheel.id },
          data: { engagementStatus: 'expiring' }
        })
      } else {
        await prisma.wheel.update({
          where: { id: wheel.id },
          data: { engagementStatus: 'active' }
        })
      }

      // Calculer jours restants
      const daysLeft = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)))
      const totalDays = wheel.engagementMonths * 30
      const daysElapsed = Math.min(totalDays, totalDays - daysLeft)

      return {
        ...wheel,
        engagementStatus,
        engagementEndDate: endDate.toISOString(),
        engagementDaysLeft: daysLeft,
        engagementProgress: Math.min(100, Math.round((daysElapsed / totalDays) * 100))
      }
    }))

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Stats d'une roue avec filtre de période ──────────────────────────────────
router.get('/:id/stats', auth, async (req, res) => {
  const wheelId = parseInt(req.params.id)
  const { from, to } = req.query

  try {
    const wheel = await prisma.wheel.findFirst({
      where: { id: wheelId },
      include: { business: true }
    })

    if (!wheel || wheel.business.companyId !== req.companyId) {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    const dateFilter = {}
    if (from) dateFilter.gte = new Date(from)
    if (to) {
      const toDate = new Date(to)
      toDate.setHours(23, 59, 59, 999)
      dateFilter.lte = toDate
    }

    const where = {
      wheelId,
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
    }

    const scans = await prisma.scan.findMany({ where })

    res.json({
      totalScans: scans.length,
      totalSpins: scans.filter(s => s.hasSpun).length,
      totalWins: scans.filter(s => s.status === 'won' || s.status === 'used').length,
      totalValidated: scans.filter(s => s.status === 'used').length
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Éditer une roue ──────────────────────────────────────────────────────────
router.patch('/:id', auth, async (req, res) => {
  const wheelId = parseInt(req.params.id)
  const { name, googleReviewUrl, rewards } = req.body

  try {
    const wheel = await prisma.wheel.findFirst({
      where: { id: wheelId },
      include: { business: true }
    })

    if (!wheel || wheel.business.companyId !== req.companyId) {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    // Valider les probabilités si rewards fournis
    if (rewards) {
      const total = rewards.reduce((sum, r) => sum + r.probability, 0)
      if (Math.round(total) !== 100) {
        return res.status(400).json({ error: 'Les probabilités doivent totaliser 100%' })
      }

      // Supprimer les anciennes rewards et recréer
      await prisma.reward.deleteMany({ where: { wheelId } })
      await prisma.reward.createMany({
        data: rewards.map(r => ({
          label: r.label,
          probability: r.probability,
          color: r.color,
          isLosing: r.isLosing || false,
          wheelId
        }))
      })
    }

    const updated = await prisma.wheel.update({
      where: { id: wheelId },
      data: {
        ...(name && { name }),
        ...(googleReviewUrl && { googleReviewUrl }),
      },
      include: { rewards: true }
    })

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Modifier l'engagement d'une roue ─────────────────────────────────────────
router.patch('/:id/engagement', auth, async (req, res) => {
  const wheelId = parseInt(req.params.id)
  const { hasEngagement, autoRenew, engagementMonths } = req.body

  try {
    const wheel = await prisma.wheel.findFirst({
      where: { id: wheelId },
      include: { business: true }
    })

    if (!wheel || wheel.business.companyId !== req.companyId) {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    const data = {}

    if (typeof hasEngagement === 'boolean') {
      data.hasEngagement = hasEngagement
      if (hasEngagement && !wheel.engagementStart) {
        data.engagementStart = new Date()
        data.engagementStatus = 'active'
      }
      if (!hasEngagement) {
        data.engagementStart = null
        data.engagementStatus = 'none'
      }
    }

    if (typeof autoRenew === 'boolean') data.autoRenew = autoRenew
    if (engagementMonths) data.engagementMonths = parseInt(engagementMonths)

    const updated = await prisma.wheel.update({
      where: { id: wheelId },
      data,
      include: { rewards: true }
    })

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Supprimer une roue ───────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const wheel = await prisma.wheel.findFirst({
      where: { id: parseInt(req.params.id) },
      include: { business: true }
    })

    if (!wheel || wheel.business.companyId !== req.companyId) {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    await prisma.wheel.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Roue supprimée' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
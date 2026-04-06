const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const auth = require('../middlewares/authMiddleware')
const { body, validationResult } = require('express-validator')

// ─── Helpers engagement ───────────────────────────────────────────────────────
function computeEngagement(business) {
  if (!business.hasEngagement || !business.engagementStart) {
    return { ...business, engagementStatus: 'none', engagementDaysLeft: null, engagementProgress: 0, engagementEndDate: null }
  }

  const start = new Date(business.engagementStart)
  const endDate = new Date(start)
  endDate.setMonth(endDate.getMonth() + business.engagementMonths)
  const now = new Date()
  const twoMonthsBefore = new Date(endDate)
  twoMonthsBefore.setMonth(twoMonthsBefore.getMonth() - 2)

  let engagementStatus = 'active'
  if (now >= endDate) {
    engagementStatus = business.autoRenew ? 'active' : 'expired'
  } else if (now >= twoMonthsBefore) {
    engagementStatus = 'expiring'
  }

  const totalDays = business.engagementMonths * 30
  const daysLeft = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)))
  return {
    ...business,
    engagementStatus,
    engagementEndDate: endDate.toISOString(),
    engagementDaysLeft: daysLeft,
    engagementProgress: Math.min(100, Math.round((daysLeft / totalDays) * 100))
  }
}

// ─── Lister les commerces ─────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const businesses = await prisma.business.findMany({
      where: { companyId: req.companyId },
      include: { wheels: true },
      orderBy: { createdAt: 'desc' }
    })

    // Auto-expirer les trials + calculer engagement
    const updated = await Promise.all(businesses.map(async b => {
      let data = {}

      // Gestion trial
      if (b.status === 'trial' && b.trialEndsAt && new Date() > new Date(b.trialEndsAt)) {
        data.status = 'expired'
        await prisma.business.update({ where: { id: b.id }, data: { status: 'expired' } })
        b = { ...b, status: 'expired' }
      }

      // Gestion engagement
      if (b.hasEngagement && b.engagementStart) {
        const endDate = new Date(b.engagementStart)
        endDate.setMonth(endDate.getMonth() + b.engagementMonths)
        const now = new Date()

        if (now >= endDate) {
          if (b.autoRenew) {
            await prisma.business.update({ where: { id: b.id }, data: { engagementStart: now, engagementStatus: 'active' } })
            b = { ...b, engagementStart: now, engagementStatus: 'active' }
          } else {
            await prisma.business.update({ where: { id: b.id }, data: { engagementStatus: 'expired' } })
            b = { ...b, engagementStatus: 'expired' }
          }
        }
      }

      // Calculer trialDaysLeft
      let trialDaysLeft = null
      if (b.status === 'trial' && b.trialEndsAt) {
        const diff = new Date(b.trialEndsAt) - new Date()
        trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
      }

      return { ...computeEngagement(b), trialDaysLeft }
    }))

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Créer un commerce ────────────────────────────────────────────────────────
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Nom requis'),
  body('slug').trim().notEmpty().withMessage('Slug requis'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { name, slug, city, zipCode, mode, hasEngagement, autoRenew } = req.body

  try {
    const existing = await prisma.business.findUnique({ where: { slug } })
    if (existing) return res.status(400).json({ error: 'Ce slug est déjà utilisé' })

    let status = 'inactive'
    let trialEndsAt = null

    if (mode === 'trial') {
      status = 'trial'
      trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 30)
    } else if (mode === 'active') {
      status = 'active'
    }

    const engagementData = {}
    if (hasEngagement) {
      engagementData.hasEngagement = true
      engagementData.engagementStart = new Date()
      engagementData.engagementMonths = 12
      engagementData.autoRenew = autoRenew || false
      engagementData.engagementStatus = 'active'
    }

    const business = await prisma.business.create({
      data: {
        name,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        city: city || null,
        zipCode: zipCode || null,
        status,
        trialEndsAt,
        companyId: req.companyId,
        ...engagementData
      }
    })

    res.status(201).json(business)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Éditer un commerce ───────────────────────────────────────────────────────
router.patch('/:id', auth, async (req, res) => {
  const { name, slug, city, zipCode } = req.body

  try {
    const business = await prisma.business.findFirst({
      where: { id: parseInt(req.params.id), companyId: req.companyId }
    })
    if (!business) return res.status(403).json({ error: 'Commerce introuvable' })

    if (slug && slug !== business.slug) {
      const existing = await prisma.business.findUnique({ where: { slug } })
      if (existing) return res.status(400).json({ error: 'Ce slug est déjà utilisé' })
    }

    const updated = await prisma.business.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name && { name }),
        ...(slug && { slug: slug.toLowerCase().replace(/\s+/g, '-') }),
        ...(city !== undefined && { city }),
        ...(zipCode !== undefined && { zipCode }),
      }
    })

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Modifier l'engagement ────────────────────────────────────────────────────
router.patch('/:id/engagement', auth, async (req, res) => {
  const { hasEngagement, autoRenew } = req.body

  try {
    const business = await prisma.business.findFirst({
      where: { id: parseInt(req.params.id), companyId: req.companyId }
    })
    if (!business) return res.status(403).json({ error: 'Commerce introuvable' })

    const data = {}
    if (typeof hasEngagement === 'boolean') {
      data.hasEngagement = hasEngagement
      if (hasEngagement && !business.engagementStart) {
        data.engagementStart = new Date()
        data.engagementStatus = 'active'
        data.engagementMonths = 12
      }
      if (!hasEngagement) {
        data.engagementStart = null
        data.engagementStatus = 'none'
      }
    }
    if (typeof autoRenew === 'boolean') data.autoRenew = autoRenew

    const updated = await prisma.business.update({
      where: { id: parseInt(req.params.id) },
      data
    })

    res.json(computeEngagement(updated))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Activer un commerce ──────────────────────────────────────────────────────
router.patch('/:id/activate', auth, async (req, res) => {
  try {
    const business = await prisma.business.findFirst({
      where: { id: parseInt(req.params.id), companyId: req.companyId }
    })
    if (!business) return res.status(403).json({ error: 'Commerce introuvable' })

    const updated = await prisma.business.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'active', trialEndsAt: null }
    })

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Changer le statut ────────────────────────────────────────────────────────
router.patch('/:id/status', auth, async (req, res) => {
  const { status } = req.body
  const allowed = ['active', 'inactive', 'blocked', 'trial']
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Statut invalide' })

  try {
    const business = await prisma.business.findFirst({
      where: { id: parseInt(req.params.id), companyId: req.companyId }
    })
    if (!business) return res.status(403).json({ error: 'Commerce introuvable' })

    const updated = await prisma.business.update({
      where: { id: parseInt(req.params.id) },
      data: { status }
    })

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Supprimer un commerce ────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const business = await prisma.business.findFirst({
      where: { id: parseInt(req.params.id), companyId: req.companyId }
    })
    if (!business) return res.status(403).json({ error: 'Commerce introuvable' })

    await prisma.business.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Commerce supprimé' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
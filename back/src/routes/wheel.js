const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const auth = require('../middlewares/authMiddleware')
const { body, validationResult } = require('express-validator')

// Créer une roue pour un commerce
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
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Lister les roues d'un commerce
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

    res.json(wheels)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Supprimer une roue
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
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
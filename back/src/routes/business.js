const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const auth = require('../middlewares/authMiddleware')
const { body, validationResult } = require('express-validator')

// Créer un commerce
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Nom requis'),
  body('slug').trim().notEmpty().withMessage('Slug requis'),
  body('city').trim().notEmpty().withMessage('Ville requise'),
  body('zipCode').trim().notEmpty().withMessage('Code postal requis'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { name, slug, city, zipCode } = req.body

  try {
    const business = await prisma.business.create({
      data: { name, slug, city, zipCode, companyId: req.companyId }
    })
    res.status(201).json(business)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Lister les commerces
router.get('/', auth, async (req, res) => {
  try {
    const businesses = await prisma.business.findMany({
      where: { companyId: req.companyId },
      include: { wheels: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(businesses)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Bloquer / Activer un commerce
router.patch('/:id/status', auth, async (req, res) => {
  const { status } = req.body

  if (!['active', 'blocked'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' })
  }

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
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Supprimer un commerce
router.delete('/:id', auth, async (req, res) => {
  try {
    const business = await prisma.business.findFirst({
      where: { id: parseInt(req.params.id), companyId: req.companyId }
    })
    if (!business) return res.status(403).json({ error: 'Commerce introuvable' })

    await prisma.business.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Commerce supprimé' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
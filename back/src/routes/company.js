const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const auth = require('../middlewares/authMiddleware')

// ─── Infos de la company connectée ───────────────────────────────────────────
// GET /api/company/me
router.get('/me', auth, async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        trialEndsAt: true,
        activatedAt: true,
        createdAt: true
      }
    })

    if (!company) return res.status(404).json({ error: 'Introuvable' })

    // Calculer jours restants
    let trialDaysLeft = null
    let trialActive = false
    if (company.trialEndsAt) {
      const diff = new Date(company.trialEndsAt) - new Date()
      trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
      trialActive = trialDaysLeft > 0
    }

    res.json({ ...company, trialDaysLeft, trialActive })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Activer le trial ─────────────────────────────────────────────────────────
// POST /api/company/trial/activate
router.post('/trial/activate', auth, async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: req.companyId } })

    if (company.trialEndsAt) {
      return res.status(400).json({ error: 'Période d\'essai déjà utilisée' })
    }

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 30)

    const updated = await prisma.company.update({
      where: { id: req.companyId },
      data: { trialEndsAt, activatedAt: new Date(), isActive: true }
    })

    res.json({
      message: 'Période d\'essai activée pour 30 jours',
      trialEndsAt: updated.trialEndsAt
    })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Réactiver le service (après expiration) ──────────────────────────────────
// POST /api/company/reactivate
router.post('/reactivate', auth, async (req, res) => {
  try {
    await prisma.company.update({
      where: { id: req.companyId },
      data: { isActive: true, trialEndsAt: null }
    })
    res.json({ message: 'Service réactivé' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
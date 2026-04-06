const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const prisma = require('../lib/prisma')

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
]

// Connexion
router.post('/login', loginRules, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { email, password } = req.body

  try {
    // Admin unique — seul l'email autorisé peut se connecter
    if (process.env.ADMIN_EMAIL && email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({ error: 'Identifiants incorrects' })
    }

    const company = await prisma.company.findUnique({ where: { email } })
    if (!company) return res.status(401).json({ error: 'Identifiants incorrects' })

    const valid = await bcrypt.compare(password, company.password)
    if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' })

    const token = jwt.sign({ id: company.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

    // Calculer jours restants du trial
    let trialDaysLeft = null
    if (company.trialEndsAt) {
      const diff = company.trialEndsAt - new Date()
      trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    res.json({
      token,
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        isActive: company.isActive,
        trialEndsAt: company.trialEndsAt,
        trialDaysLeft
      }
    })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
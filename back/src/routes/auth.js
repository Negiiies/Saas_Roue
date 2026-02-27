const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const prisma = require('../lib/prisma')

// Règles de validation
const registerRules = [
  body('name').trim().notEmpty().withMessage('Nom requis'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password')
    .isLength({ min: 8 }).withMessage('8 caractères minimum')
    .matches(/[A-Z]/).withMessage('Une majuscule requise')
    .matches(/[0-9]/).withMessage('Un chiffre requis')
    .matches(/[^A-Za-z0-9]/).withMessage('Un caractère spécial requis')
]

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
]

// Inscription
router.post('/register', registerRules, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { name, email, password } = req.body

  try {
    const existing = await prisma.company.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ error: 'Email déjà utilisé' })

    const hashed = await bcrypt.hash(password, 12)

    const company = await prisma.company.create({
      data: { name, email, password: hashed }
    })

    // On ne renvoie jamais le mot de passe
    res.status(201).json({
      message: 'Compte créé',
      company: { id: company.id, name: company.name, email: company.email }
    })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Connexion
router.post('/login', loginRules, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { email, password } = req.body

  try {
    const company = await prisma.company.findUnique({ where: { email } })

    // Message volontairement vague pour ne pas révéler si l'email existe
    if (!company) return res.status(401).json({ error: 'Identifiants incorrects' })

    const valid = await bcrypt.compare(password, company.password)
    if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' })

    const token = jwt.sign({ id: company.id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    })

    res.json({
      token,
      company: { id: company.id, name: company.name, email: company.email }
    })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
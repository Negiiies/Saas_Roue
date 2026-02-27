const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const businessRoutes = require('./routes/business')
const wheelRoutes = require('./routes/wheel')
const scanRoutes = require('./routes/scan')

const app = express()

// Sécurité headers
app.use(helmet())

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Trop de requêtes, réessaie plus tard' }
})
app.use(globalLimiter)

// Rate limiting strict pour l'auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives de connexion' }
})

app.use(cors())
app.use(express.json())

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/businesses', businessRoutes)
app.use('/api/wheels', wheelRoutes)
app.use('/api/scan', scanRoutes)

module.exports = app
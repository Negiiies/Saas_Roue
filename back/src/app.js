const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const businessRoutes = require('./routes/business')
const wheelRoutes = require('./routes/wheel')
const scanRoutes = require('./routes/scan')
const validateRoutes = require('./routes/validate')
const statsRoutes = require('./routes/stats')
const companyRoutes = require('./routes/company')

const app = express()

app.use(helmet())

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Trop de requêtes, réessaie plus tard' }
})
app.use(globalLimiter)

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
app.use('/api/validate', validateRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/company', companyRoutes)

module.exports = app
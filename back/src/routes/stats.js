const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const auth = require('../middlewares/authMiddleware')

// ─── Stats globales de la company ────────────────────────────────────────────
// GET /api/stats/global
router.get('/global', auth, async (req, res) => {
  try {
    const companyId = req.companyId

    // Tous les business de la company
    const businesses = await prisma.business.findMany({
      where: { companyId },
      select: { id: true }
    })
    const businessIds = businesses.map(b => b.id)

    // Toutes les wheels de ces business
    const wheels = await prisma.wheel.findMany({
      where: { businessId: { in: businessIds } },
      select: { id: true }
    })
    const wheelIds = wheels.map(w => w.id)

    // Tous les scans
    const [
      totalScans,
      totalSpins,
      totalWins,
      totalUsed,
      totalLost,
      recentScans
    ] = await Promise.all([
      prisma.scan.count({ where: { wheelId: { in: wheelIds } } }),
      prisma.scan.count({ where: { wheelId: { in: wheelIds }, hasSpun: true } }),
      prisma.scan.count({ where: { wheelId: { in: wheelIds }, status: 'won' } }),
      prisma.scan.count({ where: { wheelId: { in: wheelIds }, status: 'used' } }),
      prisma.scan.count({ where: { wheelId: { in: wheelIds }, status: 'lost' } }),
      // 7 derniers jours
      prisma.scan.findMany({
        where: {
          wheelId: { in: wheelIds },
          hasSpun: true,
          wonAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        select: { wonAt: true, status: true },
        orderBy: { wonAt: 'asc' }
      })
    ])

    // Grouper par jour pour le graphique
    const byDay = {}
    recentScans.forEach(s => {
      const day = s.wonAt.toISOString().split('T')[0]
      if (!byDay[day]) byDay[day] = { spins: 0, wins: 0 }
      byDay[day].spins++
      if (s.status === 'won' || s.status === 'used') byDay[day].wins++
    })

    res.json({
      totalScans,
      totalSpins,
      totalWins,
      totalUsed,
      totalLost,
      conversionRate: totalSpins > 0 ? Math.round((totalWins / totalSpins) * 100) : 0,
      redemptionRate: totalWins > 0 ? Math.round((totalUsed / totalWins) * 100) : 0,
      chartData: Object.entries(byDay).map(([date, data]) => ({ date, ...data }))
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Stats par business ───────────────────────────────────────────────────────
// GET /api/stats/business/:businessId
router.get('/business/:businessId', auth, async (req, res) => {
  try {
    const businessId = parseInt(req.params.businessId)

    // Vérifier que le business appartient à la company
    const business = await prisma.business.findFirst({
      where: { id: businessId, companyId: req.companyId },
      include: { wheels: { select: { id: true, name: true } } }
    })
    if (!business) return res.status(403).json({ error: 'Commerce introuvable' })

    const wheelIds = business.wheels.map(w => w.id)

    const [totalSpins, totalWins, totalUsed, totalLost] = await Promise.all([
      prisma.scan.count({ where: { wheelId: { in: wheelIds }, hasSpun: true } }),
      prisma.scan.count({ where: { wheelId: { in: wheelIds }, status: 'won' } }),
      prisma.scan.count({ where: { wheelId: { in: wheelIds }, status: 'used' } }),
      prisma.scan.count({ where: { wheelId: { in: wheelIds }, status: 'lost' } }),
    ])

    // Stats par roue
    const wheelStats = await Promise.all(
      business.wheels.map(async (wheel) => {
        const spins = await prisma.scan.count({ where: { wheelId: wheel.id, hasSpun: true } })
        const wins = await prisma.scan.count({ where: { wheelId: wheel.id, status: { in: ['won', 'used'] } } })
        const used = await prisma.scan.count({ where: { wheelId: wheel.id, status: 'used' } })

        // Distribution des récompenses gagnées
        const rewardDist = await prisma.scan.groupBy({
          by: ['rewardId'],
          where: { wheelId: wheel.id, status: { in: ['won', 'used'] } },
          _count: { rewardId: true }
        })

        return {
          wheelId: wheel.id,
          wheelName: wheel.name,
          spins,
          wins,
          used,
          conversionRate: spins > 0 ? Math.round((wins / spins) * 100) : 0,
          rewardDistribution: rewardDist
        }
      })
    )

    // 7 derniers jours
    const recentScans = await prisma.scan.findMany({
      where: {
        wheelId: { in: wheelIds },
        hasSpun: true,
        wonAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      select: { wonAt: true, status: true },
      orderBy: { wonAt: 'asc' }
    })

    const byDay = {}
    recentScans.forEach(s => {
      const day = s.wonAt.toISOString().split('T')[0]
      if (!byDay[day]) byDay[day] = { spins: 0, wins: 0 }
      byDay[day].spins++
      if (s.status === 'won' || s.status === 'used') byDay[day].wins++
    })

    res.json({
      business: { id: business.id, name: business.name },
      totalSpins,
      totalWins,
      totalUsed,
      totalLost,
      conversionRate: totalSpins > 0 ? Math.round((totalWins / totalSpins) * 100) : 0,
      redemptionRate: totalWins > 0 ? Math.round((totalUsed / totalWins) * 100) : 0,
      wheelStats,
      chartData: Object.entries(byDay).map(([date, data]) => ({ date, ...data }))
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
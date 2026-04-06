import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function GET(request, { params }) {
  const auth = verifyAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const companyId = auth.companyId

  try {
    const businessId = parseInt((await params).businessId)

    const business = await prisma.business.findFirst({
      where: { id: businessId, companyId },
      include: { wheels: { select: { id: true, name: true } } }
    })
    if (!business) return NextResponse.json({ error: 'Commerce introuvable' }, { status: 403 })

    const wheelIds = business.wheels.map(w => w.id)

    const [totalSpins, totalWins, totalUsed, totalLost] = await Promise.all([
      prisma.scan.count({ where: { wheelId: { in: wheelIds }, hasSpun: true } }),
      prisma.scan.count({ where: { wheelId: { in: wheelIds }, status: 'won' } }),
      prisma.scan.count({ where: { wheelId: { in: wheelIds }, status: 'used' } }),
      prisma.scan.count({ where: { wheelId: { in: wheelIds }, status: 'lost' } }),
    ])

    const wheelStats = await Promise.all(
      business.wheels.map(async (wheel) => {
        const spins = await prisma.scan.count({ where: { wheelId: wheel.id, hasSpun: true } })
        const wins = await prisma.scan.count({ where: { wheelId: wheel.id, status: { in: ['won', 'used'] } } })
        const used = await prisma.scan.count({ where: { wheelId: wheel.id, status: 'used' } })

        const rewardDist = await prisma.scan.groupBy({
          by: ['rewardId'],
          where: { wheelId: wheel.id, status: { in: ['won', 'used'] } },
          _count: { rewardId: true }
        })

        return {
          wheelId: wheel.id,
          wheelName: wheel.name,
          spins, wins, used,
          conversionRate: spins > 0 ? Math.round((wins / spins) * 100) : 0,
          rewardDistribution: rewardDist
        }
      })
    )

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

    return NextResponse.json({
      business: { id: business.id, name: business.name },
      totalSpins, totalWins, totalUsed, totalLost,
      conversionRate: totalSpins > 0 ? Math.round((totalWins / totalSpins) * 100) : 0,
      redemptionRate: totalWins > 0 ? Math.round((totalUsed / totalWins) * 100) : 0,
      wheelStats,
      chartData: Object.entries(byDay).map(([date, data]) => ({ date, ...data }))
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

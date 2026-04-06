import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function GET(request) {
  const auth = verifyAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const companyId = auth.companyId

  try {
    const businesses = await prisma.business.findMany({
      where: { companyId },
      select: { id: true }
    })
    const businessIds = businesses.map(b => b.id)

    const wheels = await prisma.wheel.findMany({
      where: { businessId: { in: businessIds } },
      select: { id: true }
    })
    const wheelIds = wheels.map(w => w.id)

    const [totalScans, totalSpins, totalWins, totalUsed, totalLost, recentScans] = await Promise.all([
      prisma.scan.count({ where: { wheelId: { in: wheelIds } } }),
      prisma.scan.count({ where: { wheelId: { in: wheelIds }, hasSpun: true } }),
      prisma.scan.count({ where: { wheelId: { in: wheelIds }, status: 'won' } }),
      prisma.scan.count({ where: { wheelId: { in: wheelIds }, status: 'used' } }),
      prisma.scan.count({ where: { wheelId: { in: wheelIds }, status: 'lost' } }),
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

    const byDay = {}
    recentScans.forEach(s => {
      const day = s.wonAt.toISOString().split('T')[0]
      if (!byDay[day]) byDay[day] = { spins: 0, wins: 0 }
      byDay[day].spins++
      if (s.status === 'won' || s.status === 'used') byDay[day].wins++
    })

    return NextResponse.json({
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
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

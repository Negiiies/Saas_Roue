import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function GET(request, { params }) {
  const auth = verifyAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const wheelId = parseInt((await params).id)
    const { searchParams } = request.nextUrl
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const wheel = await prisma.wheel.findFirst({ where: { id: wheelId }, include: { business: true } })
    if (!wheel || wheel.business.companyId !== auth.companyId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const dateFilter = {}
    if (from) dateFilter.gte = new Date(from)
    if (to) {
      const toDate = new Date(to)
      toDate.setHours(23, 59, 59, 999)
      dateFilter.lte = toDate
    }

    const where = {
      wheelId,
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
    }

    const scans = await prisma.scan.findMany({ where })

    return NextResponse.json({
      totalScans: scans.length,
      totalSpins: scans.filter(s => s.hasSpun).length,
      totalWins: scans.filter(s => s.status === 'won' || s.status === 'used').length,
      totalValidated: scans.filter(s => s.status === 'used').length
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

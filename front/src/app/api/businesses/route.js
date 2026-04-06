import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

function computeEngagement(business) {
  if (!business.hasEngagement || !business.engagementStart) {
    return { ...business, engagementStatus: 'none', engagementDaysLeft: null, engagementProgress: 0, engagementEndDate: null }
  }
  const start = new Date(business.engagementStart)
  const endDate = new Date(start)
  endDate.setMonth(endDate.getMonth() + business.engagementMonths)
  const now = new Date()
  const twoMonthsBefore = new Date(endDate)
  twoMonthsBefore.setMonth(twoMonthsBefore.getMonth() - 2)
  let engagementStatus = 'active'
  if (now >= endDate) engagementStatus = business.autoRenew ? 'active' : 'expired'
  else if (now >= twoMonthsBefore) engagementStatus = 'expiring'
  const totalDays = business.engagementMonths * 30
  const daysLeft = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)))
  return {
    ...business,
    engagementStatus,
    engagementEndDate: endDate.toISOString(),
    engagementDaysLeft: daysLeft,
    engagementProgress: Math.min(100, Math.round((daysLeft / totalDays) * 100))
  }
}

export async function GET(request) {
  const auth = verifyAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const companyId = auth.companyId

  try {
    const businesses = await prisma.business.findMany({
      where: { companyId },
      include: { wheels: true },
      orderBy: { createdAt: 'desc' }
    })

    const updated = await Promise.all(businesses.map(async b => {
      if (b.status === 'trial' && b.trialEndsAt && new Date() > new Date(b.trialEndsAt)) {
        await prisma.business.update({ where: { id: b.id }, data: { status: 'expired' } })
        b = { ...b, status: 'expired' }
      }

      if (b.hasEngagement && b.engagementStart) {
        const endDate = new Date(b.engagementStart)
        endDate.setMonth(endDate.getMonth() + b.engagementMonths)
        const now = new Date()
        if (now >= endDate) {
          if (b.autoRenew) {
            await prisma.business.update({ where: { id: b.id }, data: { engagementStart: now, engagementStatus: 'active' } })
            b = { ...b, engagementStart: now, engagementStatus: 'active' }
          } else {
            await prisma.business.update({ where: { id: b.id }, data: { engagementStatus: 'expired' } })
            b = { ...b, engagementStatus: 'expired' }
          }
        }
      }

      let trialDaysLeft = null
      if (b.status === 'trial' && b.trialEndsAt) {
        const diff = new Date(b.trialEndsAt) - new Date()
        trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
      }

      return { ...computeEngagement(b), trialDaysLeft }
    }))

    return NextResponse.json(updated)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request) {
  const auth = verifyAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const companyId = auth.companyId

  try {
    const { name, slug, city, zipCode, mode, hasEngagement, autoRenew } = await request.json()

    if (!name || !slug) return NextResponse.json({ error: 'Nom et slug requis' }, { status: 400 })

    const existing = await prisma.business.findUnique({ where: { slug } })
    if (existing) return NextResponse.json({ error: 'Ce slug est déjà utilisé' }, { status: 400 })

    let status = 'inactive'
    let trialEndsAt = null

    if (mode === 'trial') {
      status = 'trial'
      trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 30)
    } else if (mode === 'active') {
      status = 'active'
    }

    const engagementData = {}
    if (hasEngagement) {
      engagementData.hasEngagement = true
      engagementData.engagementStart = new Date()
      engagementData.engagementMonths = 12
      engagementData.autoRenew = autoRenew || false
      engagementData.engagementStatus = 'active'
    }

    const business = await prisma.business.create({
      data: {
        name,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        city: city || null,
        zipCode: zipCode || null,
        status,
        trialEndsAt,
        companyId,
        ...engagementData
      }
    })

    return NextResponse.json(business, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

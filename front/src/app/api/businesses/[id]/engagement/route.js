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
    ...business, engagementStatus, engagementEndDate: endDate.toISOString(),
    engagementDaysLeft: daysLeft, engagementProgress: Math.min(100, Math.round((daysLeft / totalDays) * 100))
  }
}

export async function PATCH(request, { params }) {
  const auth = verifyAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const id = parseInt((await params).id)
    const { hasEngagement, autoRenew } = await request.json()

    const business = await prisma.business.findFirst({ where: { id, companyId: auth.companyId } })
    if (!business) return NextResponse.json({ error: 'Commerce introuvable' }, { status: 403 })

    const data = {}
    if (typeof hasEngagement === 'boolean') {
      data.hasEngagement = hasEngagement
      if (hasEngagement && !business.engagementStart) {
        data.engagementStart = new Date()
        data.engagementStatus = 'active'
        data.engagementMonths = 12
      }
      if (!hasEngagement) {
        data.engagementStart = null
        data.engagementStatus = 'none'
      }
    }
    if (typeof autoRenew === 'boolean') data.autoRenew = autoRenew

    const updated = await prisma.business.update({ where: { id }, data })
    return NextResponse.json(computeEngagement(updated))
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

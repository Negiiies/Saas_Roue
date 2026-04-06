import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function POST(request) {
  const auth = verifyAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { name, businessId, rewards, googleReviewUrl } = await request.json()

    if (!name || !businessId || !rewards || !googleReviewUrl) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    const business = await prisma.business.findFirst({ where: { id: businessId, companyId: auth.companyId } })
    if (!business) return NextResponse.json({ error: 'Commerce introuvable' }, { status: 403 })

    const total = rewards.reduce((sum, r) => sum + r.probability, 0)
    if (Math.round(total) !== 100) {
      return NextResponse.json({ error: 'Les probabilités doivent totaliser 100%' }, { status: 400 })
    }

    const wheel = await prisma.wheel.create({
      data: {
        name,
        googleReviewUrl,
        businessId,
        rewards: {
          create: rewards.map(r => ({
            label: r.label,
            probability: r.probability,
            color: r.color,
            isLosing: r.isLosing || false
          }))
        }
      },
      include: { rewards: true }
    })

    return NextResponse.json(wheel, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

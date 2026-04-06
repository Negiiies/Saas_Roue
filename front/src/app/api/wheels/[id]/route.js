import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function PATCH(request, { params }) {
  const auth = verifyAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const wheelId = parseInt((await params).id)
    const { name, googleReviewUrl, rewards } = await request.json()

    const wheel = await prisma.wheel.findFirst({ where: { id: wheelId }, include: { business: true } })
    if (!wheel || wheel.business.companyId !== auth.companyId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    if (rewards) {
      const total = rewards.reduce((sum, r) => sum + r.probability, 0)
      if (Math.round(total) !== 100) {
        return NextResponse.json({ error: 'Les probabilités doivent totaliser 100%' }, { status: 400 })
      }
      await prisma.reward.deleteMany({ where: { wheelId } })
      await prisma.reward.createMany({
        data: rewards.map(r => ({
          label: r.label,
          probability: r.probability,
          color: r.color,
          isLosing: r.isLosing || false,
          wheelId
        }))
      })
    }

    const updated = await prisma.wheel.update({
      where: { id: wheelId },
      data: {
        ...(name && { name }),
        ...(googleReviewUrl && { googleReviewUrl }),
      },
      include: { rewards: true }
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const auth = verifyAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const wheelId = parseInt((await params).id)

    const wheel = await prisma.wheel.findFirst({ where: { id: wheelId }, include: { business: true } })
    if (!wheel || wheel.business.companyId !== auth.companyId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await prisma.wheel.delete({ where: { id: wheelId } })
    return NextResponse.json({ message: 'Roue supprimée' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

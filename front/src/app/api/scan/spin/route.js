import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request) {
  try {
    const { token } = await request.json()

    const scan = await prisma.scan.findUnique({
      where: { token },
      include: {
        wheel: {
          include: {
            business: {
              include: { company: { select: { isActive: true, id: true } } }
            }
          }
        }
      }
    })

    if (!scan) return NextResponse.json({ error: 'Token invalide' }, { status: 404 })
    if (scan.hasSpun) return NextResponse.json({ error: 'Roue déjà tournée' }, { status: 400 })

    const business = scan.wheel.business
    if (business.status === 'inactive') return NextResponse.json({ error: 'Commerce inactif' }, { status: 403 })
    if (business.status === 'expired') return NextResponse.json({ error: "Période d'essai expirée" }, { status: 403 })
    if (business.status === 'blocked') return NextResponse.json({ error: 'Commerce non disponible' }, { status: 403 })
    if (business.status === 'trial' && business.trialEndsAt && new Date() > new Date(business.trialEndsAt)) {
      return NextResponse.json({ error: "Période d'essai expirée" }, { status: 403 })
    }

    const rewards = await prisma.reward.findMany({ where: { wheelId: scan.wheelId } })

    const rand = Math.random() * 100
    let cumul = 0
    let winner = rewards[rewards.length - 1]
    for (const reward of rewards) {
      cumul += reward.probability
      if (rand <= cumul) { winner = reward; break }
    }

    const wonAt = new Date()
    const expiresAt = new Date(wonAt.getTime() + 24 * 60 * 60 * 1000)

    let secretCode = null
    let status = 'lost'

    if (!winner.isLosing) {
      secretCode = crypto.randomBytes(4).toString('hex').toUpperCase()
      status = 'won'
    }

    await prisma.scan.update({
      where: { token },
      data: {
        hasSpun: true,
        rewardId: winner.id,
        secretCode,
        status,
        wonAt,
        expiresAt: winner.isLosing ? null : expiresAt
      }
    })

    return NextResponse.json({
      reward: winner,
      secretCode,
      wonAt: wonAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      expiresAt: expiresAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      date: wonAt.toLocaleDateString('fr-FR')
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

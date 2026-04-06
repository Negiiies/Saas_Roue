import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request) {
  try {
    const body = await request.json()
    const { secretCode } = body

    if (!secretCode || typeof secretCode !== 'string') {
      return NextResponse.json({ error: 'Code requis' }, { status: 400 })
    }

    const scan = await prisma.scan.findUnique({
      where: { secretCode: secretCode.toUpperCase().trim() },
      include: {
        reward: true,
        wheel: {
          include: { business: true }
        }
      }
    })

    if (!scan) {
      return NextResponse.json({ valid: false, reason: 'Code invalide' }, { status: 404 })
    }

    if (scan.status === 'used') {
      return NextResponse.json({ valid: false, reason: 'Code déjà utilisé', usedAt: scan.usedAt }, { status: 400 })
    }

    if (scan.expiresAt && new Date() > scan.expiresAt) {
      await prisma.scan.update({ where: { id: scan.id }, data: { status: 'expired' } })
      return NextResponse.json({ valid: false, reason: 'Code expiré' }, { status: 400 })
    }

    if (scan.status === 'lost') {
      return NextResponse.json({ valid: false, reason: 'Code invalide' }, { status: 400 })
    }

    await prisma.scan.update({
      where: { id: scan.id },
      data: { status: 'used', usedAt: new Date() }
    })

    return NextResponse.json({
      valid: true,
      reward: {
        label: scan.reward?.label,
        color: scan.reward?.color,
        emoji: scan.reward?.emoji
      },
      business: scan.wheel.business.name,
      wheel: scan.wheel.name,
      wonAt: scan.wonAt
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

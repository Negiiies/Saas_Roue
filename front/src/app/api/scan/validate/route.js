import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request) {
  try {
    const { secretCode } = await request.json()

    if (!secretCode) return NextResponse.json({ error: 'Code manquant' }, { status: 400 })

    const scan = await prisma.scan.findFirst({
      where: { secretCode: secretCode.toUpperCase() },
      include: {
        reward: true,
        wheel: {
          include: { business: true }
        }
      }
    })

    if (!scan) return NextResponse.json({ error: 'Code invalide' }, { status: 404 })
    if (scan.status === 'used') return NextResponse.json({ error: 'Ce code a déjà été utilisé' }, { status: 400 })
    if (scan.status === 'lost') return NextResponse.json({ error: 'Ce code ne correspond pas à un gain' }, { status: 400 })

    if (scan.expiresAt && new Date() > new Date(scan.expiresAt)) {
      return NextResponse.json({ error: 'Ce code a expiré' }, { status: 400 })
    }

    await prisma.scan.update({
      where: { id: scan.id },
      data: { status: 'used', usedAt: new Date() }
    })

    return NextResponse.json({
      valid: true,
      reward: scan.reward,
      business: scan.wheel.business,
      usedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

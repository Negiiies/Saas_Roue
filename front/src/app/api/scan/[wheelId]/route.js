import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

export async function GET(request, { params }) {
  const wheelId = parseInt((await params).wheelId)
  const fingerprint = request.headers.get('x-fingerprint') || null
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  try {
    const wheel = await prisma.wheel.findUnique({
      where: { id: wheelId },
      include: {
        rewards: true,
        business: {
          include: { company: { select: { isActive: true, id: true } } }
        }
      }
    })

    if (!wheel) return NextResponse.json({ error: 'Roue introuvable' }, { status: 404 })

    const business = wheel.business
    if (business.status === 'blocked') return NextResponse.json({ error: 'Commerce non disponible' }, { status: 403 })
    if (business.status === 'inactive') return NextResponse.json({ error: 'Commerce inactif' }, { status: 403 })
    if (business.status === 'expired') return NextResponse.json({ error: "Période d'essai expirée" }, { status: 403 })
    if (business.status === 'trial' && business.trialEndsAt && new Date() > new Date(business.trialEndsAt)) {
      return NextResponse.json({ error: "Période d'essai expirée" }, { status: 403 })
    }

    const existingScan = await prisma.scan.findFirst({
      where: {
        wheelId,
        ...(fingerprint ? { fingerprint } : { ip })
      },
      include: { reward: true }
    })

    if (existingScan) {
      return NextResponse.json({
        token: existingScan.token,
        wheel,
        alreadyScanned: true,
        hasSpun: existingScan.hasSpun,
        existingScan: existingScan.hasSpun ? {
          status: existingScan.status,
          reward: existingScan.reward,
          secretCode: existingScan.secretCode,
          wonAt: existingScan.wonAt,
          expiresAt: existingScan.expiresAt
        } : null
      })
    }

    const scan = await prisma.scan.create({
      data: {
        token: crypto.randomUUID(),
        ip,
        fingerprint,
        wheelId
      }
    })

    return NextResponse.json({ token: scan.token, wheel, alreadyScanned: false })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

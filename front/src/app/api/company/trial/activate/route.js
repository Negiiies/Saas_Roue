import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function POST(request) {
  const auth = verifyAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const company = await prisma.company.findUnique({ where: { id: auth.companyId } })
    if (company.trialEndsAt) {
      return NextResponse.json({ error: "Période d'essai déjà utilisée" }, { status: 400 })
    }

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 30)

    const updated = await prisma.company.update({
      where: { id: auth.companyId },
      data: { trialEndsAt, isActive: true }
    })

    return NextResponse.json({ message: "Période d'essai activée pour 30 jours", trialEndsAt: updated.trialEndsAt })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

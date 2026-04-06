import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function GET(request) {
  const auth = verifyAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const company = await prisma.company.findUnique({
      where: { id: auth.companyId },
      select: { id: true, name: true, email: true, isActive: true, trialEndsAt: true, createdAt: true }
    })

    if (!company) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

    let trialDaysLeft = null
    let trialActive = false
    if (company.trialEndsAt) {
      const diff = new Date(company.trialEndsAt) - new Date()
      trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
      trialActive = trialDaysLeft > 0
    }

    return NextResponse.json({ ...company, trialDaysLeft, trialActive })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

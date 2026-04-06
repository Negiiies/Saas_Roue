import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function PATCH(request, { params }) {
  const auth = verifyAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { status } = await request.json()
    const allowed = ['active', 'inactive', 'blocked', 'trial']
    if (!allowed.includes(status)) return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })

    const id = parseInt((await params).id)

    const business = await prisma.business.findFirst({ where: { id, companyId: auth.companyId } })
    if (!business) return NextResponse.json({ error: 'Commerce introuvable' }, { status: 403 })

    const updated = await prisma.business.update({ where: { id }, data: { status } })
    return NextResponse.json(updated)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

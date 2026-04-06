import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function PATCH(request, { params }) {
  const auth = verifyAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const id = parseInt((await params).id)
    const { name, slug, city, zipCode } = await request.json()

    const business = await prisma.business.findFirst({ where: { id, companyId: auth.companyId } })
    if (!business) return NextResponse.json({ error: 'Commerce introuvable' }, { status: 403 })

    if (slug && slug !== business.slug) {
      const existing = await prisma.business.findUnique({ where: { slug } })
      if (existing) return NextResponse.json({ error: 'Ce slug est déjà utilisé' }, { status: 400 })
    }

    const updated = await prisma.business.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug: slug.toLowerCase().replace(/\s+/g, '-') }),
        ...(city !== undefined && { city }),
        ...(zipCode !== undefined && { zipCode }),
      }
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
    const id = parseInt((await params).id)

    const business = await prisma.business.findFirst({ where: { id, companyId: auth.companyId } })
    if (!business) return NextResponse.json({ error: 'Commerce introuvable' }, { status: 403 })

    await prisma.business.delete({ where: { id } })
    return NextResponse.json({ message: 'Commerce supprimé' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

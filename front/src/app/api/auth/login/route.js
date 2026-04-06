import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
    }

    if (process.env.ADMIN_EMAIL && email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
    }

    const company = await prisma.company.findUnique({ where: { email } })
    if (!company) return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })

    const valid = await bcrypt.compare(password, company.password)
    if (!valid) return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })

    const token = jwt.sign({ id: company.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

    let trialDaysLeft = null
    if (company.trialEndsAt) {
      const diff = company.trialEndsAt - new Date()
      trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    return NextResponse.json({
      token,
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        isActive: company.isActive,
        trialEndsAt: company.trialEndsAt,
        trialDaysLeft
      }
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

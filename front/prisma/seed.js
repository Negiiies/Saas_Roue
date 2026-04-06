const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.company.findUnique({ where: { email: 'noreply@rytual.fr' } })
  if (existing) {
    console.log('Admin existe déjà (id:', existing.id, ')')
    return
  }

  const admin = await prisma.company.create({
    data: {
      name: 'Rytual Admin',
      email: 'noreply@rytual.fr',
      password: '$2a$12$tylJ2qJwqPFB1fghuPd/cehx7FzmE12N9ZtFwtE29CHOFT3VDH9zG',
      isActive: true,
    }
  })

  console.log('Admin créé avec succès (id:', admin.id, ')')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

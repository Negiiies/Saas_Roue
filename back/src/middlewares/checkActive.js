const prisma = require('../lib/prisma')

/**
 * Middleware: vérifie que la company est active et que le trial n'est pas expiré.
 * À utiliser sur les routes publiques sensibles (spin, scan).
 * Prend le companyId via l'ID de la wheel ou du business.
 */
async function checkCompanyActive(companyId) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { isActive: true, trialEndsAt: true }
  })

  if (!company) return { allowed: false, reason: 'Entreprise introuvable' }
  if (!company.isActive) return { allowed: false, reason: 'Service désactivé' }

  if (company.trialEndsAt && new Date() > company.trialEndsAt) {
    // Désactiver automatiquement
    await prisma.company.update({
      where: { id: companyId },
      data: { isActive: false }
    })
    return { allowed: false, reason: 'Période d\'essai expirée' }
  }

  return { allowed: true }
}

module.exports = { checkCompanyActive }
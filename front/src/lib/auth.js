import jwt from 'jsonwebtoken'

export function verifyAuth(request) {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Token manquant', status: 401 }
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return { companyId: decoded.id }
  } catch {
    return { error: 'Token invalide', status: 401 }
  }
}

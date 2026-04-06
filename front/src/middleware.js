import { NextResponse } from 'next/server'

// Domaine client
const CLIENT_HOSTS = ['ryturn.fr', 'www.ryturn.fr']

// Pages autorisées sur le domaine client
const CLIENT_PAGES = ['/spin', '/validate', '/mentions-legales']

async function verifyJWT(token, secret) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.')
    if (!headerB64 || !payloadB64 || !signatureB64) return null

    const encoder = new TextEncoder()
    const data = encoder.encode(`${headerB64}.${payloadB64}`)
    const secretKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const b64 = signatureB64.replace(/-/g, '+').replace(/_/g, '/')
    const binStr = atob(b64)
    const signature = new Uint8Array(binStr.length)
    for (let i = 0; i < binStr.length; i++) {
      signature[i] = binStr.charCodeAt(i)
    }

    const valid = await crypto.subtle.verify('HMAC', secretKey, signature, data)
    if (!valid) return null

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.exp && payload.exp < Date.now() / 1000) return null

    return payload
  } catch {
    return null
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const hostname = request.nextUrl.hostname

  const isClient = CLIENT_HOSTS.some(h => hostname.includes(h))

  if (!isClient) {
    // Domaine admin (saas-roue.vercel.app)
    const token = request.cookies.get('token')?.value
    const isAuth = token ? await verifyJWT(token, process.env.JWT_SECRET) : null

    // Racine → /login
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Protéger toutes les routes /dashboard
    if (pathname.startsWith('/dashboard')) {
      if (!isAuth) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      return NextResponse.next()
    }

    // Déjà connecté → redirect /dashboard si on tente /login
    if (pathname === '/login' && isAuth) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
  }

  // Domaine client (ryturn.fr)
  if (pathname === '/') return NextResponse.next()

  if (CLIENT_PAGES.some(p => pathname.startsWith(p))) return NextResponse.next()

  if (pathname.startsWith('/api/scan') || pathname.startsWith('/api/validate')) return NextResponse.next()

  // Bloquer login/dashboard sur le domaine client
  if (pathname.startsWith('/login') || pathname.startsWith('/dashboard') || pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

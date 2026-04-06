import { NextResponse } from 'next/server'

// Domaine client
const CLIENT_HOSTS = ['ryturn.fr', 'www.ryturn.fr']

// Pages autorisées sur le domaine client
const CLIENT_PAGES = ['/spin', '/validate', '/mentions-legales']

export function middleware(request) {
  const { pathname, hostname } = request.nextUrl

  const isClient = CLIENT_HOSTS.some(h => hostname.includes(h))

  if (!isClient) {
    // Domaine admin (saas-roue.vercel.app) : la racine redirige vers /login
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Domaine client (ryturn.fr)
  // La racine affiche la landing page
  if (pathname === '/') {
    return NextResponse.next()
  }

  // Autoriser les pages client
  if (CLIENT_PAGES.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Autoriser les API publiques (scan, validate)
  if (pathname.startsWith('/api/scan') || pathname.startsWith('/api/validate')) {
    return NextResponse.next()
  }

  // Bloquer login/dashboard sur le domaine client
  if (pathname.startsWith('/login') || pathname.startsWith('/dashboard') || pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

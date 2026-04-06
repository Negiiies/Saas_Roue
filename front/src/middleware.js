import { NextResponse } from 'next/server'

// Domaine admin (Vercel par défaut + futur custom)
const ADMIN_HOSTS = [
  'saas-roue.vercel.app',
  'saas-roue-lxl6iznvb-negiies-projects.vercel.app',
  'localhost',
]

// Pages autorisées sur le domaine client (spinreview.fr)
const CLIENT_PAGES = ['/spin', '/validate', '/mentions-legales']

// Pages autorisées sur le domaine admin
const ADMIN_PAGES = ['/login', '/dashboard', '/api']

export function middleware(request) {
  const { pathname, hostname } = request.nextUrl

  const isAdmin = ADMIN_HOSTS.some(h => hostname.includes(h))

  if (isAdmin) {
    // Sur le domaine admin : la racine redirige vers /login
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Bloquer l'accès aux pages client depuis l'admin (optionnel)
    return NextResponse.next()
  }

  // Domaine client (spinreview.fr ou autre)
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

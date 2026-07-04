import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC = ['/login', '/api/auth', '/api/telegram', '/api/tienda', '/tienda']

function getSecret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? '')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/tienda') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (pathname === '/' || PUBLIC.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/icon')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('session')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    await jwtVerify(token, getSecret())
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

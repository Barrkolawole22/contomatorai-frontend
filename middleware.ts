import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJwt } from '@/lib/auth'

// Define protected routes
const protectedRoutes = ['/dashboard', '/admin']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip if not a protected route
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  if (!isProtected) return NextResponse.next()

  // Get JWT token from cookies - FIXED: Changed from 'token' to 'auth-token'
  const token = request.cookies.get('auth-token')?.value

  // Verify token
  const payload = token ? verifyJwt(token) : null

  if (!payload) {
    // Not authenticated — redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // FIXED: Added exact routes to match both /dashboard and /dashboard/subpaths
  matcher: ['/dashboard/:path*', '/dashboard', '/admin/:path*', '/admin'],
}
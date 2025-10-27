import { NextRequest, NextResponse } from 'next/server'
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  // Handle CORS for all API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    
    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.set('Access-Control-Max-Age', '86400')
    
    // Add cache-busting headers for API routes
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers })
    }
    
    return response
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/auth/signout',
    '/admin-auth/signin',
    '/admin-auth/signout',
    '/api/auth/',
    '/api/health'
  ]
  
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route)
  )
  
  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Handle root path specially - always check authentication
  if (request.nextUrl.pathname === '/') {
    try {
      const token = await getToken({ req: request })
      
      // If no token, redirect to sign in
      if (!token || Object.keys(token).length === 0) {
        console.log('[Middleware] No token found, redirecting to signin')
        const response = NextResponse.redirect(new URL('/auth/signin', request.url))
        // Clear any existing session cookies
        response.cookies.delete('next-auth.session-token')
        response.cookies.delete('__Secure-next-auth.session-token')
        return response
      }
      
      // If authenticated, allow through to page.tsx
      console.log('[Middleware] Token found, allowing access to dashboard')
      return NextResponse.next()
    } catch (error) {
      console.error('[Middleware] Root path token error:', error)
      // If token retrieval fails, redirect to signin
      const response = NextResponse.redirect(new URL('/auth/signin', request.url))
      response.cookies.delete('next-auth.session-token')
      response.cookies.delete('__Secure-next-auth.session-token')
      return response
    }
  }
  
  // Check authentication for all other routes
  let token
  try {
    token = await getToken({ req: request })
  } catch (error) {
    console.error('[Middleware] Token retrieval error:', error)
    // If token retrieval fails, redirect to signin
    if (!request.nextUrl.pathname.startsWith('/api/')) {
      if (request.nextUrl.pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/admin-auth/signin', request.url))
      }
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  if (!token || Object.keys(token).length === 0) {
    // Redirect to appropriate sign in page based on route
    if (!request.nextUrl.pathname.startsWith('/api/')) {
      if (request.nextUrl.pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/admin-auth/signin', request.url))
      }
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
    // Return 401 for API routes
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Multi-user security: Check session age and force re-authentication
  // Only check session age if the token has the required fields
  const loginTime = (token as any)?.loginTime
  const sessionId = (token as any)?.sessionId
  
  // If we have session tracking fields, validate them
  if (loginTime !== undefined || sessionId !== undefined) {
    const sessionAge = Date.now() - (loginTime || 0)
    const maxSessionAge = 24 * 60 * 60 * 1000 // 24 hours

    // Force re-authentication if no session ID or expired
    if (!sessionId || sessionAge > maxSessionAge) {
      // Session expired or invalid, force re-authentication
      if (!request.nextUrl.pathname.startsWith('/api/')) {
        if (request.nextUrl.pathname.startsWith('/admin')) {
          return NextResponse.redirect(new URL('/admin-auth/signin?error=session_expired', request.url))
        }
        return NextResponse.redirect(new URL('/auth/signin?error=session_expired', request.url))
      }
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }
  }

  // Handle admin authentication
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin-auth')) {
    console.log('[Middleware] Admin route check:', {
      path: request.nextUrl.pathname,
      hasToken: !!token,
      isAdmin: (token as any).isAdmin,
      userEmail: (token as any).email
    })
    
    if (!(token as any).isAdmin) {
      console.log('[Middleware] Redirecting to admin signin - not admin')
      return NextResponse.redirect(new URL('/admin-auth/signin?error=unauthorized', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/api/:path*',
    '/admin/:path*',
    '/admin-auth/:path*',
    '/dashboard/:path*',
    '/items/:path*',
    '/search/:path*',
    '/settings/:path*'
  ],
}

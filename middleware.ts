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

  // CRITICAL: Check if this is an auth route FIRST - before any other processing
  // This prevents middleware from interfering with signin page
  const pathname = request.nextUrl.pathname
  
  // Public routes that don't require authentication - check FIRST
  const publicRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/auth/signout',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/admin-auth/signin',
    '/admin-auth/signout',
    '/api/auth/',
    '/api/health',
    '/api/dashboard/simple', // Allow simple dashboard API without auth check
    '/building/', // Front door public interface
    '/api/building/', // Public building APIs
  ]
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )
  
  // Allow public routes - CRITICAL: Return immediately, don't process further
  if (isPublicRoute) {
    console.log('[Middleware] Allowing public route (early return):', pathname)
    return NextResponse.next()
  }

  // Handle root path specially - use meta refresh for Capacitor compatibility
  // Server-side redirects don't work reliably in Capacitor, so we inject meta refresh tag
  if (pathname === '/') {
    try {
      const token = await getToken({ req: request })
      if (!token || Object.keys(token).length === 0) {
        console.log('[Middleware] No token for root path, injecting meta refresh for Capacitor')
        // Instead of redirecting, inject meta refresh tag for Capacitor compatibility
        const response = NextResponse.next()
        // Inject meta refresh tag in the HTML response
        response.headers.set('X-Meta-Refresh', '0;url=/auth/signin')
        return response
      }
      // Has token - allow through to page.tsx
      console.log('[Middleware] Token found for root path, allowing access')
      return NextResponse.next()
    } catch (error) {
      console.error('[Middleware] Root path token error:', error)
      // On error, inject meta refresh
      const response = NextResponse.next()
      response.headers.set('X-Meta-Refresh', '0;url=/auth/signin')
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
    const isSuperAdmin = !!(token as any)?.isAdmin
    const isCommunityAdmin = !!(token as any)?.isCommunityAdmin
    const isBuildingAdmin = !!(token as any)?.isBuildingAdmin
    const isSupplierAdmin = !!(token as any)?.isSupplierAdmin
    const supplierIds = ((token as any)?.supplierIds as string[]) || []
    
    // Check if accessing supplier-specific route
    const supplierRouteMatch = request.nextUrl.pathname.match(/^\/admin\/suppliers\/([^\/]+)/)
    const requestedSupplierId = supplierRouteMatch ? supplierRouteMatch[1] : null
    
    console.log('[Middleware] Admin route check:', {
      path: request.nextUrl.pathname,
      hasToken: !!token,
      isSuperAdmin,
      isCommunityAdmin,
      isBuildingAdmin,
      isSupplierAdmin,
      userEmail: (token as any).email
    })
    
    // Allow if user has any admin privileges
    const hasAdminAccess = isSuperAdmin || isCommunityAdmin || isBuildingAdmin || (isSupplierAdmin && !!requestedSupplierId && supplierIds.includes(requestedSupplierId))
    
    if (!hasAdminAccess) {
      console.log('[Middleware] Redirecting to admin signin - not admin')
      return NextResponse.redirect(new URL('/admin-auth/signin?error=unauthorized', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only match routes that need authentication - explicitly exclude /auth
    '/',
    '/api/:path*',
    '/admin/:path*',
    '/dashboard/:path*',
    '/items/:path*',
    '/search/:path*',
    '/settings/:path*',
    '/building/:path*',
    '/community/:path*',
    '/duplicates/:path*',
    '/household/:path*',
    '/join/:path*',
    '/catering/:path*',
    // Explicitly DO NOT match:
    // - /auth/* (signin, signup, etc.)
    // - /admin-auth/* (admin auth pages)
    // - /api/auth/* (NextAuth routes)
    // - /_next/* (Next.js internals)
  ],
}

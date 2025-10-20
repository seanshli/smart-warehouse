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
    '/api/auth/',
    '/api/health'
  ]
  
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // Check authentication for all other routes
  const token = await getToken({ req: request })
  
  if (!token) {
    // Redirect to sign in for web routes
    if (!request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
    // Return 401 for API routes
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Handle admin authentication
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin-auth')) {
    if (!(token as any).isAdmin) {
      return NextResponse.redirect(new URL('/admin-auth/signin?error=unauthorized', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/admin-auth/:path*',
    '/dashboard/:path*',
    '/items/:path*',
    '/search/:path*'
  ],
}

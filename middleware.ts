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

  // Handle admin authentication
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin-auth')) {
    const token = await getToken({ req: request })
    
    // For now, allow admin access for specific admin users
    // TODO: Implement proper database admin check once schema is updated
    const isAdminUser = token?.email === 'admin@smartwarehouse.com' || token?.email === 'seanshlitw@gmail.com'
    
    if (!token || !isAdminUser) {
      return NextResponse.redirect(new URL('/admin-auth/signin', request.url))
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

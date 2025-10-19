import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Check if user is trying to access admin routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
      // Check if user has admin privileges
      if (!req.nextauth.token?.isAdmin) {
        // Redirect to admin sign-in page
        return NextResponse.redirect(new URL('/admin-auth/signin', req.url))
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to admin-auth routes without authentication
        if (req.nextUrl.pathname.startsWith('/admin-auth')) {
          return true
        }
        
        // For admin routes, check if user has admin privileges
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return !!token?.isAdmin
        }
        
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/admin-auth/:path*'
  ]
}

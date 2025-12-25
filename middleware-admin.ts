import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Check if user is trying to access admin routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
      const isSuperAdmin = req.nextauth.token?.isAdmin
      const isSupplierAdmin = req.nextauth.token?.isSupplierAdmin
      const supplierIds = (req.nextauth.token?.supplierIds as string[]) || []
      
      // Check if accessing supplier-specific route
      const supplierRouteMatch = req.nextUrl.pathname.match(/^\/admin\/suppliers\/([^\/]+)/)
      const requestedSupplierId = supplierRouteMatch ? supplierRouteMatch[1] : null
      
      // Allow access if:
      // 1. User is super admin, OR
      // 2. User is supplier admin AND accessing their own supplier route
      if (!isSuperAdmin && !(isSupplierAdmin && requestedSupplierId && supplierIds.includes(requestedSupplierId))) {
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
          const isSuperAdmin = !!token?.isAdmin
          const isSupplierAdmin = !!token?.isSupplierAdmin
          const supplierIds = (token?.supplierIds as string[]) || []
          
          // Check if accessing supplier-specific route
          const supplierRouteMatch = req.nextUrl.pathname.match(/^\/admin\/suppliers\/([^\/]+)/)
          const requestedSupplierId = supplierRouteMatch ? supplierRouteMatch[1] : null
          
          // Allow if super admin OR supplier admin accessing their supplier
          return isSuperAdmin || (isSupplierAdmin && requestedSupplierId && supplierIds.includes(requestedSupplierId))
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

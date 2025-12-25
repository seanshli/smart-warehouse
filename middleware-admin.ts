import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequestWithAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    // Middleware function - authorization is handled by the authorized callback
    // This function only runs if authorized returns true
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }): boolean => {
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
          return isSuperAdmin || (isSupplierAdmin && !!requestedSupplierId && supplierIds.includes(requestedSupplierId))
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

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
          const isCommunityAdmin = !!token?.isCommunityAdmin
          const isBuildingAdmin = !!token?.isBuildingAdmin
          const isSupplierAdmin = !!token?.isSupplierAdmin
          const communityIds = (token?.communityIds as string[]) || []
          const buildingIds = (token?.buildingIds as string[]) || []
          const supplierIds = (token?.supplierIds as string[]) || []
          
          // Super admin can access everything
          if (isSuperAdmin) {
            return true
          }
          
          // Check if accessing community-specific route
          const communityRouteMatch = req.nextUrl.pathname.match(/^\/admin\/communities\/([^\/]+)/)
          const requestedCommunityId = communityRouteMatch ? communityRouteMatch[1] : null
          
          // Check if accessing building-specific route
          const buildingRouteMatch = req.nextUrl.pathname.match(/^\/admin\/buildings\/([^\/]+)/)
          const requestedBuildingId = buildingRouteMatch ? buildingRouteMatch[1] : null
          
          // Check if accessing supplier-specific route
          const supplierRouteMatch = req.nextUrl.pathname.match(/^\/admin\/suppliers\/([^\/]+)/)
          const requestedSupplierId = supplierRouteMatch ? supplierRouteMatch[1] : null
          
          // Community admin: can only access their own communities
          if (requestedCommunityId) {
            return isCommunityAdmin && communityIds.includes(requestedCommunityId)
          }
          
          // Building admin: can only access their own buildings
          if (requestedBuildingId) {
            return isBuildingAdmin && buildingIds.includes(requestedBuildingId)
          }
          
          // Supplier admin: can only access their own suppliers
          if (requestedSupplierId) {
            return isSupplierAdmin && supplierIds.includes(requestedSupplierId)
          }
          
          // For general admin routes (like /admin, /admin/households), allow if user has any admin role
          // But restrict community/building/supplier admins from accessing super admin pages
          if (isCommunityAdmin || isBuildingAdmin || isSupplierAdmin) {
            // Allow access to their specific admin pages
            // Block access to super admin only pages (will be handled by individual API endpoints)
            return true
          }
          
          return false
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

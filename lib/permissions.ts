/**
 * Role-based access control for smart warehouse
 * Roles: OWNER, USER, VISITOR
 * Multiple OWNERs allowed per household
 */

export type UserRole = 'OWNER' | 'USER' | 'VISITOR'

export interface Permissions {
  // Household management
  canManageHousehold: boolean
  canManageMembers: boolean
  
  // Room management
  canManageRooms: boolean
  
  // Category management
  canManageCategories: boolean
  
  // Item management
  canManageItems: boolean
  canMoveItems: boolean
  
  // Watermark management
  canSetWatermark: boolean
  
  // User role management
  canManageRoles: boolean
}

/**
 * Get permissions for a user role
 */
export function getPermissions(role: UserRole): Permissions {
  switch (role) {
    case 'OWNER':
      return {
        canManageHousehold: true,
        canManageMembers: true,
        canManageRooms: true,
        canManageCategories: true,
        canManageItems: true,
        canMoveItems: true,
        canSetWatermark: true,
        canManageRoles: true
      }
    
    case 'USER':
      return {
        canManageHousehold: false,
        canManageMembers: true,
        canManageRooms: true,
        canManageCategories: true,
        canManageItems: true,
        canMoveItems: true,
        canSetWatermark: true,
        canManageRoles: false
      }
    
    case 'VISITOR':
      return {
        canManageHousehold: false,
        canManageMembers: false,
        canManageRooms: false,
        canManageCategories: false,
        canManageItems: true,
        canMoveItems: true,
        canSetWatermark: false,
        canManageRoles: false
      }
    
    default:
      return {
        canManageHousehold: false,
        canManageMembers: false,
        canManageRooms: false,
        canManageCategories: false,
        canManageItems: false,
        canMoveItems: false,
        canSetWatermark: false,
        canManageRoles: false
      }
  }
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: keyof Permissions): boolean {
  const permissions = getPermissions(role)
  return permissions[permission]
}

/**
 * Get role hierarchy (higher number = more permissions)
 */
export function getRoleLevel(role: UserRole): number {
  switch (role) {
    case 'OWNER': return 3
    case 'USER': return 2
    case 'VISITOR': return 1
    default: return 0
  }
}

/**
 * Check if one role can manage another role
 */
export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
  // Only OWNER can manage roles
  if (managerRole !== 'OWNER') return false
  
  // OWNER can manage all other roles
  return getRoleLevel(targetRole) < getRoleLevel(managerRole)
}

/**
 * Get available roles that can be assigned by a manager
 */
export function getAssignableRoles(managerRole: UserRole): UserRole[] {
  switch (managerRole) {
    case 'OWNER':
      return ['OWNER', 'USER', 'VISITOR'] // OWNERs can assign all roles including OWNER
    case 'USER':
    case 'VISITOR':
    default:
      return []
  }
}

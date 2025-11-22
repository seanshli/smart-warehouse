/**
 * Role-based access control for smart warehouse
 * Roles: OWNER, USER, VISITOR
 * Multiple OWNERs allowed per household
 */

export type UserRole = 'OWNER' | 'USER' | 'VISITOR'

/**
 * Community roles
 */
export type CommunityRole = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER'

/**
 * Working Group roles
 */
export type WorkingGroupRole = 'LEADER' | 'MEMBER'

/**
 * Working Group permission types
 */
export type WorkingGroupPermissionType = 
  | 'VIEW'
  | 'EDIT'
  | 'ADD'
  | 'REMOVE'
  | 'ADD_MEMBER'
  | 'REVOKE_MEMBER'
  | 'MANAGE_BUILDING'
  | 'MANAGE_HOUSEHOLD'
  | 'VIEW_REPORTS'
  | 'MANAGE_SECURITY'

/**
 * Working Group permission scopes
 */
export type WorkingGroupScope = 
  | 'ALL_BUILDINGS'
  | 'SPECIFIC_BUILDING'
  | 'SPECIFIC_HOUSEHOLD'
  | 'ALL_HOUSEHOLDS'

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

/**
 * Community permissions interface
 */
export interface CommunityPermissions {
  // Community management
  canManageCommunity: boolean
  canManageBuildings: boolean
  canManageMembers: boolean
  canManageWorkingGroups: boolean
  
  // Building management
  canViewBuildings: boolean
  canCreateBuildings: boolean
  canEditBuildings: boolean
  canDeleteBuildings: boolean
  
  // Member management
  canViewMembers: boolean
  canAddMembers: boolean
  canRemoveMembers: boolean
  canManageRoles: boolean
  
  // Working group management
  canViewWorkingGroups: boolean
  canCreateWorkingGroups: boolean
  canEditWorkingGroups: boolean
  canDeleteWorkingGroups: boolean
  canAssignWorkingGroupMembers: boolean
}

/**
 * Get permissions for a community role
 */
export function getCommunityPermissions(role: CommunityRole): CommunityPermissions {
  switch (role) {
    case 'ADMIN':
      return {
        canManageCommunity: true,
        canManageBuildings: true,
        canManageMembers: true,
        canManageWorkingGroups: true,
        canViewBuildings: true,
        canCreateBuildings: true,
        canEditBuildings: true,
        canDeleteBuildings: true,
        canViewMembers: true,
        canAddMembers: true,
        canRemoveMembers: true,
        canManageRoles: true,
        canViewWorkingGroups: true,
        canCreateWorkingGroups: true,
        canEditWorkingGroups: true,
        canDeleteWorkingGroups: true,
        canAssignWorkingGroupMembers: true,
      }
    
    case 'MANAGER':
      return {
        canManageCommunity: false,
        canManageBuildings: true,
        canManageMembers: true,
        canManageWorkingGroups: true,
        canViewBuildings: true,
        canCreateBuildings: true,
        canEditBuildings: true,
        canDeleteBuildings: false,
        canViewMembers: true,
        canAddMembers: true,
        canRemoveMembers: true,
        canManageRoles: true,
        canViewWorkingGroups: true,
        canCreateWorkingGroups: true,
        canEditWorkingGroups: true,
        canDeleteWorkingGroups: false,
        canAssignWorkingGroupMembers: true,
      }
    
    case 'MEMBER':
      return {
        canManageCommunity: false,
        canManageBuildings: false,
        canManageMembers: false,
        canManageWorkingGroups: false,
        canViewBuildings: true,
        canCreateBuildings: false,
        canEditBuildings: false,
        canDeleteBuildings: false,
        canViewMembers: true,
        canAddMembers: false,
        canRemoveMembers: false,
        canManageRoles: false,
        canViewWorkingGroups: true,
        canCreateWorkingGroups: false,
        canEditWorkingGroups: false,
        canDeleteWorkingGroups: false,
        canAssignWorkingGroupMembers: false,
      }
    
    case 'VIEWER':
      return {
        canManageCommunity: false,
        canManageBuildings: false,
        canManageMembers: false,
        canManageWorkingGroups: false,
        canViewBuildings: true,
        canCreateBuildings: false,
        canEditBuildings: false,
        canDeleteBuildings: false,
        canViewMembers: true,
        canAddMembers: false,
        canRemoveMembers: false,
        canManageRoles: false,
        canViewWorkingGroups: true,
        canCreateWorkingGroups: false,
        canEditWorkingGroups: false,
        canDeleteWorkingGroups: false,
        canAssignWorkingGroupMembers: false,
      }
    
    default:
      return {
        canManageCommunity: false,
        canManageBuildings: false,
        canManageMembers: false,
        canManageWorkingGroups: false,
        canViewBuildings: false,
        canCreateBuildings: false,
        canEditBuildings: false,
        canDeleteBuildings: false,
        canViewMembers: false,
        canAddMembers: false,
        canRemoveMembers: false,
        canManageRoles: false,
        canViewWorkingGroups: false,
        canCreateWorkingGroups: false,
        canEditWorkingGroups: false,
        canDeleteWorkingGroups: false,
        canAssignWorkingGroupMembers: false,
      }
  }
}

/**
 * Get role hierarchy for community roles (higher number = more permissions)
 */
export function getCommunityRoleLevel(role: CommunityRole): number {
  switch (role) {
    case 'ADMIN': return 4
    case 'MANAGER': return 3
    case 'MEMBER': return 2
    case 'VIEWER': return 1
    default: return 0
  }
}

/**
 * Check if one community role can manage another role
 */
export function canManageCommunityRole(managerRole: CommunityRole, targetRole: CommunityRole): boolean {
  // Only ADMIN and MANAGER can manage roles
  if (managerRole !== 'ADMIN' && managerRole !== 'MANAGER') return false
  
  // ADMIN can manage all roles
  if (managerRole === 'ADMIN') return true
  
  // MANAGER can manage MEMBER and VIEWER
  if (managerRole === 'MANAGER') {
    return getCommunityRoleLevel(targetRole) < getCommunityRoleLevel(managerRole)
  }
  
  return false
}

/**
 * Get available community roles that can be assigned by a manager
 */
export function getAssignableCommunityRoles(managerRole: CommunityRole): CommunityRole[] {
  switch (managerRole) {
    case 'ADMIN':
      return ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']
    case 'MANAGER':
      return ['MEMBER', 'VIEWER']
    case 'MEMBER':
    case 'VIEWER':
    default:
      return []
  }
}

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getPermissions, Permissions, UserRole } from '@/lib/permissions'

interface Household {
  id: string
  name: string
  description: string | null
  createdAt: string
}

interface Membership {
  id: string
  role: UserRole
  joinedAt?: string
  household: Household
}

interface HouseholdContextType {
  household: Household | null
  role: UserRole | null
  permissions: Permissions | null
  loading: boolean
  error: string | null
  memberships: Membership[]
  activeHouseholdId: string | null
  setActiveHousehold: (householdId: string) => void
  refetch: () => Promise<void>
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined)

export function useHousehold() {
  const context = useContext(HouseholdContext)
  if (context === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider')
  }
  return context
}

interface HouseholdProviderProps {
  children: React.ReactNode
}

export function HouseholdProvider({ children }: HouseholdProviderProps) {
  const { data: session, status } = useSession()
  const [household, setHousehold] = useState<Household | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [activeHouseholdId, setActiveHouseholdId] = useState<string | null>(null)

  const selectActiveFrom = (all: Membership[], preferredId?: string | null) => {
    if (!all || all.length === 0) return null
    const fromStorage = preferredId || (typeof window !== 'undefined' ? localStorage.getItem('activeHouseholdId') : null)
    const found = all.find(m => m.household.id === fromStorage)
    if (found) return found
    // default to first membership
    return all[0]
  }

  const applyActive = (active: Membership | null) => {
    if (!active) {
      setHousehold(null)
      setRole(null)
      setPermissions(null)
      setActiveHouseholdId(null)
      return
    }
    setHousehold(active.household)
    setRole(active.role)
    setPermissions(getPermissions(active.role))
    setActiveHouseholdId(active.household.id)
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeHouseholdId', active.household.id)
    }
  }

  const fetchHousehold = async () => {
    if (!session?.user) {
      setHousehold(null)
      setRole(null)
      setPermissions(null)
      setMemberships([])
      setActiveHouseholdId(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/user/household')
      if (!response.ok) {
        throw new Error('Failed to fetch household information')
      }

      const data = await response.json()

      const apiMemberships: Membership[] = (data.memberships || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
        household: m.household
      }))
      setMemberships(apiMemberships)

      const active = selectActiveFrom(apiMemberships, activeHouseholdId)
      applyActive(active)
    } catch (err) {
      console.error('Error fetching household:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setHousehold(null)
      setRole(null)
      setPermissions(null)
      setMemberships([])
      setActiveHouseholdId(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      setHousehold(null)
      setRole(null)
      setPermissions(null)
      setMemberships([])
      setActiveHouseholdId(null)
      setLoading(false)
      setError(null)
      return
    }

    fetchHousehold()
  }, [session, status])

  const setActiveHousehold = (householdId: string) => {
    const active = memberships.find(m => m.household.id === householdId) || null
    applyActive(active)
    
    // Instead of immediate reload, try to refresh data gracefully
    if (typeof window !== 'undefined') {
      // Clear all caches
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => caches.delete(cacheName))
        }).catch(error => {
          console.warn('Cache clearing failed:', error)
        })
      }
      
      // Clear localStorage and sessionStorage
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (error) {
        console.warn('Storage clearing failed:', error)
      }
      
      // Try to refresh data first, then reload if needed
      setTimeout(() => {
        try {
          // Trigger a data refresh by calling refetch
          fetchHousehold()
          
          // If that doesn't work, do a soft reload
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        } catch (error) {
          console.error('Household switch error:', error)
          // Fallback to hard reload
          window.location.reload()
        }
      }, 100)
    }
  }

  const value: HouseholdContextType = {
    household,
    role,
    permissions,
    loading,
    error,
    memberships,
    activeHouseholdId,
    setActiveHousehold,
    refetch: fetchHousehold
  }

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  )
}

export function usePermissions() {
  const { permissions } = useHousehold()
  return permissions
}

export function useRole() {
  const { role } = useHousehold()
  return role
}

interface PermissionGateProps {
  permission: keyof Permissions
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const permissions = usePermissions()
  if (!permissions || !permissions[permission]) {
    return <>{fallback}</>
  }
  return <>{children}</>
}

interface RoleGateProps {
  roles: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const role = useRole()
  if (!role || !roles.includes(role)) {
    return <>{fallback}</>
  }
  return <>{children}</>
}

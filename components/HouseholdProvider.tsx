'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { getPermissions, Permissions, UserRole } from '@/lib/permissions'

interface Household {
  id: string
  name: string
  description: string | null
  createdAt: string
  // Optional building linkage (used for property services links)
  buildingId?: string | null
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
  switching: boolean
  refreshTrigger: number
  setActiveHousehold: (householdId: string) => void
  refetch: () => Promise<void>
  forceRefresh: () => void
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
  const [mounted, setMounted] = useState(false)
  const [household, setHousehold] = useState<Household | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [activeHouseholdId, setActiveHouseholdId] = useState<string | null>(null)
  const [switching, setSwitching] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Set mounted to true after hydration to prevent SSR/client mismatches
  useEffect(() => {
    setMounted(true)
  }, [])

  // Trigger refresh when household changes (for external components)
  useEffect(() => {
    if (mounted && household) {
      console.log('🔄 Household changed, triggering refresh for external components')
      setRefreshTrigger(prev => {
        const newTrigger = prev + 1
        console.log('🔄 Refresh trigger updated due to household change:', newTrigger)
        return newTrigger
      })
    }
  }, [household?.id, mounted]) // Only trigger when household ID changes

  // Helper function to select active household from memberships
  const selectActiveFrom = (memberships: Membership[], preferredId?: string | null): Membership | null => {
    if (!memberships || memberships.length === 0) return null
    
    // If preferredId is provided and exists in memberships, use it
    if (preferredId) {
      const preferred = memberships.find(m => m.household.id === preferredId)
      if (preferred) return preferred
    }
    
    // Otherwise, use the first membership
    return memberships[0]
  }

  // Helper function to apply active household
  const applyActive = (active: Membership | null) => {
    console.log('🎯 applyActive called with:', active ? { id: active.household.id, name: active.household.name, role: active.role } : 'null')
    
    if (active) {
      console.log('🎯 Setting household to:', active.household.name)
      setHousehold(active.household)
      setRole(active.role)
      setPermissions(getPermissions(active.role))
      setActiveHouseholdId(active.household.id)
      console.log('🎯 State should now be:', { household: active.household.name, role: active.role, id: active.household.id })
    } else {
      console.log('🎯 Clearing household state')
      setHousehold(null)
      setRole(null)
      setPermissions(null)
      setActiveHouseholdId(null)
    }
  }

  // Fetch household data
  const fetchHousehold = async () => {
    if (!session?.user) {
      setHousehold(null)
      setRole(null)
      setPermissions(null)
      setMemberships([])
      setActiveHouseholdId(null)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/user/household', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.details || 'Failed to fetch household information'
        console.error('Household API error:', errorMessage, errorData)
        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Safely handle response data
      if (!data || typeof data !== 'object') {
        console.warn('[HouseholdProvider] Invalid household API response:', data)
        setMemberships([])
        setActiveHouseholdId(null)
        setHousehold(null)
        setRole(null)
        setPermissions(null)
        setLoading(false)
        setError(null) // Clear error for invalid response
        return
      }
      
      // Log response for debugging
      console.log('[HouseholdProvider] Household API response:', {
        hasMemberships: !!(data.memberships && data.memberships.length > 0),
        membershipsCount: data.memberships?.length || 0,
        householdId: data.householdId
      })
      
      // If no memberships, user needs to create or join a household
      if (!data.memberships || data.memberships.length === 0) {
        console.log('[HouseholdProvider] No household memberships found for user')
        setMemberships([])
        setActiveHouseholdId(null)
        setHousehold(null)
        setRole(null)
        setPermissions(null)
        setLoading(false)
        setError(null) // This is not an error, just no households yet
        return
      }

      const apiMemberships: Membership[] = (data.memberships || []).map((m: any) => {
        if (!m || !m.household) {
          console.warn('Invalid membership data:', m)
          return null
        }
        return {
          id: m.id,
          role: m.role,
          joinedAt: m.joinedAt,
          household: m.household
        }
      }).filter((m: Membership | null): m is Membership => m !== null)
      
      setMemberships(apiMemberships)

      // Get preferred household ID from localStorage first, then current state
      let preferredId = null
      if (mounted && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        try {
          // Check if this is a fresh login by comparing session IDs
          const storedSessionId = localStorage.getItem('lastSessionId')
          const currentSessionId = (session as any)?.sessionId
          
          if (currentSessionId && storedSessionId !== currentSessionId) {
            // Fresh login detected - clear household selection
            console.log('🏠 Fresh login detected, clearing household selection')
            localStorage.removeItem('activeHouseholdId')
            localStorage.setItem('lastSessionId', currentSessionId)
          } else if (currentSessionId) {
            // Store current session ID for future comparison
            localStorage.setItem('lastSessionId', currentSessionId)
          }
          
          const storedId = localStorage.getItem('activeHouseholdId')
          if (storedId) {
            preferredId = storedId
            console.log('🏠 Restoring household from localStorage:', storedId)
          }
        } catch (error) {
          console.warn('Error accessing localStorage:', error)
        }
      }
      
      // Fallback to current state if no localStorage value
      if (!preferredId) {
        preferredId = activeHouseholdId
        console.log('🏠 Using current activeHouseholdId:', activeHouseholdId)
      }

      const active = selectActiveFrom(apiMemberships, preferredId)
      console.log('🏠 Selected active household:', active ? { id: active.household.id, name: active.household.name, role: active.role } : 'None')
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

  // Simplified household switching
  const setActiveHousehold = useCallback((householdId: string) => {
    console.log('🔄 ===== HOUSEHOLD SWITCHING STARTED =====')
    console.log('🔄 Switching to household:', householdId)
    console.log('📋 Available memberships:', memberships.map(m => ({ id: m.household.id, name: m.household.name, role: m.role })))
    console.log('🏠 Current activeHouseholdId:', activeHouseholdId)
    console.log('🏠 Current household:', household ? { id: household.id, name: household.name } : 'None')
    
    // Set switching flag to prevent fetchHousehold from running
    isSwitchingRef.current = true
    setSwitching(true)
    setError(null)
    
    // Find the membership for this household
    const targetMembership = memberships.find(m => m.household.id === householdId)
    
    if (!targetMembership) {
      console.error('❌ Household not found in memberships:', householdId)
      setError(`Household ${householdId} not found in your memberships`)
      setSwitching(false)
      isSwitchingRef.current = false
      return
    }

    console.log('✅ Found target membership:', { id: targetMembership.household.id, name: targetMembership.household.name, role: targetMembership.role })

    // Store the selection in localStorage FIRST before applying
    if (mounted && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('activeHouseholdId', householdId)
        console.log('💾 Stored household ID in localStorage:', householdId)
        // Verify it was stored
        const stored = localStorage.getItem('activeHouseholdId')
        console.log('💾 Verified stored value:', stored)
      } catch (error) {
        console.warn('Error storing to localStorage:', error)
      }
    }

    // Apply the new active household immediately
    console.log('🎯 Applying active household...')
    applyActive(targetMembership)
    console.log('🎯 Applied active household:', targetMembership.household.name)
    console.log('🏠 New activeHouseholdId should be:', targetMembership.household.id)
    
    // Clear caches to ensure fresh data
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then(cacheNames => {
        console.log('🗑️ Clearing caches:', cacheNames)
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName)
        })
      }).catch(error => {
        console.warn('Cache clearing failed:', error)
      })
    }

    // Mark switching as complete after a short delay to ensure state updates
    setTimeout(() => {
      setSwitching(false)
      isSwitchingRef.current = false
      console.log('✅ ===== HOUSEHOLD SWITCHING COMPLETED =====')
    }, 200)
  }, [memberships, activeHouseholdId, household, mounted])

  // Refetch function for external use
  const refetch = async () => {
    await fetchHousehold()
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

  const forceRefresh = useCallback(() => {
    console.log('🔄 HouseholdProvider: Force refresh triggered')
    setRefreshTrigger(prev => prev + 1)
  }, [])

  const value: HouseholdContextType = {
    household,
    role,
    permissions,
    loading,
    error,
    memberships,
    activeHouseholdId,
    switching,
    refreshTrigger,
    setActiveHousehold,
    refetch,
    forceRefresh
  }

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  )
}

// Permission-based component wrapper
export function PermissionGate({ 
  permission, 
  children, 
  fallback = null 
}: { 
  permission: keyof Permissions
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { permissions } = useHousehold()
  
  if (!permissions || !permissions[permission]) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

// Role-based component wrapper
export function RoleGate({ 
  roles, 
  children, 
  fallback = null 
}: { 
  roles: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { role } = useHousehold()
  
  if (!role || !roles.includes(role)) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}
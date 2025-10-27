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
  switching: boolean
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
  const [switching, setSwitching] = useState(false)

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
    if (active) {
      setHousehold(active.household)
      setRole(active.role)
      setPermissions(getPermissions(active.role))
      setActiveHouseholdId(active.household.id)
    } else {
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

      // Get preferred household ID from localStorage
      let preferredId = null
      if (typeof window !== 'undefined') {
        preferredId = localStorage.getItem('activeHouseholdId')
      }

      const active = selectActiveFrom(apiMemberships, preferredId)
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
  const setActiveHousehold = (householdId: string) => {
    console.log('🔄 Switching to household:', householdId)
    console.log('📋 Available memberships:', memberships.map(m => ({ id: m.household.id, name: m.household.name, role: m.role })))
    
    setSwitching(true)
    setError(null)
    
    // Find the membership for this household
    const targetMembership = memberships.find(m => m.household.id === householdId)
    
    if (!targetMembership) {
      console.error('❌ Household not found in memberships:', householdId)
      setError(`Household ${householdId} not found in your memberships`)
      setSwitching(false)
      return
    }

    console.log('✅ Found target membership:', { id: targetMembership.household.id, name: targetMembership.household.name, role: targetMembership.role })

    // Store the selection in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeHouseholdId', householdId)
      console.log('💾 Stored household ID in localStorage:', householdId)
    }

    // Apply the new active household immediately
    applyActive(targetMembership)
    console.log('🎯 Applied active household:', targetMembership.household.name)
    
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

    // Refresh data after a short delay to ensure the switch is complete
    setTimeout(() => {
      console.log('🔄 Refreshing household data...')
      fetchHousehold().finally(() => {
        setSwitching(false)
      })
    }, 300)
  }

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

  const value: HouseholdContextType = {
    household,
    role,
    permissions,
    loading,
    error,
    memberships,
    activeHouseholdId,
    switching,
    setActiveHousehold,
    refetch
  }

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  )
}
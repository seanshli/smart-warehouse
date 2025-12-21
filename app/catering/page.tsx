'use client'

import { useSession } from 'next-auth/react'
import { useHousehold } from '@/components/HouseholdProvider'
import CateringMenu from '@/components/catering/CateringMenu'
import { ShoppingCartIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function CateringPage() {
  const { data: session } = useSession()
  const { household, activeHouseholdId } = useHousehold()
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    loadCartCount()
    const interval = setInterval(loadCartCount, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const loadCartCount = async () => {
    try {
      const response = await fetch('/api/catering/cart', {
        credentials: 'include',
      })
      const data = await response.json()
      setCartCount(data.items?.length || 0)
    } catch (error) {
      console.error('Error loading cart count:', error)
    }
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Please sign in to view the menu</p>
      </div>
    )
  }

  if (!activeHouseholdId || !household) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Please select a household to view the menu</p>
      </div>
    )
  }

  // Get building ID from household
  const buildingId = household?.buildingId || undefined

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Catering Menu</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Order food for your household
          </p>
        </div>
        <Link
          href="/catering/cart"
          className="relative flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium transition-colors"
        >
          <ShoppingCartIcon className="h-5 w-5" />
          Cart
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      <CateringMenu
        buildingId={buildingId}
        communityId={undefined}
        householdId={activeHouseholdId}
      />
    </div>
  )
}

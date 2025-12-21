'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import CateringMenuItemCard from './CateringMenuItemCard'
import { FunnelIcon } from '@heroicons/react/24/outline'

interface CateringService {
  id: string
  buildingId?: string
  communityId?: string
  isActive: boolean
}

interface CateringCategory {
  id: string
  name: string
  description?: string
  displayOrder: number
}

interface CateringMenuItem {
  id: string
  name: string
  description?: string
  imageUrl?: string
  cost: number | string
  quantityAvailable: number
  isActive: boolean
  availableAllDay: boolean
  category?: {
    id: string
    name: string
  }
  timeSlots?: Array<{
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
  }>
}

interface CateringMenuProps {
  buildingId?: string
  communityId?: string
  householdId?: string
}

export default function CateringMenu({ buildingId, communityId, householdId }: CateringMenuProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [service, setService] = useState<CateringService | null>(null)
  const [categories, setCategories] = useState<CateringCategory[]>([])
  const [menuItems, setMenuItems] = useState<CateringMenuItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadMenu()
  }, [buildingId, communityId])

  const loadMenu = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (buildingId) params.append('buildingId', buildingId)
      if (communityId) params.append('communityId', communityId)

      // If we have buildingId but no communityId, try to fetch building first
      if (buildingId && !communityId) {
        try {
          const buildingRes = await fetch(`/api/building/${buildingId}`, {
            credentials: 'include',
          })
          if (buildingRes.ok) {
            const buildingData = await buildingRes.json()
            if (buildingData.building?.communityId) {
              params.set('communityId', buildingData.building.communityId)
            }
          }
        } catch (err) {
          console.error('Error fetching building:', err)
        }
      }

      const response = await fetch(`/api/catering/menu?${params.toString()}`, {
        credentials: 'include',
      })
      const data = await response.json()

      if (data.service) {
        setService(data.service)
        setCategories(data.categories || [])
        setMenuItems(data.menuItems || [])
      } else {
        setService(null)
        setCategories([])
        setMenuItems([])
      }
    } catch (error) {
      console.error('Error loading menu:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (itemId: string, quantity: number) => {
    try {
      const response = await fetch('/api/catering/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ menuItemId: itemId, quantity }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add to cart')
      }

      return response.json()
    } catch (error) {
      console.error('Error adding to cart:', error)
      throw error
    }
  }

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = !selectedCategory || item.category?.id === selectedCategory
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch && item.isActive
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 max-w-2xl mx-auto">
          <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
            Catering service not enabled
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
            Catering service has not been enabled for this building/community yet.
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            Please contact an administrator to enable the catering service.
          </p>
        </div>
      </div>
    )
  }

  if (!service.isActive) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 max-w-2xl mx-auto">
          <p className="text-gray-800 dark:text-gray-200 font-medium mb-2">
            Catering service is currently inactive
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            The catering service for this building/community is temporarily unavailable.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="relative">
          <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {/* Menu Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <CateringMenuItemCard
              key={item.id}
              item={item}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || selectedCategory
              ? 'No items found matching your criteria.'
              : 'No menu items available.'}
          </p>
        </div>
      )}
    </div>
  )
}

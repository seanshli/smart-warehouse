'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CateringMenuItemCard from './CateringMenuItemCard'
import { FunnelIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/components/LanguageProvider'
import { useTranslation } from '@/lib/useTranslation'

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
  const router = useRouter()
  const { currentLanguage } = useLanguage()
  const { translateText } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [service, setService] = useState<CateringService | null>(null)
  const [categories, setCategories] = useState<CateringCategory[]>([])
  const [menuItems, setMenuItems] = useState<CateringMenuItem[]>([])
  const [translatedItems, setTranslatedItems] = useState<CateringMenuItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [cartItemCount, setCartItemCount] = useState(0)

  useEffect(() => {
    loadMenu()
    loadCartCount()
  }, [buildingId, communityId])

  // Translate menu items when language or items change
  useEffect(() => {
    const translateItems = async () => {
      if (menuItems.length === 0) {
        setTranslatedItems([])
        return
      }

      try {
        const translated = await Promise.all(
          menuItems.map(async (item) => {
            const translatedName = await translateText(item.name, currentLanguage)
            const translatedDescription = item.description 
              ? await translateText(item.description, currentLanguage)
              : item.description
            
            return {
              ...item,
              name: translatedName,
              description: translatedDescription,
            }
          })
        )
        setTranslatedItems(translated)
      } catch (error) {
        console.error('Error translating menu items:', error)
        // Fallback to original items
        setTranslatedItems(menuItems)
      }
    }

    translateItems()
  }, [menuItems, currentLanguage, translateText])

  const loadCartCount = async () => {
    try {
      const response = await fetch('/api/catering/cart', {
        credentials: 'include',
      })
      if (response.ok) {
        const cart = await response.json()
        setCartItemCount(cart.items?.length || 0)
      }
    } catch (error) {
      console.error('Error loading cart count:', error)
    }
  }

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

  const handleAddToCart = async (itemId: string, quantity: number, isVegetarian: boolean, spiceLevel: string) => {
    try {
      const response = await fetch('/api/catering/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          menuItemId: itemId, 
          quantity,
          isVegetarian,
          spiceLevel,
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to add to cart'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          // Response is not JSON, try to get text
          const text = await response.text().catch(() => 'Unknown error')
          errorMessage = `Server error (${response.status}): ${text.substring(0, 100)}`
        }
        throw new Error(errorMessage)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('[CateringMenu] Non-JSON response:', text.substring(0, 200))
        throw new Error('Invalid response format from server')
      }

      const result = await response.json()
      console.log('[CateringMenu] Add to cart response:', result)
      await loadCartCount()
      
      // Small delay to ensure cookie is set before navigation
      await new Promise(resolve => setTimeout(resolve, 100))
      
      return result
    } catch (error) {
      console.error('[CateringMenu] Error adding to cart:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Failed to add item to cart')
    }
  }

  // Use translated items for filtering and display
  const itemsToFilter = translatedItems.length > 0 ? translatedItems : menuItems
  
  const filteredItems = itemsToFilter.filter((item) => {
    const matchesCategory = !selectedCategory || item.category?.id === selectedCategory
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    // Only filter by isActive - don't filter by quantityAvailable (allow items with 0 quantity for pre-orders)
    return matchesCategory && matchesSearch && item.isActive
  })
  
  // Log filtered items for debugging
  useEffect(() => {
    if (filteredItems.length > 0) {
      console.log('[CateringMenu] Filtered items:', filteredItems.map(item => ({
        name: item.name,
        category: item.category?.name,
        isActive: item.isActive,
        quantityAvailable: item.quantityAvailable,
      })))
    }
  }, [filteredItems])

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
      {/* Header with Cart Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Menu</h2>
        <button
          onClick={async () => {
            // Reload cart count before navigating to ensure we have latest data
            await loadCartCount()
            // Small delay to ensure any pending cart operations complete
            await new Promise(resolve => setTimeout(resolve, 200))
            router.push('/catering/cart')
          }}
          className="relative inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium transition-colors"
        >
          <ShoppingCartIcon className="h-5 w-5 mr-2" />
          Cart
          {cartItemCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-white text-primary-600 rounded-full text-xs font-bold">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

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

      {/* Menu Items by Category */}
      {filteredItems.length > 0 ? (
        (() => {
          // Group items by category
          const itemsByCategory = filteredItems.reduce((acc, item) => {
            const categoryId = item.category?.id || 'uncategorized'
            const categoryName = item.category?.name || 'Uncategorized'
            if (!acc[categoryId]) {
              acc[categoryId] = {
                id: categoryId,
                name: categoryName,
                items: []
              }
            }
            acc[categoryId].items.push(item)
            return acc
          }, {} as Record<string, { id: string; name: string; items: CateringMenuItem[] }>)

          // Sort categories by display order
          const sortedCategories = Object.values(itemsByCategory).sort((a, b) => {
            const categoryA = categories.find(c => c.id === a.id)
            const categoryB = categories.find(c => c.id === b.id)
            const orderA = categoryA?.displayOrder ?? 999
            const orderB = categoryB?.displayOrder ?? 999
            return orderA - orderB
          })

          return (
            <div className="space-y-8">
              {sortedCategories.map((category) => (
                <div key={category.id} className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    {category.name}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {category.items.map((item) => (
                      <CateringMenuItemCard
                        key={item.id}
                        item={item}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        })()
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

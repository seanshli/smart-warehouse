'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from './LanguageProvider'
import ItemCard from './ItemCard'

interface Item {
  id: string
  name: string
  description?: string
  quantity: number
  minQuantity: number
  imageUrl?: string
  category?: {
    id: string
    name: string
    parent?: {
      name: string
    }
  }
  room?: {
    id: string
    name: string
  }
  cabinet?: {
    id: string
    name: string
  }
  itemIds?: string[] // Track all item IDs for this group (optional)
}

interface ItemsListProps {
  showCategory?: boolean
  showLocation?: boolean
  onItemEdit?: (item: Item) => void
  onItemMove?: (item: Item) => void
  onItemCheckout?: (item: Item) => void
  onItemHistory?: (item: Item) => void
  className?: string
  searchTerm?: string
  selectedCategory?: string
  selectedRoom?: string
  onRef?: (refreshFn: () => void) => void
}

export default function ItemsList({
  showCategory = false,
  showLocation = false,
  onItemEdit,
  onItemMove,
  onItemCheckout,
  onItemHistory,
  className = '',
  searchTerm = '',
  selectedCategory = '',
  selectedRoom = '',
  onRef
}: ItemsListProps) {
  const { t } = useLanguage()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGroupedItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Add a small delay to prevent rapid-fire requests
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedRoom) params.append('room', selectedRoom)
      
      const url = `/api/items${params.toString() ? '?' + params.toString() : ''}`
      console.log('ItemsList: Fetching from URL:', url)
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        console.log('ItemsList: Successfully fetched', data.length, 'items')
        setItems(data)
      } else {
        let errorMessage = 'Failed to fetch items'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
        }
        console.error('ItemsList: API error:', response.status, errorMessage)
        setError(errorMessage)
      }
    } catch (err) {
      console.error('Error fetching grouped items:', err)
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, selectedCategory, selectedRoom])

  useEffect(() => {
    fetchGroupedItems()
  }, [fetchGroupedItems])

  // Expose refresh function to parent component
  useEffect(() => {
    console.log('ItemsList: onRef callback available:', !!onRef)
    if (onRef) {
      console.log('ItemsList: Calling onRef with fetchGroupedItems function')
      onRef(fetchGroupedItems)
    }
  }, [onRef, fetchGroupedItems])

  // Filter items on the client side as well for better responsiveness
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || 
      item.category?.id === selectedCategory ||
      item.category?.name === selectedCategory
    
    const matchesRoom = !selectedRoom || 
      item.room?.id === selectedRoom ||
      item.room?.name === selectedRoom
    
    return matchesSearch && matchesCategory && matchesRoom
  })

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Error loading items
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchGroupedItems}
                className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-700"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (filteredItems.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          {searchTerm || selectedCategory || selectedRoom ? t('noItemsFound') : t('noItemsFound')}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {searchTerm || selectedCategory || selectedRoom 
            ? t('searchTips') 
            : t('startAddingItems')
          }
        </p>
        <div className="mt-4">
          <button
            onClick={() => {
              // Force hard refresh
              window.location.reload();
            }}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {t('forceRefreshPage')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {t('allItems')} ({filteredItems.length})
        </h3>
        <button
          onClick={fetchGroupedItems}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          {t('refresh')}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            showCategory={showCategory}
            showLocation={showLocation}
            onEdit={(itemData) => {
              console.log('ItemsList: onItemEdit called for:', itemData.name)
              onItemEdit?.(itemData)
            }}
            onMove={(itemData) => {
              console.log('ItemsList: onItemMove called for:', itemData.name)
              onItemMove?.(itemData)
            }}
            onCheckout={(itemData) => {
              console.log('ItemsList: onItemCheckout called for:', itemData.name)
              onItemCheckout?.(itemData)
            }}
            onHistory={(itemData) => {
              console.log('ItemsList: onItemHistory called for:', itemData.name)
              onItemHistory?.(itemData)
            }}
          />
        ))}
      </div>
    </div>
  )
}

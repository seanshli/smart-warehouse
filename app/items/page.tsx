'use client'

import { useState, useRef } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import ItemsList from '@/components/ItemsList'
import AddItemModal from '@/components/AddItemModal'
import EditItemModal from '@/components/EditItemModal'
import MoveItemModal from '@/components/MoveItemModal'
import CheckoutModal from '@/components/CheckoutModal'
import QuantityAdjustModal from '@/components/QuantityAdjustModal'
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'

interface Item {
  id: string
  name: string
  description?: string
  quantity: number
  minQuantity: number
  imageUrl?: string
  category?: {
    id?: string
    name: string
    parent?: {
      name: string
    }
  }
  room?: {
    id?: string
    name: string
  }
  cabinet?: {
    id?: string
    name: string
  }
}

export default function ItemsPage() {
  const { t } = useLanguage()
  const [showAddItem, setShowAddItem] = useState(false)
  const [showEditItem, setShowEditItem] = useState(false)
  const [showMoveItem, setShowMoveItem] = useState(false)
  const [showCheckoutItem, setShowCheckoutItem] = useState(false)
  const [showQuantityAdjust, setShowQuantityAdjust] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const refreshItemsListRef = useRef<(() => void) | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl sm:truncate">
                  {t('items')}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Manage your inventory items with photos and quantities
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
                <button
                  onClick={async () => {
                    try {
                      console.log('Starting item duplicate check...')
                      const response = await fetch('/api/items/check-duplicates', { method: 'POST' })
                      const result = await response.json()
                      
                      if (response.ok) {
                        if (result.duplicates && result.duplicates.length > 0) {
                          alert(`Found ${result.duplicates.length} groups of duplicate items. Check console for details.`)
                          console.log('Duplicate items:', result.duplicates)
                        } else {
                          alert('No duplicate items found.')
                        }
                      } else {
                        alert(`Duplicate check error: ${result.error}`)
                      }
                    } catch (error) {
                      console.error('Item duplicate check error:', error)
                      alert(`Duplicate check error: ${error}`)
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 border border-orange-300 dark:border-orange-600 rounded-md shadow-sm text-sm font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900 hover:bg-orange-100 dark:hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  🔍 {t('checkDuplicates') || 'Check Duplicates'}
                </button>
                <button
                  onClick={() => setShowAddItem(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  {t('addItem')}
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Search */}
                <div className="flex-1 max-w-lg">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder={t('searchItems')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  {t('filters')}
                </button>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('category')}
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">{t('allCategories')}</option>
                        {/* Categories will be loaded dynamically */}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('room')}
                      </label>
                      <select
                        value={selectedRoom}
                        onChange={(e) => setSelectedRoom(e.target.value)}
                        className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">{t('allRooms')}</option>
                        {/* Rooms will be loaded dynamically */}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setSelectedCategory('')
                          setSelectedRoom('')
                          setSearchTerm('')
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        {t('clearFilters')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <ItemsList 
          showCategory={true}
          showLocation={true}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          selectedRoom={selectedRoom}
          onRef={(refreshFn) => {
            refreshItemsListRef.current = refreshFn
          }}
          onItemEdit={(item) => {
            setSelectedItem(item)
            setShowEditItem(true)
          }}
          onItemMove={(item) => {
            setSelectedItem(item)
            setShowMoveItem(true)
          }}
          onItemCheckout={(item) => {
            setSelectedItem(item)
            setShowCheckoutItem(true)
          }}
          onItemHistory={(item) => {
            // TODO: Implement history functionality - for now just log
            console.log('View history for item:', item)
          }}
          onItemQuantityAdjust={(item: Item) => {
            setSelectedItem(item)
            setShowQuantityAdjust(true)
          }}
        />
      </div>

      {/* Modals */}
      {showAddItem && (
        <AddItemModal onClose={() => {
          setShowAddItem(false)
          if (refreshItemsListRef.current) {
            refreshItemsListRef.current()
          }
        }} />
      )}
      
      {showEditItem && selectedItem && (
        <EditItemModal 
          item={selectedItem} 
          onClose={() => {
            setShowEditItem(false)
            setSelectedItem(null)
          }}
          onSuccess={() => {
            setShowEditItem(false)
            setSelectedItem(null)
            if (refreshItemsListRef.current) {
              refreshItemsListRef.current()
            }
          }}
        />
      )}
      
      {showMoveItem && selectedItem && (
        <MoveItemModal 
          item={selectedItem} 
          onClose={() => {
            setShowMoveItem(false)
            setSelectedItem(null)
          }}
          onSuccess={() => {
            setShowMoveItem(false)
            setSelectedItem(null)
            if (refreshItemsListRef.current) {
              refreshItemsListRef.current()
            }
          }}
        />
      )}
      
      {showCheckoutItem && selectedItem && (
        <CheckoutModal 
          item={selectedItem}
          onClose={() => {
            setShowCheckoutItem(false)
            setSelectedItem(null)
          }}
          onSuccess={() => {
            setShowCheckoutItem(false)
            setSelectedItem(null)
            if (refreshItemsListRef.current) {
              refreshItemsListRef.current()
            }
          }}
        />
      )}
      
      {showQuantityAdjust && selectedItem && (
        <QuantityAdjustModal 
          item={selectedItem}
          onClose={() => {
            setShowQuantityAdjust(false)
            setSelectedItem(null)
          }}
          onSuccess={() => {
            setShowQuantityAdjust(false)
            setSelectedItem(null)
            if (refreshItemsListRef.current) {
              refreshItemsListRef.current()
            }
          }}
        />
      )}
    </div>
  )
}

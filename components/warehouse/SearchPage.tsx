'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from '../LanguageProvider'
import ItemCard from './ItemCard'
import EditItemModal from './EditItemModal'
import MoveItemModal from './MoveItemModal'
import CheckoutModal from './CheckoutModal'
import ItemHistoryModal from './ItemHistoryModal'

interface SearchResult {
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
}

export default function SearchPage() {
  const { t, currentLanguage } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null)
  const [useChatGPT, setUseChatGPT] = useState(false)
  
  // Modal states
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      setResults([])
      setHasSearched(false)
      setAiInterpretation(null)
      return
    }

    setLoading(true)
    setHasSearched(true)
    setAiInterpretation(null)

    try {
      let response
      if (useChatGPT) {
        // Use ChatGPT-enhanced search
        response = await fetch('/api/warehouse/search/chatgpt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ 
            query: term,
            userLanguage: currentLanguage // Use user's configured language
          })
        })
      } else {
        // Use regular search
        response = await fetch(`/api/warehouse/search?q=${encodeURIComponent(term)}`)
      }
      
      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
        setAiInterpretation(data.aiInterpretation || null)
        
        if (data.results && data.results.length === 0) {
          toast.success(t('noItemsFound'))
        } else {
          toast.success(`${data.results?.length || 0} items found`)
        }
      } else {
        console.error('Search failed:', response.statusText)
        toast.error('Search failed')
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setResults([])
    setHasSearched(false)
    setAiInterpretation(null)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(searchTerm)
  }

  // Modal handlers
  const handleEditItem = (item: SearchResult) => {
    setSelectedItem(item)
    setShowEditModal(true)
  }

  const handleMoveItem = (item: SearchResult) => {
    setSelectedItem(item)
    setShowMoveModal(true)
  }

  const handleCheckoutItem = (item: SearchResult) => {
    setSelectedItem(item)
    setShowCheckoutModal(true)
  }

  const handleViewHistory = (item: SearchResult) => {
    setSelectedItem(item)
    setShowHistoryModal(true)
  }

  const handleModalClose = () => {
    setSelectedItem(null)
    setShowEditModal(false)
    setShowMoveModal(false)
    setShowCheckoutModal(false)
    setShowHistoryModal(false)
  }

  const handleModalSuccess = () => {
    handleModalClose()
    // Refresh search results
    if (searchTerm.trim()) {
      handleSearch(searchTerm)
    }
  }

  return (
    <div className="px-2 sm:px-4 py-4 sm:py-6">
      {/* Search Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {t('search')}
        </h1>
        
        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchItems')}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {/* ChatGPT Toggle */}
          <div className="mt-3 flex items-center space-x-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useChatGPT}
                onChange={(e) => setUseChatGPT(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">
                🤖 {t('useChatGPT') || 'Use ChatGPT Search'}
              </span>
            </label>
          </div>
          
          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            className="mt-3 w-full sm:w-auto bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? t('searching') : t('search')}
          </button>
        </form>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-4">
          {/* AI Interpretation */}
          {aiInterpretation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    🤖
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    AI Interpretation
                  </h3>
                  <p className="mt-1 text-sm text-blue-700">
                    {aiInterpretation}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {results.length > 0 ? `${results.length} ${t('searchResults')}` : t('noItemsFound')}
            </h2>
            {results.length > 0 && (
              <button
                onClick={handleClearSearch}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {t('clearFilters')}
              </button>
            )}
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}

          {!loading && results.length === 0 && hasSearched && (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                {t('noItemsFound')}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('searchTips')}
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-3">
              {results.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  showCategory={true}
                  showLocation={true}
                  onEdit={handleEditItem}
                  onMove={handleMoveItem}
                  onCheckout={handleCheckoutItem}
                  onHistory={handleViewHistory}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Tips */}
      {!hasSearched && (
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t('searchTips')}
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• {t('searchByName')}</li>
            <li>• {t('searchByDescription')}</li>
            <li>• {t('searchByCategory')}</li>
            <li>• {t('searchByLocation')}</li>
          </ul>
        </div>
      )}

      {/* Modals */}
      {selectedItem && (
        <>
          {showEditModal && (
            <EditItemModal
              item={selectedItem}
              onClose={handleModalClose}
              onSuccess={handleModalSuccess}
            />
          )}
          
          {showMoveModal && (
            <MoveItemModal
              item={selectedItem}
              onClose={handleModalClose}
              onSuccess={handleModalSuccess}
            />
          )}
          
          {showCheckoutModal && (
            <CheckoutModal
              item={selectedItem}
              onClose={handleModalClose}
              onSuccess={handleModalSuccess}
            />
          )}
          
          {showHistoryModal && (
            <ItemHistoryModal
              item={selectedItem}
              onClose={handleModalClose}
            />
          )}
        </>
      )}
    </div>
  )
}

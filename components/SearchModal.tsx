'use client'
// 搜尋模態框組件
// 提供物品搜尋功能，支援關鍵字搜尋、分類篩選、房間篩選、搜尋建議等

import { useState, useEffect } from 'react'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from './LanguageProvider'
import ItemCard from './ItemCard'

// 搜尋模態框屬性介面
interface SearchModalProps {
  onClose: () => void // 關閉回調
}

// 搜尋結果介面定義
interface SearchResult {
  id: string // 物品 ID
  name: string // 物品名稱
  description: string // 物品描述
  quantity: number // 數量
  minQuantity: number // 最小數量
  category?: {
    id: string // 分類 ID
    name: string // 分類名稱
    level: number // 分類層級
    parent?: {
      name: string // 父分類名稱
      level: number // 父分類層級
    }
  }
  room?: {
    id: string // 房間 ID
    name: string // 房間名稱
  }
  cabinet?: {
    id: string // 櫃子 ID
    name: string // 櫃子名稱
  }
  imageUrl?: string // 圖片 URL（可選）
}

export default function SearchModal({ onClose }: SearchModalProps) {
  const { t } = useLanguage() // 語言設定
  const [searchTerm, setSearchTerm] = useState('') // 搜尋關鍵字
  const [results, setResults] = useState<SearchResult[]>([]) // 搜尋結果列表
  const [isLoading, setIsLoading] = useState(false) // 載入狀態
  const [selectedCategory, setSelectedCategory] = useState('') // 選中的分類 ID
  const [selectedRoom, setSelectedRoom] = useState('') // 選中的房間 ID
  const [selectedSubcategory, setSelectedSubcategory] = useState('') // 選中的子分類 ID
  const [categories, setCategories] = useState<Array<{id: string, name: string, level: number, parent?: {name: string}}>>([]) // 分類列表
  const [rooms, setRooms] = useState<Array<{id: string, name: string}>>([]) // 房間列表
  const [subcategories, setSubcategories] = useState<Array<{id: string, name: string, level: number, parent: {name: string}}>>([]) // 子分類列表
  const [suggestions, setSuggestions] = useState<Array<{type: string, id?: string, name: string, description?: string, category?: string, location?: string}>>([]) // 搜尋建議列表
  const [showSuggestions, setShowSuggestions] = useState(false) // 是否顯示搜尋建議
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false) // 搜尋建議載入狀態

  // 載入分類和房間列表
  useEffect(() => {
    fetchCategoriesAndRooms()
  }, [])

  // 防抖搜尋建議（當輸入關鍵字時自動獲取建議）
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        await fetchSearchSuggestions(searchTerm.trim()) // 關鍵字長度 >= 2 時獲取建議
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300) // 300ms 防抖延遲

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const fetchCategoriesAndRooms = async () => {
    try {
      const [categoriesResponse, roomsResponse] = await Promise.all([
        fetch('/api/categories', { credentials: 'include' }),
        fetch('/api/rooms', { credentials: 'include' })
      ])

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        // Flatten all categories (including subcategories) for search
        const flattenCategories = (cats: any[], parent?: any): any[] => {
          let result: any[] = []
          cats.forEach(cat => {
            const categoryData = { 
              id: cat.id, 
              name: cat.name, 
              level: cat.level,
              parent: parent ? { name: parent.name } : undefined
            }
            result.push(categoryData)
            if (cat.children && cat.children.length > 0) {
              result = result.concat(flattenCategories(cat.children, cat))
            }
          })
          return result
        }
        const flattenedCategories = flattenCategories(categoriesData)
        setCategories(flattenedCategories)
        
        // Extract subcategories (level 2 and 3)
        const subcats = flattenedCategories.filter(cat => cat.level > 1)
        setSubcategories(subcats)
      }

      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json()
        setRooms(roomsData.rooms || roomsData) // Handle both old and new API response formats
      }
    } catch (error) {
      console.error('Error fetching categories and rooms:', error)
    }
  }

  const fetchSearchSuggestions = async (query: string) => {
    setIsLoadingSuggestions(true)
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
        setShowSuggestions(true)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const handleSearch = async () => {
    setIsLoading(true)
    setShowSuggestions(false) // Hide suggestions when searching
    try {
      const params = new URLSearchParams()
      if (searchTerm.trim()) params.append('search', searchTerm.trim())
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedRoom) params.append('room', selectedRoom)
      if (selectedSubcategory) params.append('subcategory', selectedSubcategory)

      const response = await fetch(`/api/items?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Search results for "' + searchTerm + '":', data)
        setResults(data)
        if (data.length === 0) {
          toast(`No items found for "${searchTerm}"`)
        }
      } else {
        const errorData = await response.json()
        console.error('Search failed:', response.status, errorData)
        toast.error(errorData.error || `Search failed (${response.status})`)
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('An error occurred during search')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: any) => {
    if (suggestion.type === 'room') {
      setSelectedRoom(suggestion.name)
      setSearchTerm('')
    } else if (suggestion.type === 'category') {
      if (suggestion.categoryLevel === 1) {
        setSelectedCategory(suggestion.name)
      } else {
        setSelectedSubcategory(suggestion.name)
      }
      setSearchTerm('')
    } else {
      setSearchTerm(suggestion.name)
    }
    setShowSuggestions(false)
    // Auto-search when suggestion is clicked
    setTimeout(() => {
      handleSearch()
    }, 100)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setShowSuggestions(true)
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false)
    }, 200)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {t('searchItems')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              placeholder={t('searchPlaceholder')}
            />
            
            {/* Search Suggestions Dropdown */}
            {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {isLoadingSuggestions ? (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
{t('findingSuggestions')}
                    </div>
                  </div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {suggestion.name}
                            </span>
                            {suggestion.type === 'item' && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {t('item')}
                              </span>
                            )}
                            {suggestion.type === 'room' && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                Room
                              </span>
                            )}
                            {suggestion.type === 'category' && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                Category
                              </span>
                            )}
                            {suggestion.type === 'name' && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                {t('similar')}
                              </span>
                            )}
                          </div>
                          {suggestion.description && (
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {suggestion.description}
                            </p>
                          )}
                          {(suggestion.category || suggestion.location) && (
                            <div className="flex items-center space-x-2 mt-1">
                              {suggestion.category && (
                                <span className="text-xs text-blue-600">
                                  📁 {suggestion.category}
                                </span>
                              )}
                              {suggestion.location && (
                                <span className="text-xs text-gray-500">
                                  📍 {suggestion.location}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
{t('noSuggestionsFound')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('category')}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setSelectedSubcategory('') // Reset subcategory when main category changes
                }}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">{t('allCategories')}</option>
                {categories.filter(cat => cat.level === 1).map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Subcategory
              </label>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                disabled={!selectedCategory}
              >
                <option value="">All Subcategories</option>
                {subcategories
                  .filter(sub => sub.parent?.name === selectedCategory)
                  .map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.name}>
                      {subcategory.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('room')}
              </label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">{t('allRooms')}</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.name}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search and Clear Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? t('searching') : t('search')}
            </button>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('')
                setSelectedRoom('')
                setSelectedSubcategory('')
                setResults([])
              }}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">
                {t('searchResults')} ({results.length})
              </h4>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {results.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    showCategory={true}
                    showLocation={true}
                  />
                ))}
              </div>
            </div>
          )}

          {results.length === 0 && searchTerm && !isLoading && (
            <div className="text-center py-8">
              <p className="text-gray-500">{t('noItemsFound')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/components/LanguageProvider'
import { toast } from 'react-hot-toast'
import { 
  HomeIcon, 
  CubeIcon, 
  UserGroupIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

interface DuplicateItem {
  id: string
  name: string
  quantity: number
  household: string
  room?: string
  cabinet?: string
  category?: string
  similarity: number
}

interface DuplicateRoom {
  id: string
  name: string
  household: string
  similarity: number
}

interface DuplicateCategory {
  id: string
  name: string
  household: string
  level: number
  similarity: number
}

// Normalize names for cross-language comparison (e.g., "kitchen" and "廚房" should match)
function normalizeForComparison(name: string): string {
  const normalized = name.toLowerCase().trim()
  
  // Map Chinese names to English equivalents for grouping
  const chineseToEnglish: Record<string, string> = {
    '車庫': 'garage',
    '廚房': 'kitchen',
    '客廳': 'living room',
    '主臥室': 'master bedroom',
    '臥室': 'bedroom',
    '兒童房': 'kids room',
    '小孩房': 'kids room',
    '浴室': 'bathroom',
    '廁所': 'bathroom',
    '陽台': 'balcony',
    '儲藏室': 'storage',
    '書房': 'study',
    '餐廳': 'dining room',
    // Add more mappings as needed
  }
  
  // Check if it's a Chinese name we know
  if (chineseToEnglish[normalized]) {
    return chineseToEnglish[normalized]
  }
  
  // Check if it matches any Chinese name (reverse lookup)
  for (const [chinese, english] of Object.entries(chineseToEnglish)) {
    if (normalized === chinese) {
      return english
    }
  }
  
  return normalized
}

export default function AdminDuplicatesPage() {
  const { t } = useLanguage()
  const [duplicateItems, setDuplicateItems] = useState<DuplicateItem[]>([])
  const [duplicateRooms, setDuplicateRooms] = useState<DuplicateRoom[]>([])
  const [duplicateCategories, setDuplicateCategories] = useState<DuplicateCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'items' | 'rooms' | 'categories'>('items')
  const [merging, setMerging] = useState<string | null>(null)

  const loadDuplicates = async () => {
    setLoading(true)
    try {
      // TODO: Implement API endpoints for duplicate detection
      // For now, show placeholder data
      setDuplicateItems([
        {
          id: '1',
          name: 'iPhone 15',
          quantity: 2,
          household: 'Sean\'s Household',
          room: 'Living Room',
          cabinet: 'Main Cabinet',
          category: 'Electronics',
          similarity: 95
        },
        {
          id: '2',
          name: 'iPhone 15',
          quantity: 1,
          household: 'Sean\'s Household',
          room: 'Bedroom',
          cabinet: 'Side Cabinet',
          category: 'Electronics',
          similarity: 95
        }
      ])
      
      setDuplicateRooms([
        {
          id: '1',
          name: 'Kitchen',
          household: 'Sean\'s Household',
          similarity: 100
        },
        {
          id: '2',
          name: '廚房',
          household: 'Sean\'s Household',
          similarity: 100
        }
      ])
      
      setDuplicateCategories([
        {
          id: '1',
          name: 'Clothing',
          household: 'Sean\'s Household',
          level: 1,
          similarity: 100
        },
        {
          id: '2',
          name: '服裝',
          household: 'Sean\'s Household',
          level: 1,
          similarity: 100
        }
      ])
    } catch (error) {
      console.error('Error loading duplicates:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDuplicates()
  }, [])

  const handleMerge = async (type: 'items' | 'rooms' | 'categories', id: string, primaryId?: string) => {
    setMerging(id)
    try {
      // Find the duplicate group to get primary and duplicate IDs
      let resolvedPrimaryId = primaryId || ''
      let duplicateId = id
      
      if (type === 'items') {
        const clickedItem = duplicateItems.find(item => item.id === id)
        if (!clickedItem) {
          toast.error('Item not found')
          setMerging(null)
          return
        }
        
        // Find ALL duplicates of the clicked item (including itself)
        const normalizedName = normalizeForComparison(clickedItem.name)
        const allDuplicates = duplicateItems.filter(item => {
          return normalizeForComparison(item.name) === normalizedName
        })
        
        if (allDuplicates.length < 2) {
          toast.error('No duplicate items found to merge')
          setMerging(null)
          return
        }
        
        // Use the clicked item as duplicate, find another as primary
        const otherDuplicates = allDuplicates.filter(item => item.id !== id)
        if (otherDuplicates.length === 0) {
          toast.error('No other duplicate items found to merge with')
          setMerging(null)
          return
        }
        
        // Use the first other duplicate as primary
        resolvedPrimaryId = otherDuplicates[0].id
        duplicateId = id
        
      } else if (type === 'rooms') {
        const clickedRoom = duplicateRooms.find(room => room.id === id)
        if (!clickedRoom) {
          toast.error('Room not found')
          setMerging(null)
          return
        }
        
        const normalizedName = normalizeForComparison(clickedRoom.name)
        const allDuplicates = duplicateRooms.filter(room => {
          return normalizeForComparison(room.name) === normalizedName
        })
        
        if (allDuplicates.length < 2) {
          toast.error('No duplicate rooms found to merge')
          setMerging(null)
          return
        }
        
        const otherDuplicates = allDuplicates.filter(room => room.id !== id)
        if (otherDuplicates.length === 0) {
          toast.error('No other duplicate rooms found to merge with')
          setMerging(null)
          return
        }
        
        resolvedPrimaryId = otherDuplicates[0].id
        duplicateId = id
        
      } else if (type === 'categories') {
        const clickedCategory = duplicateCategories.find(category => category.id === id)
        if (!clickedCategory) {
          toast.error('Category not found')
          setMerging(null)
          return
        }
        
        const normalizedName = normalizeForComparison(clickedCategory.name)
        const allDuplicates = duplicateCategories.filter(category => {
          return normalizeForComparison(category.name) === normalizedName
        })
        
        if (allDuplicates.length < 2) {
          toast.error('No duplicate categories found to merge')
          setMerging(null)
          return
        }
        
        const otherDuplicates = allDuplicates.filter(category => category.id !== id)
        if (otherDuplicates.length === 0) {
          toast.error('No other duplicate categories found to merge with')
          setMerging(null)
          return
        }
        
        resolvedPrimaryId = otherDuplicates[0].id
        duplicateId = id
      }

      if (!resolvedPrimaryId || resolvedPrimaryId === duplicateId) {
        toast.error('Cannot merge item with itself')
        setMerging(null)
        return
      }

      // Call the merge API
      const response = await fetch('/api/admin/merge-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          primaryId: resolvedPrimaryId,
          duplicateId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to merge')
      }

      const result = await response.json()
      
      // Remove the merged item from the list
      if (type === 'items') {
        setDuplicateItems(prev => prev.filter(item => item.id !== id))
      } else if (type === 'rooms') {
        setDuplicateRooms(prev => prev.filter(room => room.id !== id))
      } else if (type === 'categories') {
        setDuplicateCategories(prev => prev.filter(category => category.id !== id))
      }
      
      toast.success(`Successfully merged ${type}`)
    } catch (error) {
      console.error('Error merging:', error)
      toast.error(`Failed to merge ${type}`)
    } finally {
      setMerging(null)
    }
  }

  const handleKeepSeparate = async (type: 'items' | 'rooms' | 'categories', id: string) => {
    try {
      // TODO: Implement API call to mark as "keep separate"
      console.log(`Keeping separate ${type} with id: ${id}`)
      
      // Remove from duplicates list
      if (type === 'items') {
        setDuplicateItems(prev => prev.filter(item => item.id !== id))
      } else if (type === 'rooms') {
        setDuplicateRooms(prev => prev.filter(room => room.id !== id))
      } else if (type === 'categories') {
        setDuplicateCategories(prev => prev.filter(category => category.id !== id))
      }
      
      toast.success(`Marked ${type} as separate`)
    } catch (error) {
      console.error('Error keeping separate:', error)
      toast.error(`Failed to mark ${type} as separate`)
    }
  }

  const tabs = [
    { id: 'items', name: t('adminDuplicateItems'), count: duplicateItems.length },
    { id: 'rooms', name: t('adminDuplicateRooms'), count: duplicateRooms.length },
    { id: 'categories', name: t('adminDuplicateCategories'), count: duplicateCategories.length }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading duplicates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('adminDuplicateManagement')}</h1>
              <p className="text-gray-600 mt-1">{t('adminDuplicateDescription')}</p>
            </div>
            <div className="flex space-x-3">
              <Link 
                href="/admin" 
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                {t('adminBackToAdmin')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CubeIcon className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('adminDuplicateItems')}</dt>
                    <dd className="text-2xl font-bold text-gray-900">{duplicateItems.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('adminDuplicateRooms')}</dt>
                    <dd className="text-2xl font-bold text-gray-900">{duplicateRooms.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MagnifyingGlassIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('adminDuplicateCategories')}</dt>
                    <dd className="text-2xl font-bold text-gray-900">{duplicateCategories.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <span>{tab.name}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tab.count > 0 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'items' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">{t('adminDuplicateItems')}</h3>
                {duplicateItems.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">{t('adminNoDuplicateItems')}</h3>
                    <p className="mt-1 text-sm text-gray-500">{t('adminAllItemsUnique')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {duplicateItems.map((item, index) => (
                      <div key={item.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                              <p className="text-sm text-gray-500">
                                {item.household} • {item.room} • {item.cabinet}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{item.similarity}% {t('adminSimilar')}</span>
                            <button 
                              onClick={() => handleMerge('items', item.id)}
                              disabled={merging === item.id}
                              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {merging === item.id ? t('adminMerging') : t('adminMerge')}
                            </button>
                            <button 
                              onClick={() => handleKeepSeparate('items', item.id)}
                              className="text-sm text-gray-600 hover:text-gray-800"
                            >
                              {t('adminKeepSeparate')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rooms' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">{t('adminDuplicateRooms')}</h3>
                {duplicateRooms.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">{t('adminNoDuplicateRooms')}</h3>
                    <p className="mt-1 text-sm text-gray-500">{t('adminAllRoomsUnique')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {duplicateRooms.map((room, index) => (
                      <div key={room.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{room.name}</h4>
                              <p className="text-sm text-gray-500">{room.household}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{room.similarity}% {t('adminSimilar')}</span>
                            <button 
                              onClick={() => handleMerge('rooms', room.id)}
                              disabled={merging === room.id}
                              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {merging === room.id ? t('adminMerging') : t('adminMerge')}
                            </button>
                            <button 
                              onClick={() => handleKeepSeparate('rooms', room.id)}
                              className="text-sm text-gray-600 hover:text-gray-800"
                            >
                              {t('adminKeepSeparate')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">{t('adminDuplicateCategories')}</h3>
                {duplicateCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">{t('adminNoDuplicateCategories')}</h3>
                    <p className="mt-1 text-sm text-gray-500">{t('adminAllCategoriesUnique')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {duplicateCategories.map((category, index) => (
                      <div key={category.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{category.name}</h4>
                              <p className="text-sm text-gray-500">
                                {category.household} • {t('adminLevel')} {category.level}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{category.similarity}% {t('adminSimilar')}</span>
                            <button 
                              onClick={() => handleMerge('categories', category.id)}
                              disabled={merging === category.id}
                              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {merging === category.id ? t('adminMerging') : t('adminMerge')}
                            </button>
                            <button 
                              onClick={() => handleKeepSeparate('categories', category.id)}
                              className="text-sm text-gray-600 hover:text-gray-800"
                            >
                              {t('adminKeepSeparate')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/components/LanguageProvider'
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

export default function AdminDuplicatesPage() {
  const { t } = useLanguage()
  const [duplicateItems, setDuplicateItems] = useState<DuplicateItem[]>([])
  const [duplicateRooms, setDuplicateRooms] = useState<DuplicateRoom[]>([])
  const [duplicateCategories, setDuplicateCategories] = useState<DuplicateCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'items' | 'rooms' | 'categories'>('items')

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

  const tabs = [
    { id: 'items', name: 'Duplicate Items', count: duplicateItems.length },
    { id: 'rooms', name: 'Duplicate Rooms', count: duplicateRooms.length },
    { id: 'categories', name: 'Duplicate Categories', count: duplicateCategories.length }
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
              <h1 className="text-3xl font-bold text-gray-900">Duplicate Management</h1>
              <p className="text-gray-600 mt-1">Find and resolve duplicate items, rooms, and categories</p>
            </div>
            <div className="flex space-x-3">
              <Link 
                href="/admin" 
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Back to Admin
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Duplicate Items</dt>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Duplicate Rooms</dt>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Duplicate Categories</dt>
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
                <h3 className="text-lg font-medium text-gray-900">Duplicate Items</h3>
                {duplicateItems.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No duplicate items found</h3>
                    <p className="mt-1 text-sm text-gray-500">All items appear to be unique.</p>
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
                            <span className="text-sm text-gray-500">{item.similarity}% similar</span>
                            <button className="text-sm text-blue-600 hover:text-blue-800">
                              Merge
                            </button>
                            <button className="text-sm text-gray-600 hover:text-gray-800">
                              Keep Separate
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
                <h3 className="text-lg font-medium text-gray-900">Duplicate Rooms</h3>
                {duplicateRooms.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No duplicate rooms found</h3>
                    <p className="mt-1 text-sm text-gray-500">All rooms appear to be unique.</p>
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
                            <span className="text-sm text-gray-500">{room.similarity}% similar</span>
                            <button className="text-sm text-blue-600 hover:text-blue-800">
                              Merge
                            </button>
                            <button className="text-sm text-gray-600 hover:text-gray-800">
                              Keep Separate
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
                <h3 className="text-lg font-medium text-gray-900">Duplicate Categories</h3>
                {duplicateCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No duplicate categories found</h3>
                    <p className="mt-1 text-sm text-gray-500">All categories appear to be unique.</p>
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
                                {category.household} • Level {category.level}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{category.similarity}% similar</span>
                            <button className="text-sm text-blue-600 hover:text-blue-800">
                              Merge
                            </button>
                            <button className="text-sm text-gray-600 hover:text-gray-800">
                              Keep Separate
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

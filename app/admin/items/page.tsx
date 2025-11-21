'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/components/LanguageProvider'
import { 
  HomeIcon, 
  CubeIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  PhotoIcon,
  CameraIcon
} from '@heroicons/react/24/outline'

interface AdminItem { 
  id: string; 
  name: string; 
  quantity: number; 
  minQuantity?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  household: { 
    id: string; 
    name: string;
    country?: string | null;
    city?: string | null;
    district?: string | null;
  }; 
  room?: { id: string; name: string } | null; 
  cabinet?: { id: string; name: string } | null;
  category?: { id: string; name: string; level: number } | null;
}

export default function AdminItemsPage() {
  const { t, currentLanguage } = useLanguage()
  const [items, setItems] = useState<AdminItem[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'createdAt' | 'household' | 'location'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterHousehold, setFilterHousehold] = useState<string>('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/items${q ? `?q=${encodeURIComponent(q)}` : ''}?t=${Date.now()}`, {
        headers: {
          'Accept-Language': currentLanguage,
        },
        cache: 'no-store'
      })
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      } else {
        console.error('Failed to load items:', res.statusText)
      }
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickPhoto = (itemId: string) => {
    // Create file input for photo upload
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment' // Use camera on mobile
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      try {
        // Convert to base64 for quick preview
        const reader = new FileReader()
        reader.onload = async (event) => {
          const base64 = event.target?.result as string
          
          // Update item with new photo
          const response = await fetch(`/api/warehouse/items/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: base64 })
          })
          
          if (response.ok) {
            // Refresh the items list
            load()
          }
        }
        reader.readAsDataURL(file)
      } catch (error) {
        console.error('Error uploading photo:', error)
      }
    }
    
    input.click()
  }

  useEffect(() => { load() }, [currentLanguage])

  // Get unique households for filtering
  const households = Array.from(new Set(items.map(item => item.household.name)))

  // Filter and sort items
  const filteredAndSortedItems = items
    .filter(item => 
      !filterHousehold || item.household.name === filterHousehold
    )
    .sort((a, b) => {
      let aVal, bVal
      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'quantity':
          aVal = a.quantity
          bVal = b.quantity
          break
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime()
          bVal = new Date(b.createdAt).getTime()
          break
        case 'household':
          aVal = a.household.name.toLowerCase()
          bVal = b.household.name.toLowerCase()
          break
        case 'location':
          // Sort by: Country > City > District > Household Name
          aVal = [a.household.country, a.household.city, a.household.district, a.household.name].filter(Boolean).join(' ').toLowerCase()
          bVal = [b.household.country, b.household.city, b.household.district, b.household.name].filter(Boolean).join(' ').toLowerCase()
          break
        default:
          return 0
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      }
    })

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading items...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">{t('adminItems')}</h1>
              <p className="text-gray-600 mt-1">{t('adminViewManageItems')}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  // TODO: Implement duplicate items check
                  alert('Duplicate items check functionality will be implemented here')
                }}
                className="inline-flex items-center px-4 py-2 border border-orange-300 rounded-md shadow-sm text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                {t('checkDuplicates')}
              </button>
              <Link 
                href="/admin" 
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                {t('adminBackToAdmin')}
              </Link>
              <Link 
                href="/" 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                {t('backToApp')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CubeIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('totalItems')}</dt>
                    <dd className="text-2xl font-bold text-gray-900">{items.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <HomeIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('allHouseholds')}</dt>
                    <dd className="text-2xl font-bold text-gray-900">{households.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CubeIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('avgItemsPerHousehold')}</dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {households.length > 0 ? Math.round(items.length / households.length) : 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1 min-w-0">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder={t('adminSearchItems')}
                      value={q}
                      onChange={e => setQ(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={load}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                  {t('search')}
                </button>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
                <select
                  value={filterHousehold}
                  onChange={e => setFilterHousehold(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">{t('allHouseholds')}</option>
                  {households.map(household => (
                    <option key={household} value={household}>{household}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200" style={{ minWidth: '1200px' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '120px' }}>
                    {t('photo')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    style={{ width: '300px' }}
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{t('itemName')}</span>
                      {sortBy === 'name' && (
                        <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    style={{ width: '100px' }}
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{t('quantity')}</span>
                      {sortBy === 'quantity' && (
                        <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    style={{ width: '150px' }}
                    onClick={() => handleSort('household')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{t('allHouseholds')}</span>
                      {sortBy === 'household' && (
                        <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    style={{ width: '200px' }}
                    onClick={() => handleSort('location')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{t('location')}</span>
                      {sortBy === 'location' && (
                        <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '150px' }}>
                    {t('category')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    style={{ width: '120px' }}
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{t('created')}</span>
                      {sortBy === 'createdAt' && (
                        <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {/* Photo Column - First */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        {item.imageUrl ? (
                          <div className="relative">
                            <img 
                              src={item.imageUrl} 
                              alt={item.name}
                              className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                              onError={(e) => {
                                // If image fails to load, show placeholder
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  const placeholder = parent.querySelector('.placeholder')
                                  if (placeholder) {
                                    (placeholder as HTMLElement).style.display = 'flex'
                                  }
                                }
                              }}
                            />
                            <div className="placeholder hidden w-20 h-20 bg-gray-100 rounded-lg items-center justify-center border border-gray-200">
                              <PhotoIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <button
                              onClick={() => handleQuickPhoto(item.id)}
                              className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors"
                              title={t('updatePhoto')}
                            >
                              <CameraIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                            <PhotoIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Item Name Column - Second */}
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 break-words">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-gray-500 break-words mt-1">{item.description}</div>
                      )}
                    </td>
                    {/* Quantity Column - Third */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.quantity}</div>
                      {item.minQuantity && (
                        <div className="text-xs text-gray-500">{t('min')}: {item.minQuantity}</div>
                      )}
                    </td>
                    {/* Household Column - Fourth */}
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 break-words">{item.household.name}</div>
                      <div className="text-xs text-gray-500">ID: {item.household.id.slice(0, 8)}...</div>
                    </td>
                    {/* Location Column - Fifth */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 break-words">
                        {item.room?.name || '—'}
                        {item.cabinet?.name && (
                          <span className="text-gray-500"> → {item.cabinet.name}</span>
                        )}
                      </div>
                    </td>
                    {/* Category Column - Sixth */}
                    <td className="px-4 py-4">
                      {item.category ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 w-fit mb-1">
                            L{item.category.level}
                          </span>
                          <span className="text-sm text-gray-900 break-words">{item.category.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    {/* Created Column - Last */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(() => {
                        try {
                          const date = new Date(item.createdAt)
                          if (isNaN(date.getTime())) {
                            return 'Invalid Date'
                          }
                          return date.toLocaleDateString()
                        } catch (error) {
                          return 'Invalid Date'
                        }
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* No items found */}
        {filteredAndSortedItems.length === 0 && (
          <div className="text-center py-12">
            <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noItemsFound')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {q || filterHousehold ? t('tryAdjustingSearch') : t('noItemsCreatedYet')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}



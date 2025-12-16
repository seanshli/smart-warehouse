'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useLanguage } from '@/components/LanguageProvider'
import { 
  BuildingOfficeIcon,
  HomeIcon,
  UserGroupIcon,
  ArrowRightIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Building {
  id: string
  name: string
  description?: string
  address?: string
  floorCount?: number
  unitCount?: number
  householdCount: number
  facilityCount?: number
  community: {
    id: string
    name: string
  }
  createdAt: string
}

export default function AdminBuildingsPage() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [communities, setCommunities] = useState<any[]>([])
  const [selectedCommunity, setSelectedCommunity] = useState<string>('all')

  useEffect(() => {
    fetchCommunities()
  }, [])

  useEffect(() => {
    fetchBuildings()
  }, [selectedCommunity])

  const fetchCommunities = async () => {
    try {
      const response = await fetch('/api/admin/communities')
      if (response.ok) {
        const data = await response.json()
        setCommunities(data.communities || [])
      }
    } catch (err) {
      console.error('Failed to fetch communities:', err)
    }
  }

  const fetchBuildings = async () => {
    try {
      setLoading(true)
      const url = selectedCommunity !== 'all' 
        ? `/api/admin/buildings?communityId=${selectedCommunity}`
        : '/api/admin/buildings'
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch buildings')
      }
      const data = await response.json()
      setBuildings(data.buildings || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load buildings')
    } finally {
      setLoading(false)
    }
  }

  if (loading && buildings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('adminBuildings')}</h1>
            <p className="mt-2 text-gray-600">
              {t('adminBuildingsDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <label htmlFor="community-filter" className="block text-sm font-medium text-gray-700 mb-2">
          {t('adminFilterByCommunity')}
        </label>
        <select
          id="community-filter"
          value={selectedCommunity}
          onChange={(e) => setSelectedCommunity(e.target.value)}
          className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="all">{t('adminAllCommunities')}</option>
          {communities.map((community) => (
            <option key={community.id} value={community.id}>
              {community.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{t('adminTotalBuildings')}</dt>
                  <dd className="text-2xl font-bold text-gray-900">{buildings.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HomeIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{t('adminTotalHouseholds')}</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {buildings.reduce((sum, b) => sum + b.householdCount, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">平均住户/建筑</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {buildings.length > 0
                      ? Math.round(
                          buildings.reduce((sum, b) => sum + b.householdCount, 0) / buildings.length
                        )
                      : 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buildings List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">建筑列表</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {buildings.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              暂无建筑
            </div>
          ) : (
            buildings.map((building) => (
              <div key={building.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          <Link
                            href={`/building/${building.id}`}
                            className="hover:text-primary-600"
                          >
                            {building.name}
                          </Link>
                        </h3>
                        <div className="mt-1 flex items-center space-x-2 flex-wrap gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(building.id)
                              toast.success('Building ID copied to clipboard')
                            }}
                            className="inline-flex items-center space-x-1 text-xs font-mono text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                            title="Click to copy Building ID"
                          >
                            <ClipboardDocumentIcon className="h-3 w-3" />
                            <span>ID: {building.id}</span>
                          </button>
                          <span className="text-xs text-gray-400">•</span>
                          <Link
                            href={`/building/${building.id}/front-door`}
                            className="text-xs text-primary-600 hover:text-primary-700 underline"
                            title="Front Door Alarm Page"
                          >
                            Front Door: /building/{building.id}/front-door
                          </Link>
                        </div>
                        {building.description && (
                          <p className="mt-1 text-sm text-gray-500">{building.description}</p>
                        )}
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <HomeIcon className="h-4 w-4 mr-1" />
                            {building.householdCount} 住户
                          </span>
                          {building.floorCount && (
                            <span>{building.floorCount} 层</span>
                          )}
                          {building.unitCount && (
                            <span>{building.unitCount} 单元</span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center space-x-2 flex-wrap gap-2">
                          <Link
                            href={`/admin/facilities/building/${building.id}`}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                            公共設施 {building.facilityCount !== undefined && `(${building.facilityCount})`}
                          </Link>
                          <Link
                            href={`/building/${building.id}/messages`}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
                            訊息
                          </Link>
                        </div>
                        <div className="mt-1 flex items-center text-xs text-gray-400">
                          <span>所属社区: </span>
                          <Link
                            href={`/community/${building.community.id}`}
                            className="text-primary-600 hover:text-primary-700 ml-1"
                          >
                            {building.community.name}
                          </Link>
                        </div>
                        {building.address && (
                          <p className="mt-1 text-xs text-gray-400">{building.address}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Link
                      href={`/building/${building.id}`}
                      className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      {t('adminViewDetails')}
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}


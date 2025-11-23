'use client'

// For static export compatibility
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  BuildingOfficeIcon,
  HomeIcon,
  ArrowLeftIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface Building {
  id: string
  name: string
  description?: string
  address?: string
  floorCount?: number
  unitCount?: number
  latitude?: number
  longitude?: number
  invitationCode?: string
  community: {
    id: string
    name: string
  }
  householdCount: number
  createdAt: string
  updatedAt: string
}

export default function BuildingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const buildingId = params.id as string

  const [building, setBuilding] = useState<Building | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'households'>('overview')

  useEffect(() => {
    if (buildingId) {
      fetchBuilding()
    }
  }, [buildingId])

  const fetchBuilding = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/building/${buildingId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch building')
      }
      const data = await response.json()
      setBuilding(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load building')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !building) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Building not found'}</p>
          <Link href="/community" className="mt-4 text-primary-600 hover:text-primary-700">
            返回社区
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link href={`/community/${building.community.id}`} className="hover:text-gray-700">
              {building.community.name}
            </Link>
            <span>/</span>
            <span>建筑</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{building.name}</h1>
              {building.description && (
                <p className="mt-2 text-sm text-gray-600">{building.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: '概览', icon: BuildingOfficeIcon },
              { id: 'households', name: '住户', icon: HomeIcon },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'overview' && <OverviewTab building={building} />}
          {activeTab === 'households' && <HouseholdsTab buildingId={buildingId} />}
        </div>
      </div>
    </div>
  )
}

function OverviewTab({ building }: { building: Building }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">所属社区</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <Link 
                href={`/community/${building.community.id}`}
                className="text-primary-600 hover:text-primary-700"
              >
                {building.community.name}
              </Link>
            </dd>
          </div>
          {building.address && (
            <div>
              <dt className="text-sm font-medium text-gray-500">地址</dt>
              <dd className="mt-1 text-sm text-gray-900">{building.address}</dd>
            </div>
          )}
          {building.floorCount && (
            <div>
              <dt className="text-sm font-medium text-gray-500">楼层数</dt>
              <dd className="mt-1 text-sm text-gray-900">{building.floorCount}</dd>
            </div>
          )}
          {building.unitCount && (
            <div>
              <dt className="text-sm font-medium text-gray-500">单元数</dt>
              <dd className="mt-1 text-sm text-gray-900">{building.unitCount}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500">住户数量</dt>
            <dd className="mt-1 text-sm text-gray-900">{building.householdCount}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">创建时间</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(building.createdAt).toLocaleDateString('zh-CN')}
            </dd>
          </div>
          {building.invitationCode && (
            <div>
              <dt className="text-sm font-medium text-gray-500">邀请码</dt>
              <dd className="mt-1">
                <div className="flex items-center space-x-2">
                  <code className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-mono">
                    {building.invitationCode}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(building.invitationCode!)
                      // You may want to add toast notification here
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    复制
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  分享此邀请码给其他人，让他们可以加入此建筑
                </p>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}

function HouseholdsTab({ buildingId }: { buildingId: string }) {
  const [households, setHouseholds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHouseholds()
  }, [buildingId])

  const fetchHouseholds = async () => {
    try {
      const response = await fetch(`/api/building/${buildingId}/households`)
      if (response.ok) {
        const data = await response.json()
        setHouseholds(data.households || [])
      }
    } catch (err) {
      console.error('Failed to fetch households:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">住户列表</h3>
      </div>
      {households.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无住户</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {households.map((household) => (
            <Link
              key={household.id}
              href={`/household/${household.id}`}
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{household.name}</h4>
                  {household.apartmentNo && (
                    <p className="text-sm text-gray-600 mt-1">单元: {household.apartmentNo}</p>
                  )}
                  {household.address && (
                    <p className="text-xs text-gray-500 mt-1">{household.address}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{household.stats.members}</div>
                  <div className="text-xs text-gray-500">成员</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">{household.stats.items}</div>
                  <div className="text-xs text-gray-500">物品</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">{household.stats.rooms}</div>
                  <div className="text-xs text-gray-500">房间</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/components/LanguageProvider'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CogIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface Community {
  id: string
  name: string
  description?: string
  address?: string
  city?: string
  district?: string
  country?: string
  role: string
  joinedAt: string
  stats: {
    buildings: number
    members: number
    workingGroups: number
  }
}

export default function CommunityPage() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchCommunities()
  }, [])

  const fetchCommunities = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/community')
      if (!response.ok) {
        throw new Error('Failed to fetch communities')
      }
      const data = await response.json()
      setCommunities(data.communities || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load communities')
    } finally {
      setLoading(false)
    }
  }

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.address?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">社区管理</h1>
              <p className="mt-2 text-sm text-gray-600">
                管理和查看您所属的社区
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              创建社区
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="搜索社区..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Communities Grid */}
        {filteredCommunities.length === 0 ? (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">没有社区</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? '没有找到匹配的社区' : '开始创建您的第一个社区'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  创建社区
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community) => (
              <div
                key={community.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {community.name}
                      </h3>
                      {community.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {community.description}
                        </p>
                      )}
                      {community.address && (
                        <p className="text-xs text-gray-500 mb-3">
                          {[community.address, community.city, community.district, community.country]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${
                      community.role === 'ADMIN' 
                        ? 'bg-red-100 text-red-800'
                        : community.role === 'MANAGER'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {community.role}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {community.stats.buildings}
                      </div>
                      <div className="text-xs text-gray-500">建筑</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {community.stats.members}
                      </div>
                      <div className="text-xs text-gray-500">成员</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {community.stats.workingGroups}
                      </div>
                      <div className="text-xs text-gray-500">工作组</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex space-x-2">
                    <Link
                      href={`/community/${community.id}`}
                      className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      查看详情
                    </Link>
                    <Link
                      href={`/community/${community.id}/buildings`}
                      className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                      建筑
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Community Modal */}
        {showCreateModal && (
          <CreateCommunityModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false)
              fetchCommunities()
            }}
          />
        )}
      </div>
    </div>
  )
}

// Create Community Modal Component
function CreateCommunityModal({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    district: '',
    country: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create community')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create community')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">创建社区</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                社区名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  城市
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  区/县
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                地址
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                国家
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {submitting ? '创建中...' : '创建'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


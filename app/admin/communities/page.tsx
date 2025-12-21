'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useLanguage } from '@/components/LanguageProvider'
import { 
  BuildingOfficeIcon,
  UserGroupIcon,
  HomeIcon,
  CogIcon,
  ArrowRightIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import CateringToggle from '@/components/admin/CateringToggle'
import CateringSetupModal from '@/components/admin/CateringSetupModal'

interface Community {
  id: string
  name: string
  description?: string
  address?: string
  city?: string
  district?: string
  country?: string
  createdAt: string
  stats: {
    buildings: number
    members: number
    workingGroups: number
  }
}

export default function AdminCommunitiesPage() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [setupModalOpen, setSetupModalOpen] = useState(false)
  const [setupTarget, setSetupTarget] = useState<{ buildingId?: string; communityId?: string } | null>(null)

  useEffect(() => {
    fetchCommunities()
  }, [])

  const fetchCommunities = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/communities')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('adminLoading')}</p>
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
            {t('retry')}
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
            <h1 className="text-3xl font-bold text-gray-900">{t('adminCommunities')}</h1>
            <p className="mt-2 text-gray-600">
              {t('adminCommunitiesDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{t('adminTotalCommunities')}</dt>
                  <dd className="text-2xl font-bold text-gray-900">{communities.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{t('adminTotalBuildings')}</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {communities.reduce((sum, c) => sum + c.stats.buildings, 0)}
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
                  <dt className="text-sm font-medium text-gray-500 truncate">{t('adminTotalMembers')}</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {communities.reduce((sum, c) => sum + c.stats.members, 0)}
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
                <CogIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{t('adminTotalWorkgroups')}</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {communities.reduce((sum, c) => sum + c.stats.workingGroups, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Communities List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">{t('adminCommunityList')}</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {communities.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              {t('adminNoCommunities')}
            </div>
          ) : (
            communities.map((community) => (
              <div key={community.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          <Link
                            href={`/community/${community.id}`}
                            className="hover:text-primary-600"
                          >
                            {community.name}
                          </Link>
                        </h3>
                        <div className="mt-1 flex items-center space-x-2">
                          <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            Community ID: {community.id}
                          </span>
                        </div>
                        {community.description && (
                          <p className="mt-1 text-sm text-gray-500">{community.description}</p>
                        )}
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                            {community.stats.buildings} {t('adminBuildingsCount')}
                          </span>
                          <span className="flex items-center">
                            <UserGroupIcon className="h-4 w-4 mr-1" />
                            {community.stats.members} {t('adminMembersCount')}
                          </span>
                          <span className="flex items-center">
                            <CogIcon className="h-4 w-4 mr-1" />
                            {community.stats.workingGroups} {t('adminWorkgroupsCount')}
                          </span>
                        </div>
                        {community.address && (
                          <p className="mt-1 text-xs text-gray-400">
                            {[community.address, community.city, community.district, community.country]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/facilities/community/${community.id}`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                        {t('publicFacilities') || '公共設施'}
                      </Link>
                      <Link
                        href={`/community/${community.id}/messages`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
                        {t('messages') || '訊息'}
                      </Link>
                      <CateringToggle
                        communityId={community.id}
                        onEnabled={() => {
                          setSetupTarget({ communityId: community.id })
                          setSetupModalOpen(true)
                        }}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/buildings?communityId=${community.id}`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                        {t('adminBuildings') || '建築'}
                      </Link>
                      <Link
                        href={`/community/${community.id}`}
                        className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {t('adminViewDetails') || '查看详情'}
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Catering Setup Modal */}
      {setupModalOpen && setupTarget && (
        <CateringSetupModal
          buildingId={setupTarget.buildingId}
          communityId={setupTarget.communityId}
          onClose={() => {
            setSetupModalOpen(false)
            setSetupTarget(null)
          }}
        />
      )}
    </div>
  )
}


'use client'

// For static export compatibility
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  BuildingOfficeIcon,
  UserGroupIcon,
  CogIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  PlusIcon,
  BellIcon,
  ClipboardDocumentIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import toast from 'react-hot-toast'
import QRCodeDisplay from '@/components/QRCode'
import JoinRequestList from '@/components/community/JoinRequestList'
import { useLanguage } from '@/components/LanguageProvider'
import CreateAnnouncementModal from '@/components/admin/CreateAnnouncementModal'
import CateringToggle from '@/components/admin/CateringToggle'
import CateringSetupModal from '@/components/admin/CateringSetupModal'
import CateringMenu from '@/components/catering/CateringMenu'
import CateringAdminManager from '@/components/admin/CateringAdminManager'

interface Community {
  id: string
  name: string
  description?: string
  address?: string
  city?: string
  district?: string
  country?: string
  invitationCode?: string
  createdAt: string
  stats: {
    buildings: number
    members: number
    workingGroups: number
  }
}

export default function CommunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { currentLanguage, setLanguage, t } = useLanguage()
  const communityId = params?.id as string

  const [community, setCommunity] = useState<Community | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'buildings' | 'members' | 'working-groups' | 'announcements' | 'catering'>('overview')
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false)
  const [setupModalOpen, setSetupModalOpen] = useState(false)
  const [cateringServiceEnabled, setCateringServiceEnabled] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (communityId) {
      fetchCommunity()
      checkCateringService()
      checkAdminStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId, session])

  const checkAdminStatus = () => {
    // Check admin status from session
    const userIsAdmin = (session?.user as any)?.isAdmin || false
    setIsAdmin(userIsAdmin)
  }

  const checkCateringService = async () => {
    try {
      const response = await fetch(`/api/catering/service?communityId=${communityId}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        const isEnabled = data.service?.isActive || false
        setCateringServiceEnabled(isEnabled)
        console.log('[CommunityPage] Catering service status:', isEnabled, data.service)
      } else {
        console.log('[CommunityPage] No catering service found')
        setCateringServiceEnabled(false)
      }
    } catch (error) {
      console.error('Error checking catering service:', error)
      setCateringServiceEnabled(false)
    }
  }

  const fetchCommunity = async () => {
    if (!communityId) {
      setError('Community ID is required')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('[CommunityDetailPage] Fetching community:', communityId)
      
      const response = await fetch(`/api/community/${communityId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('[CommunityDetailPage] Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[CommunityDetailPage] Error response:', errorData)
        const errorMessage = errorData.error || errorData.message || `Failed to fetch community (${response.status})`
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('[CommunityDetailPage] Received data:', data)
      
      if (!data || !data.id) {
        throw new Error('Invalid community data received')
      }
      
      // Ensure stats object exists with default values
      const communityData: Community = {
        id: data.id,
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        district: data.district,
        country: data.country,
        invitationCode: data.invitationCode,
        createdAt: data.createdAt,
        stats: data.stats || {
          buildings: data._count?.buildings || 0,
          members: data._count?.members || 0,
          workingGroups: data._count?.workingGroups || 0,
        },
      }
      
      console.log('[CommunityDetailPage] Setting community:', communityData)
      setCommunity(communityData)
    } catch (err) {
      console.error('[CommunityDetailPage] Error fetching community:', err)
      setError(err instanceof Error ? err.message : 'Failed to load community')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('commonLoading')}</p>
        </div>
      </div>
    )
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || t('communityNotFound')}</p>
          <Link href="/community" className="mt-4 text-primary-600 hover:text-primary-700">
            {t('communityBackToList')}
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
          <Link
            href="/community"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            {t('communityBackToList')}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{community.name}</h1>
              {community.description && (
                <p className="mt-2 text-sm text-gray-600">{community.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {/* Language Selection */}
              <div className="flex items-center space-x-2">
                <label htmlFor="language-select-community" className="text-sm text-gray-500">{t('commonLanguage')}:</label>
                <select
                  id="language-select-community"
                  value={currentLanguage}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="block w-32 px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="en">English</option>
                  <option value="zh-TW">繁體中文</option>
                  <option value="zh">简体中文</option>
                  <option value="ja">日文</option>
                </select>
              </div>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <CogIcon className="h-5 w-5 mr-2" />
                {t('commonSettings')}
              </button>
            </div>
          </div>
        </div>

        {/* Layout: Vertical Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Vertical Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
              <nav className="space-y-1">
                {[
                  { id: 'overview', name: t('communityOverview'), icon: BuildingOfficeIcon },
                  { id: 'buildings', name: t('adminBuildings'), icon: BuildingOfficeIcon },
                  { id: 'members', name: t('members'), icon: UserGroupIcon },
                  { id: 'working-groups', name: t('communityWorkingGroups'), icon: CogIcon },
                  { id: 'announcements', name: t('announcements'), icon: BellIcon },
                  // Only show catering tab if service is enabled
                  ...(cateringServiceEnabled ? [{ id: 'catering', name: t('catering'), icon: ShoppingBagIcon }] : []),
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-600 border-primary-500'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                      } w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md border-l-2 transition-colors`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate">{tab.name}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'overview' && community && <OverviewTab community={community} onCateringEnabled={() => setSetupModalOpen(true)} onServiceCheck={checkCateringService} />}
          {activeTab === 'buildings' && communityId && <BuildingsTab communityId={communityId} />}
          {activeTab === 'members' && communityId && <MembersTab communityId={communityId} />}
          {activeTab === 'working-groups' && communityId && <WorkingGroupsTab communityId={communityId} />}
          {activeTab === 'announcements' && communityId && (
            <AnnouncementsTab 
              communityId={communityId} 
              communityName={community?.name || ''}
              onShowCreate={() => setShowCreateAnnouncement(true)}
            />
          )}
          {activeTab === 'catering' && communityId && (
            isAdmin ? (
              <CateringAdminManager
                communityId={communityId}
                buildingId={undefined}
              />
            ) : (
              <CateringMenu
                communityId={communityId}
                buildingId={undefined}
                householdId={undefined} // Community-level view, no specific household
              />
            )
          )}
          </div>
        </div>

        {/* Create Announcement Modal */}
        {communityId && (
          <CreateAnnouncementModal
            isOpen={showCreateAnnouncement}
            onClose={() => setShowCreateAnnouncement(false)}
            onSuccess={() => {
              setShowCreateAnnouncement(false)
              if (activeTab === 'announcements') {
                window.location.reload()
              }
            }}
            source="COMMUNITY"
            sourceId={communityId}
            sourceName={community?.name}
            targetType="ALL_HOUSEHOLDS"
          />
        )}

        {/* Catering Setup Modal */}
        {setupModalOpen && communityId && (
          <CateringSetupModal
            communityId={communityId}
            onClose={() => {
              setSetupModalOpen(false)
              checkCateringService() // Refresh service status after setup
            }}
          />
        )}
      </div>
    </div>
  )
}

function OverviewTab({ community, onCateringEnabled, onServiceCheck }: { community: Community; onCateringEnabled?: () => void; onServiceCheck?: () => void }) {
  const { t, currentLanguage } = useLanguage()
  const communityId = community.id
  const [buildings, setBuildings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBuildings()
  }, [communityId])

  const fetchBuildings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/community/${communityId}/buildings`)
      if (response.ok) {
        const data = await response.json()
        setBuildings(data.buildings || [])
      }
    } catch (err) {
      console.error('Failed to fetch buildings:', err)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('communityBasicInfo')}</h3>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">{t('communityAddress')}</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {[community.address, community.city, community.district, community.country]
                .filter(Boolean)
                .join(', ') || t('communityNotSet')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">{t('communityCreatedAt')}</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(community.createdAt).toLocaleDateString(currentLanguage === 'zh-TW' ? 'zh-TW' : currentLanguage === 'zh' ? 'zh-CN' : currentLanguage === 'ja' ? 'ja-JP' : 'en-US')}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500 mb-2">{t('catering')}</dt>
            <dd className="mt-1">
              <CateringToggle
                communityId={communityId}
                onEnabled={() => {
                  if (onCateringEnabled) {
                    onCateringEnabled()
                  }
                  // Also refresh the service check
                  if (onServiceCheck) {
                    setTimeout(() => {
                      onServiceCheck()
                    }, 500)
                  }
                }}
              />
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500 mb-1">Community ID</dt>
            <dd className="mt-1">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(community.id)
                  toast.success('Community ID copied to clipboard')
                }}
                className="inline-flex items-center space-x-2 text-xs font-mono text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded transition-colors"
                title="Click to copy Community ID"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
                <span>{community.id}</span>
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Note: Community ID is different from Invitation Code. Use this ID for API calls and direct links.
              </p>
            </dd>
          </div>
          {community.invitationCode && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500 mb-1">{t('communityInvitationCode')} <span className="text-xs text-gray-400 font-normal">(for joining)</span></dt>
              <dd className="mt-1">
                <div className="flex items-center space-x-2 mb-2">
                  <code className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-mono">
                    {community.invitationCode}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(community.invitationCode!)
                      toast.success(t('communityInvitationCopied'))
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {t('communityCopyInvitation')}
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <QRCodeDisplay 
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join?code=${community.invitationCode}&type=community`} 
                      size={120} 
                      className="p-2 bg-white rounded border border-gray-200" 
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">
                      {t('communityShareInvitation')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t('scanQRCodeToJoin')}
                    </p>
                    <p className="text-xs text-gray-400 mt-2 italic">
                      Note: Invitation Code is different from Community ID. Use this code to invite people to join.
                    </p>
                  </div>
                </div>
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('communityStats')}</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">{community.stats?.buildings ?? 0}</div>
            <div className="text-sm text-gray-500 mt-1">{t('adminBuildings')}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">{community.stats?.members ?? 0}</div>
            <div className="text-sm text-gray-500 mt-1">{t('members')}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">{community.stats?.workingGroups ?? 0}</div>
            <div className="text-sm text-gray-500 mt-1">{t('communityWorkingGroups')}</div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">{t('adminBuildings')}</h3>
          <Link
            href={`/community/${communityId}/buildings/new`}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            {t('addBuilding')}
          </Link>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-500">{t('commonLoading')}</div>
        ) : buildings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">{t('noBuildings')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildings.map((building) => (
              <div
                key={building.id}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <Link
                    href={`/building/${building.id}`}
                    className="flex-1"
                  >
                    <h4 className="font-semibold text-gray-900 hover:text-primary-600">{building.name}</h4>
                  </Link>
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="mt-1 mb-2 flex items-center space-x-2 flex-wrap gap-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
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
                    onClick={(e) => e.stopPropagation()}
                  >
                    Front Door
                  </Link>
                </div>
                {building.description && (
                  <p className="text-sm text-gray-600 mt-1 mb-3">{building.description}</p>
                )}
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <div className="text-xs text-gray-500">{t('buildingHouseholdCount')}</div>
                    <div className="text-lg font-semibold text-gray-900">{building.householdCount || 0}</div>
                  </div>
                  {building.floorCount && (
                    <div>
                      <div className="text-xs text-gray-500">{t('buildingFloorCount')}</div>
                      <div className="text-lg font-semibold text-gray-900">{building.floorCount}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BuildingsTab({ communityId }: { communityId: string }) {
  const [buildings, setBuildings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (communityId) {
      fetchBuildings()
    } else {
      setError('Community ID is required')
      setLoading(false)
    }
  }, [communityId])

  const fetchBuildings = async () => {
    if (!communityId) {
      setError('Community ID is required')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('[BuildingsTab] Fetching buildings for community:', communityId)
      
      const response = await fetch(`/api/community/${communityId}/buildings`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('[BuildingsTab] Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[BuildingsTab] Error response:', errorData)
        const errorMessage = errorData.error || errorData.message || `Failed to fetch buildings (${response.status})`
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('[BuildingsTab] Received data:', data)
      
      if (!data) {
        throw new Error('No data received from server')
      }
      
      // Handle both { buildings: [...] } and direct array response
      const buildingsList = data.buildings || (Array.isArray(data) ? data : [])
      
      if (!Array.isArray(buildingsList)) {
        console.error('[BuildingsTab] Invalid data format:', data)
        throw new Error('Invalid buildings data format')
      }
      
      console.log('[BuildingsTab] Setting buildings:', buildingsList.length, buildingsList)
      setBuildings(buildingsList)
    } catch (err) {
      console.error('[BuildingsTab] Error fetching buildings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load buildings')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchBuildings}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Buildings</h3>
        <Link
          href={`/community/${communityId}/buildings/new`}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Add Building
        </Link>
      </div>
      {buildings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No buildings yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {buildings.map((building) => (
            <div
              key={building.id}
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-start justify-between mb-2">
                <Link
                  href={`/building/${building.id}`}
                  className="flex-1"
                >
                  <h4 className="font-medium text-gray-900 hover:text-primary-600">{building.name}</h4>
                </Link>
              </div>
              <div className="mt-1 mb-2 flex items-center space-x-2 flex-wrap gap-1">
                <button
                  onClick={(e) => {
                    e.preventDefault()
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
                  onClick={(e) => e.stopPropagation()}
                >
                  Front Door
                </Link>
              </div>
              {building.description && (
                <p className="text-sm text-gray-600 mt-1">{building.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {building.householdCount || 0} households
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MembersTab({ communityId }: { communityId: string }) {
  const { t } = useLanguage()
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberPassword, setNewMemberPassword] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER'>('MEMBER')
  const [newMemberClass, setNewMemberClass] = useState<'household' | 'building' | 'community'>('community')
  const [addingMember, setAddingMember] = useState(false)
  const [assignableRoles, setAssignableRoles] = useState<string[]>([])

  useEffect(() => {
    fetchMembers()
  }, [communityId])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/community/${communityId}/members`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
        setAssignableRoles(data.assignableRoles || ['MEMBER', 'VIEWER'])
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to fetch community members (${response.status})`
        console.error('Failed to fetch community members:', errorMessage, errorData)
        toast.error(errorMessage)
      }
    } catch (err) {
      console.error('Failed to fetch members:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch community members'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }

    try {
      setAddingMember(true)
      const requestBody: any = {
        targetUserEmail: newMemberEmail.trim(),
        role: newMemberRole,
        memberClass: newMemberClass,
      }
      
      // If password is provided, include it to create new user
      if (newMemberPassword.trim()) {
        requestBody.password = newMemberPassword.trim()
        if (newMemberName.trim()) {
          requestBody.name = newMemberName.trim()
        }
      }
      
      const response = await fetch(`/api/community/${communityId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        toast.success('Member added successfully')
        setShowAddMember(false)
        setNewMemberEmail('')
        setNewMemberName('')
        setNewMemberPassword('')
        setNewMemberRole('MEMBER')
        setNewMemberClass('community')
        fetchMembers()
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Failed to add member'
        
        // If user not found, provide helpful message with link to create user
        if (errorMessage.includes('User not found') || errorMessage.includes('must exist')) {
          toast.error(
            <div className="flex flex-col gap-2">
              <span>{errorMessage}</span>
              <a 
                href="/admin/users" 
                className="text-blue-600 hover:text-blue-800 underline text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                Go to Admin Users page to create user →
              </a>
            </div>,
            { duration: 8000 }
          )
        } else {
          toast.error(errorMessage)
        }
      }
    } catch (err) {
      console.error('Failed to add member:', err)
      toast.error('Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return
    }

    try {
      const response = await fetch(`/api/community/${communityId}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Member removed successfully')
        fetchMembers()
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || 'Failed to remove member')
      }
    } catch (err) {
      console.error('Failed to remove member:', err)
      toast.error('Failed to remove member')
    }
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">成员列表</h3>
        <button 
          onClick={() => setShowAddMember(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          添加成员
        </button>
      </div>
      {members.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无成员</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  加入时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{member.user.name || member.user.email}</div>
                    <div className="text-sm text-gray-500">{member.user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      member.role === 'ADMIN' 
                        ? 'bg-red-100 text-red-800'
                        : member.role === 'MANAGER'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.joinedAt).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {member.canManage && (
                      <>
                        <button 
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowAddMember(false)}></div>
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 z-10">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                添加成员
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    邮箱地址 *
                  </label>
                  <input
                    type="email"
                    required
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    姓名 (可选，创建新用户时使用)
                  </label>
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="User Name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    如果用户不存在，提供密码将自动创建新用户
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    密码 (可选，创建新用户时使用)
                  </label>
                  <input
                    type="password"
                    value={newMemberPassword}
                    onChange={(e) => setNewMemberPassword(e.target.value)}
                    placeholder="留空则仅添加现有用户"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    如果用户不存在且提供密码，将自动创建新用户并设置密码
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    角色 *
                  </label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    {assignableRoles.length > 0 ? (
                      assignableRoles.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))
                    ) : (
                      <>
                        <option value="MEMBER">MEMBER</option>
                        <option value="VIEWER">VIEWER</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    成员类型 *
                  </label>
                  <select
                    value={newMemberClass}
                    onChange={(e) => setNewMemberClass(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="household">Household (住户)</option>
                    <option value="building">Building (建筑)</option>
                    <option value="community">Community (社区)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    选择成员类型：住户成员、建筑工作团队或社区工作团队
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMember(false)
                      setNewMemberEmail('')
                      setNewMemberName('')
                      setNewMemberPassword('')
                      setNewMemberRole('MEMBER')
                      setNewMemberClass('community')
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    disabled={addingMember || !newMemberEmail.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {addingMember ? '添加中...' : '添加'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AnnouncementsTab({ 
  communityId, 
  communityName, 
  onShowCreate 
}: { 
  communityId: string
  communityName: string
  onShowCreate: () => void
}) {
  const { t } = useLanguage()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnnouncements()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/announcements?source=COMMUNITY&sourceId=${communityId}`)
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements || [])
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{t('announcements') || 'Announcements'}</h3>
        <button
          onClick={onShowCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {t('createAnnouncement') || 'Create Announcement'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {t('noAnnouncements') || 'No announcements found'}
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h4 className="text-sm font-semibold text-gray-900">{announcement.title}</h4>
              <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{announcement.message}</p>
              <div className="mt-2 text-xs text-gray-500">
                {formatDate(announcement.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function WorkingGroupsTab({ communityId }: { communityId: string }) {
  const [workingGroups, setWorkingGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null)
  const [groupMembers, setGroupMembers] = useState<any[]>([])
  const [groupLoading, setGroupLoading] = useState(false)
  const [groupError, setGroupError] = useState<string | null>(null)
  const [addEmail, setAddEmail] = useState('')
  const [addUserId, setAddUserId] = useState<string>('')
  const [addRole, setAddRole] = useState<'LEADER' | 'MEMBER'>('MEMBER')
  const [addingMember, setAddingMember] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newGroup, setNewGroup] = useState({ name: '', type: 'MANAGEMENT', description: '' })
  const [creating, setCreating] = useState(false)
  const [communityMembers, setCommunityMembers] = useState<any[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [addMethod, setAddMethod] = useState<'email' | 'select'>('select')

  useEffect(() => {
    fetchWorkingGroups()
    fetchCommunityMembers()
  }, [communityId])

  const fetchCommunityMembers = async () => {
    try {
      setLoadingMembers(true)
      const response = await fetch(`/api/community/${communityId}/members`)
      if (response.ok) {
        const data = await response.json()
        setCommunityMembers(data.members || [])
      }
    } catch (err) {
      console.error('Failed to fetch community members:', err)
    } finally {
      setLoadingMembers(false)
    }
  }

  const fetchWorkingGroups = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/community/${communityId}/working-groups`)
      if (response.ok) {
        const data = await response.json()
        setWorkingGroups(data.workingGroups || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to load working groups')
      }
    } catch (err) {
      console.error('Failed to fetch working groups:', err)
      setError(err instanceof Error ? err.message : 'Failed to load working groups')
    } finally {
      setLoading(false)
    }
  }

  const openGroupDetails = async (group: any) => {
    setSelectedGroup(group)
    setGroupError(null)
    setGroupLoading(true)
    try {
      const memberRes = await fetch(`/api/community/${communityId}/working-groups/${group.id}/members`)
      if (memberRes.ok) {
        const data = await memberRes.json()
        setGroupMembers(data.members || [])
      } else {
        const errorData = await memberRes.json().catch(() => ({}))
        setGroupError(errorData.error || 'Failed to load members')
      }
    } catch (err) {
      console.error('Failed to load group members:', err)
      setGroupError(err instanceof Error ? err.message : 'Failed to load members')
    } finally {
      setGroupLoading(false)
    }
  }

  const closeGroupDetails = () => {
    setSelectedGroup(null)
    setGroupMembers([])
    setAddEmail('')
    setAddUserId('')
    setAddRole('MEMBER')
    setGroupError(null)
    setAddMethod('select')
  }

  // Get available members (community members not already in the working group)
  const availableMembers = communityMembers.filter(
    (member) => !groupMembers.some((gm) => gm.user?.id === member.user?.id)
  )

  const handleAddMember = async () => {
    if (!selectedGroup) return
    if (addMethod === 'email' && !addEmail.trim()) return
    if (addMethod === 'select' && !addUserId) return
    
    try {
      setAddingMember(true)
      setGroupError(null)
      const body: any = { role: addRole }
      if (addMethod === 'email') {
        body.targetUserEmail = addEmail.trim()
      } else {
        body.targetUserId = addUserId
      }
      
      const res = await fetch(
        `/api/community/${communityId}/working-groups/${selectedGroup.id}/members`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )
      if (res.ok) {
        const data = await res.json()
        setGroupMembers(prev => [...prev, data])
        setAddEmail('')
        setAddUserId('')
        setAddRole('MEMBER')
        toast.success('Member added')
        fetchWorkingGroups()
        fetchCommunityMembers() // Refresh community members list
      } else {
        const errorData = await res.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Failed to add member'
        const errorDetails = errorData.details || ''
        const errorSteps = errorData.steps || []
        const helpUrl = errorData.helpUrl || ''
        
        // Build detailed error message
        let fullErrorMessage = errorMessage
        if (errorDetails) {
          fullErrorMessage += `\n\n${errorDetails}`
        }
        if (errorSteps && errorSteps.length > 0) {
          fullErrorMessage += `\n\n${errorSteps.join('\n')}`
        }
        if (helpUrl) {
          fullErrorMessage += `\n\nGo to: ${helpUrl}`
        }
        
        setGroupError(fullErrorMessage)
        toast.error(errorMessage, { duration: 5000 })
      }
    } catch (err) {
      console.error('Error adding member:', err)
      setGroupError(err instanceof Error ? err.message : 'Failed to add member')
      toast.error('Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedGroup) return
    if (!confirm('Remove this member from the working group?')) return
    try {
      const res = await fetch(
        `/api/community/${communityId}/working-groups/${selectedGroup.id}/members/${memberId}`,
        { method: 'DELETE' }
      )
      if (res.ok) {
        setGroupMembers(prev => prev.filter(m => m.id !== memberId))
        toast.success('Member removed')
        fetchWorkingGroups()
      } else {
        const errorData = await res.json().catch(() => ({}))
        toast.error(errorData.error || 'Failed to remove member')
      }
    } catch (err) {
      console.error('Error removing member:', err)
      toast.error('Failed to remove member')
    }
  }

  const handleChangeRole = async (memberId: string, newRole: 'LEADER' | 'MEMBER') => {
    if (!selectedGroup) return
    try {
      const res = await fetch(
        `/api/community/${communityId}/working-groups/${selectedGroup.id}/members/${memberId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        }
      )
      if (res.ok) {
        const data = await res.json()
        setGroupMembers(prev =>
          prev.map(m => (m.id === memberId ? { ...m, role: data.role } : m))
        )
        toast.success('Role updated')
        fetchWorkingGroups()
      } else {
        const errorData = await res.json().catch(() => ({}))
        toast.error(errorData.error || 'Failed to update role')
      }
    } catch (err) {
      console.error('Error updating role:', err)
      toast.error('Failed to update role')
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      toast.error('Please enter a working group name')
      return
    }
    try {
      setCreating(true)
      const res = await fetch(`/api/community/${communityId}/working-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroup),
      })
      if (res.ok) {
        const data = await res.json()
        setWorkingGroups(prev => [...prev, data])
        setShowCreate(false)
        setNewGroup({ name: '', type: 'MANAGEMENT', description: '' })
        toast.success('Working group created')
      } else {
        const errorData = await res.json().catch(() => ({}))
        toast.error(errorData.error || 'Failed to create working group')
      }
    } catch (err) {
      console.error('Error creating group:', err)
      toast.error('Failed to create working group')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Delete this working group? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/community/${communityId}/working-groups/${groupId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setWorkingGroups(prev => prev.filter(g => g.id !== groupId))
        if (selectedGroup?.id === groupId) {
          closeGroupDetails()
        }
        toast.success('Working group deleted')
      } else {
        const errorData = await res.json().catch(() => ({}))
        toast.error(errorData.error || 'Failed to delete working group')
      }
    } catch (err) {
      console.error('Error deleting group:', err)
      toast.error('Failed to delete working group')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchWorkingGroups}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Reload
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Working Groups</h3>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Create Working Group
        </button>
      </div>
      {workingGroups.length === 0 ? (
        <div className=" text-center py-8 text-gray-500">No working groups yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workingGroups.map(group => (
            <button
              key={group.id}
              type="button"
              onClick={() => openGroupDetails(group)}
              className="text-left p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-700"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-lg font-medium text-gray-900">{group.name}</h4>
                <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                  {group.type}
                </span>
              </div>
              {group.description && (
                <p className="text-sm text-gray-600 mt-1 mb-2">{group.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                成员: {group.stats?.members ?? group.memberCount ?? 0}
              </p>
            </button>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Create new working group</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Type
                </label>
                <select
                  value={newGroup.type}
                  onChange={e =>
                    setNewGroup({ ...newGroup, type: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="MANAGEMENT">MANAGEMENT</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="FRONT_DOOR">FRONT_DOOR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newGroup.description}
                  onChange={e =>
                    setNewGroup({ ...newGroup, description: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={creating}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedGroup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedGroup.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Type: {selectedGroup.type} • Members: {groupMembers.length}
                </p>
              </div>
              <button
                onClick={closeGroupDetails}
                className="text-gray-400 hover:text-gray-600"
              >
                <ClipboardDocumentIcon className="h-5 w-5" />
              </button>
            </div>

     
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {groupLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading members...</p>
                </div>
              ) : (
                <>
                  {groupError && (
                    <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
                      <div className="font-medium mb-2">{groupError.split('\n')[0]}</div>
                      {groupError.includes('\n') && (
                        <div className="mt-2 space-y-1 text-xs">
                          {groupError.split('\n').slice(1).map((line, idx) => (
                            line.trim() && (
                              <div key={idx} className={line.startsWith('Go to:') ? 'mt-2 pt-2 border-t border-red-200' : ''}>
                                {line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.') || line.startsWith('5.') ? (
                                  <div className="flex items-start">
                                    <span className="mr-2 font-medium">{line.split('.')[0]}.</span>
                                    <span>{line.substring(line.indexOf('.') + 1).trim()}</span>
                                  </div>
                                ) : (
                                  <div>{line}</div>
                                )}
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Members</h4>
                    {groupMembers.length === 0 ? (
                      <div className="text-sm text-gray-500">No members yet</div>
                    ) : (
                      <div className="space-y-2">
                        {groupMembers.map((member: any) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between border border-gray-200 rounded-md px 3 py 2"
                          >
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {member.user?.name || member.user?.email}
                              </div>
                              <div className="text-xs text-gray-500">
                                {member.user?.email}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <select
                                value={member.role}
                                onChange={e =>
                                  handleChangeRole(
                                    member.id,
                                    e.target.value as 'LEADER' | 'MEMBER'
                                  )
                                }
                                className="text-xs border border-gray-300 rounded-md px-2 py-1"
                              >
                                <option value="LEADER">LEADER</option>
                                <option value="MEMBER">MEMBER</option>
                              </select>
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Add Member
                    </h4>
                    
                    {/* Method selector */}
                    <div className="mb-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAddMethod('select')
                          setAddEmail('')
                        }}
                        className={`px-3 py-1 text-xs font-medium rounded-md ${
                          addMethod === 'select'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Select from Members
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddMethod('email')
                          setAddUserId('')
                        }}
                        className={`px-3 py-1 text-xs font-medium rounded-md ${
                          addMethod === 'email'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Enter Email
                      </button>
                    </div>

                    {addMethod === 'select' ? (
                      <div className="space-y-2">
                        {loadingMembers ? (
                          <div className="text-sm text-gray-500">Loading members...</div>
                        ) : availableMembers.length === 0 ? (
                          <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded">
                            {communityMembers.length === 0
                              ? 'No community members available. Add members in the Members tab first.'
                              : 'All community members are already in this working group.'}
                          </div>
                        ) : (
                          <>
                            <select
                              value={addUserId}
                              onChange={e => setAddUserId(e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="">Select a member...</option>
                              {availableMembers.map((member) => (
                                <option key={member.user?.id} value={member.user?.id}>
                                  {member.user?.name || member.user?.email} ({member.user?.email})
                                  {member.role && ` - ${member.role}`}
                                </option>
                              ))}
                            </select>
                            <div className="flex gap-2 items-center">
                              <select
                                value={addRole}
                                onChange={e => setAddRole(e.target.value as 'LEADER' | 'MEMBER')}
                                className="border border-gray-300 rounded-md px-2 py-2 text-sm"
                              >
                                <option value="MEMBER">Member</option>
                                <option value="LEADER">Leader</option>
                              </select>
                              <button
                                type="button"
                                onClick={handleAddMember}
                                disabled={addingMember || !addUserId}
                                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                              >
                                {addingMember ? 'Adding...' : 'Add'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 items-center">
                          <input
                            type="email"
                            value={addEmail}
                            onChange={e => setAddEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="flex-1 min-w-[180px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                          />
                          <select
                            value={addRole}
                            onChange={e => setAddRole(e.target.value as 'LEADER' | 'MEMBER')}
                            className="border border-gray-300 rounded-md px-2 py-2 text-sm"
                          >
                            <option value="MEMBER">Member</option>
                            <option value="LEADER">Leader</option>
                          </select>
                          <button
                            type="button"
                            onClick={handleAddMember}
                            disabled={addingMember || !addEmail.trim()}
                            className="px-4 py-2 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                          >
                            {addingMember ? 'Adding...' : 'Add'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Make sure the user has already joined this community (in the Members tab)
                          before assigning them to a working group.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => handleDeleteGroup(selectedGroup.id)}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Delete working group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


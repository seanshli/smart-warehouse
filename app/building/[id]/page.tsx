'use client'

// For static export compatibility
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  BuildingOfficeIcon,
  HomeIcon,
  ArrowLeftIcon,
  PlusIcon,
  EnvelopeIcon,
  CalendarIcon,
  WrenchScrewdriverIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  IdentificationIcon,
  CogIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import MailboxManager from '@/components/building/MailboxManager'
import PackageManager from '@/components/building/PackageManager'
import QRCodeDisplay from '@/components/QRCode'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useLanguage } from '@/components/LanguageProvider'
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline'
import CreateAnnouncementModal from '@/components/admin/CreateAnnouncementModal'
import { BellIcon } from '@heroicons/react/24/outline'

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
  floorCountActual?: number
  mailboxCount?: number
  createdAt: string
  updatedAt: string
}

export default function BuildingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { currentLanguage, setLanguage, t } = useLanguage()
  const buildingId = params.id as string
  const initialTabFromQuery =
    (searchParams?.get('tab') as
      | 'overview'
      | 'households'
      | 'mailboxes'
      | 'frontdoor'
      | 'packages'
      | 'facilities'
      | 'announcements'
      | 'working-groups'
      | null) || 'overview'

  const [building, setBuilding] = useState<Building | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<
    'overview' | 'households' | 'mailboxes' | 'frontdoor' | 'packages' | 'facilities' | 'announcements' | 'working-groups'
  >(initialTabFromQuery)
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false)

  useEffect(() => {
    if (buildingId) {
      fetchBuilding()
    }
  }, [buildingId])

  const fetchBuilding = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('[BuildingDetailPage] Fetching building:', buildingId)
      
      const response = await fetch(`/api/building/${buildingId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('[BuildingDetailPage] Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[BuildingDetailPage] Error response:', errorData)
        throw new Error(errorData.error || 'Failed to fetch building')
      }
      
      const data = await response.json()
      console.log('[BuildingDetailPage] Received data:', data)
      setBuilding(data)
    } catch (err) {
      console.error('[BuildingDetailPage] Error fetching building:', err)
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
          <p className="mt-4 text-gray-600">{t('buildingLoading')}</p>
        </div>
      </div>
    )
  }

  if (error || !building) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || t('buildingNotFound')}</p>
          <Link href="/community" className="mt-4 text-primary-600 hover:text-primary-700">
            {t('buildingBackToCommunity')}
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
            <span>{t('adminBuildings')}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{building.name}</h1>
              {building.description && (
                <p className="mt-2 text-sm text-gray-600">{building.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {/* Language Selection */}
              <div className="flex items-center space-x-2">
                <label htmlFor="language-select-building" className="text-sm text-gray-500">{t('commonLanguage')}:</label>
                <select
                  id="language-select-building"
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
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: t('buildingOverview'), icon: BuildingOfficeIcon },
              { id: 'households', name: t('buildingHouseholds'), icon: HomeIcon },
              { id: 'frontdoor', name: t('frontDoorCommonArea'), icon: BuildingStorefrontIcon },
              { id: 'mailboxes', name: t('buildingMailboxes'), icon: EnvelopeIcon },
              { id: 'packages', name: t('packageLocker') || 'Packages', icon: CubeIcon },
              { id: 'facilities', name: t('buildingFacilities'), icon: CogIcon },
              { id: 'working-groups', name: t('communityWorkingGroups') || 'Working Groups', icon: UserGroupIcon },
              { id: 'announcements', name: t('announcements'), icon: BellIcon },
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
          {activeTab === 'overview' && <OverviewTab building={building} buildingId={buildingId} onNavigateTab={setActiveTab} />}
          {activeTab === 'households' && <HouseholdsTab buildingId={buildingId} />}
          {activeTab === 'frontdoor' && <FrontDoorTab buildingId={buildingId} />}
          {activeTab === 'mailboxes' && <MailboxManager buildingId={buildingId} />}
          {activeTab === 'packages' && <PackageManager buildingId={buildingId} />}
          {activeTab === 'facilities' && <FacilitiesTab buildingId={buildingId} />}
          {activeTab === 'working-groups' && buildingId && <WorkingGroupsTab buildingId={buildingId} />}
          {activeTab === 'announcements' && buildingId && (
            <AnnouncementsTab 
              buildingId={buildingId} 
              buildingName={building?.name || ''}
              onShowCreate={() => setShowCreateAnnouncement(true)}
            />
          )}
        </div>

        {/* Create Announcement Modal */}
        {buildingId && (
          <CreateAnnouncementModal
            isOpen={showCreateAnnouncement}
            onClose={() => setShowCreateAnnouncement(false)}
            onSuccess={() => {
              setShowCreateAnnouncement(false)
              if (activeTab === 'announcements') {
                window.location.reload()
              }
            }}
            source="BUILDING"
            sourceId={buildingId}
            sourceName={building?.name}
            targetType="ALL_HOUSEHOLDS"
          />
        )}
      </div>
    </div>
  )
}

function OverviewTab({ building, buildingId, onNavigateTab }: { building: Building; buildingId: string; onNavigateTab: (tab: 'overview' | 'households' | 'mailboxes' | 'frontdoor' | 'facilities') => void }) {
  const { t } = useLanguage()
  const [settingUp, setSettingUp] = useState(false)
  const [setupStatus, setSetupStatus] = useState<{
    floors: number
    households: number
    mailboxes: number
  } | null>(null)
  const [frontDoorSummary, setFrontDoorSummary] = useState<any>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [workingTeamSummary, setWorkingTeamSummary] = useState<any[]>([])

  // Check if floors and units are already set up
  const isSetup = (building.floorCountActual && building.floorCountActual > 0) || 
                  (building.mailboxCount && building.mailboxCount > 0)

  useEffect(() => {
    if (isSetup) {
      setSetupStatus({
        floors: building.floorCountActual || 0,
        households: building.householdCount || 0,
        mailboxes: building.mailboxCount || 0,
      })
    }
    fetchFrontDoorSummary()
    fetchWorkingTeamSummary()
  }, [building.floorCountActual, building.householdCount, building.mailboxCount, isSetup, buildingId])

  const fetchFrontDoorSummary = async () => {
    try {
      setLoadingSummary(true)
      const response = await fetch(`/api/building/${buildingId}/front-door`)
      if (response.ok) {
        const data = await response.json()
        setFrontDoorSummary(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch front door summary:', err)
    } finally {
      setLoadingSummary(false)
    }
  }

  const fetchWorkingTeamSummary = async () => {
    try {
      const response = await fetch(`/api/building/${buildingId}/working-groups`)
      if (!response.ok) {
        return
      }

      const data = await response.json()
      const groups: any[] = data.workingGroups || []

      const TYPES = [
        { type: 'MANAGEMENT', label: 'Management Team' },
        { type: 'MAINTENANCE', label: 'Maintenance Team' },
        { type: 'FRONT_DOOR', label: 'Front Door Team' },
      ]

      const summary = TYPES.map((entry) => {
        const group = groups.find((g) => g.type === entry.type)

        if (!group) {
          return {
            type: entry.type,
            label: entry.label,
            exists: false,
            members: 0,
            leaders: 0,
            defaultAccountsOk: entry.type !== 'FRONT_DOOR' ? false : false,
            status: 'missing',
          }
        }

        const members = group.members || []
        const leaders = members.filter((m: any) => m.role === 'LEADER').length

        let defaultAccountsOk = true
        if (entry.type === 'FRONT_DOOR') {
          const hasDoorbell = members.some((m: any) => m.userEmail?.startsWith('doorbell@'))
          const hasFrontdesk = members.some((m: any) => m.userEmail?.startsWith('frontdesk@'))
          defaultAccountsOk = hasDoorbell && hasFrontdesk
        }

        let status: 'ok' | 'warning' | 'missing' = 'ok'
        if (!group || members.length === 0) {
          status = 'missing'
        } else if (leaders === 0 || (entry.type === 'FRONT_DOOR' && !defaultAccountsOk)) {
          status = 'warning'
        }

        return {
          type: entry.type,
          label: entry.label,
          exists: true,
          members: members.length,
          leaders,
          defaultAccountsOk,
          status,
        }
      })

      setWorkingTeamSummary(summary)
    } catch (error) {
      console.error('Failed to fetch working team summary:', error)
    }
  }

  const handleSetupFloorsUnits = async () => {
    try {
      setSettingUp(true)
      const response = await fetch(`/api/building/${buildingId}/floors-units/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to set up floors and units')
      }

      const data = await response.json()
      toast.success(`${t('buildingSetupComplete')}: ${data.data.floors} ${t('buildingFloor')}, ${data.data.households} ${t('buildingUnitsSetup')}, ${data.data.mailboxes} ${t('buildingMailbox')}`)
      
      // Update local state
      setSetupStatus({
        floors: data.data.floors,
        households: data.data.households,
        mailboxes: data.data.mailboxes,
      })
      
      // Refresh building data
      setTimeout(() => window.location.reload(), 1500)
    } catch (error) {
      console.error('Error setting up floors and units:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to set up floors and units')
    } finally {
      setSettingUp(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('buildingBasicInfo')}</h3>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">{t('buildingCommunity')}</dt>
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
              <dt className="text-sm font-medium text-gray-500">{t('streetAddress')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{building.address}</dd>
            </div>
          )}
          {building.floorCount && (
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('buildingFloorCount')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{building.floorCount}</dd>
            </div>
          )}
          {building.unitCount && (
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('buildingUnitCount')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{building.unitCount}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500">{t('buildingHouseholdCount')}</dt>
            <dd className="mt-1 text-sm text-gray-900">{building.householdCount}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">{t('buildingCreatedAt')}</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(building.createdAt).toLocaleDateString('zh-TW')}
            </dd>
          </div>
          {building.invitationCode && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500 mb-1">{t('buildingInvitationCode')}</dt>
              <dd className="mt-1">
                <div className="flex items-center space-x-2 mb-2">
                  <code className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-mono">
                    {building.invitationCode}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(building.invitationCode!)
                      toast.success(t('copyInvitationCode'))
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {t('buildingCopyCode')}
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <QRCodeDisplay 
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join?code=${building.invitationCode}&type=building`} 
                      size={120} 
                      className="p-2 bg-white rounded border border-gray-200" 
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">
                      {t('buildingShareCode')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t('scanQRCodeToJoin')}
                    </p>
                  </div>
                </div>
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('buildingSummary')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
            <div className="text-2xl font-bold text-blue-900">{building.householdCount || 0}</div>
            <div className="text-sm text-blue-700 mt-1">{t('buildingHouseholdCount')}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
            <div className="text-2xl font-bold text-green-900">{building.floorCountActual || 0}</div>
            <div className="text-sm text-green-700 mt-1">{t('buildingFloor')}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
            <div className="text-2xl font-bold text-purple-900">{building.mailboxCount || 0}</div>
            <div className="text-sm text-purple-700 mt-1">{t('buildingMailbox')}</div>
          </div>
          {frontDoorSummary && (
            <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
              <div className="text-2xl font-bold text-orange-900">{frontDoorSummary.packageLockers?.length || 0}</div>
              <div className="text-sm text-orange-700 mt-1">{t('buildingPackageLockers')}</div>
            </div>
          )}
        </div>

        {workingTeamSummary && workingTeamSummary.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium text-gray-900">Working Teams</h4>
              <button
                onClick={() => onNavigateTab('facilities')}
                className="text-xs text-primary-600 hover:text-primary-700 underline"
              >
                View details
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {workingTeamSummary.map((team) => (
                <div
                  key={team.type}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900">{team.label}</p>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          team.status === 'ok'
                            ? 'bg-green-100 text-green-800'
                            : team.status === 'warning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {team.status === 'ok'
                          ? 'Ready'
                          : team.status === 'warning'
                          ? 'Needs Attention'
                          : 'Not Set Up'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      {team.type === 'MANAGEMENT' &&
                        'Manages overall building and community operations.'}
                      {team.type === 'MAINTENANCE' &&
                        'Handles maintenance and repair tasks for this building.'}
                      {team.type === 'FRONT_DOOR' &&
                        'Handles front door, visitor access, and security.'}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <p className="font-medium">Members</p>
                        <p>{team.members}</p>
                      </div>
                      <div>
                        <p className="font-medium">Leaders</p>
                        <p>{team.leaders}</p>
                      </div>
                      {team.type === 'FRONT_DOOR' && (
                        <div className="col-span-2">
                          <p className="font-medium">Default Accounts</p>
                          <p className={team.defaultAccountsOk ? 'text-green-700' : 'text-yellow-700'}>
                            {team.defaultAccountsOk ? 'doorbell & frontdesk linked' : 'Missing doorbell/frontdesk accounts'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[11px] text-gray-500">
                      Tasks:
                      {' '}
                      {team.exists ? 'Team created' : 'Create team'} ·{' '}
                      {team.leaders > 0 ? 'Leader assigned' : 'Assign a leader'} ·{' '}
                      {team.type === 'FRONT_DOOR'
                        ? team.defaultAccountsOk
                          ? 'Front desk/doorbell accounts ready'
                          : 'Create/link frontdesk & doorbell accounts'
                        : 'Add building staff as members'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('buildingSettings')}</h3>
        
        {isSetup ? (
          // 已设置状态
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-green-800">{t('buildingFloorsSetup')}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{setupStatus?.floors || building.floorCountActual || 0}</div>
                <div className="text-xs text-gray-500 mt-1">{t('buildingFloor')}</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{setupStatus?.households || building.householdCount || 0}</div>
                <div className="text-xs text-gray-500 mt-1">{t('buildingUnitsSetup')}</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{setupStatus?.mailboxes || building.mailboxCount || 0}</div>
                <div className="text-xs text-gray-500 mt-1">{t('buildingMailbox')}</div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => onNavigateTab('households')}
                className="flex-1 px-4 py-2 bg-white border border-green-300 text-green-700 rounded-md hover:bg-green-100 text-center text-sm font-medium"
              >
                {t('buildingViewHouseholds')}
              </button>
              <button
                onClick={() => onNavigateTab('mailboxes')}
                className="flex-1 px-4 py-2 bg-white border border-green-300 text-green-700 rounded-md hover:bg-green-100 text-center text-sm font-medium"
              >
                {t('buildingManageMailboxes')}
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-green-200">
              <button
                onClick={handleSetupFloorsUnits}
                disabled={settingUp}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                {settingUp ? t('buildingSetupInProgress') : t('buildingResetFloorsUnits')}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {t('buildingResetWarning')}
              </p>
            </div>
          </div>
        ) : (
          // 未设置状态
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-4">
              为建筑设置楼层和住户单元。系统将自动创建：
            </p>
            <ul className="text-sm text-gray-600 mb-4 list-disc list-inside space-y-1">
              <li>10 层楼（1-10层）</li>
              <li>2-9 层为住户层，每层 4 个单元（A, B, C, D）</li>
              <li>每个单元对应的邮箱（位于公共区域）</li>
            </ul>
            <button
              onClick={handleSetupFloorsUnits}
              disabled={settingUp}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {settingUp ? t('buildingSetupInProgress') : t('buildingSetupFloorsUnits')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function HouseholdCard({ household, onManageMembers }: { household: any; onManageMembers?: (householdId: string) => void }) {
  const { t } = useLanguage()
  const [copiedId, setCopiedId] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const isActive = household.stats.members > 0
  
  const copyToClipboard = async (text: string, type: 'id' | 'code') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'id') {
        setCopiedId(true)
        setTimeout(() => setCopiedId(false), 2000)
      } else {
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 2000)
      }
      toast.success(t('copyInvitationCode'))
    } catch (err) {
      toast.error(t('copyError'))
    }
  }
  
  return (
    <div 
      className={`border rounded-lg p-3 hover:shadow-md w-72 flex-shrink-0 transition-all ${
        isActive 
          ? 'border-gray-200 bg-white hover:bg-gray-50' 
          : 'border-gray-300 bg-gray-100 hover:bg-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/household/${household.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-gray-900 hover:text-primary-600"
            >
              {household.name}
            </Link>
            {isActive ? (
              <CheckCircleIcon className="h-4 w-4 text-green-500" title={t('householdActive')} />
            ) : (
              <XCircleIcon className="h-4 w-4 text-gray-400" title={t('householdInactive')} />
            )}
          </div>
          {household.apartmentNo && (
            <p className="text-xs text-gray-500 mt-1">{household.apartmentNo}</p>
          )}
        </div>
      </div>
      
      {/* Household ID and Invitation Code */}
      <div className="space-y-2 mb-3 pt-2 border-t border-gray-100">
        {/* Household ID */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">{t('householdId')}:</span>
          <div className="flex items-center gap-1">
            <code className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
              {household.id.substring(0, 8)}...
            </code>
            <button
              onClick={(e) => {
                e.stopPropagation()
                copyToClipboard(household.id, 'id')
              }}
              className="p-1 text-gray-500 hover:text-primary-600"
              title={t('copyHouseholdId')}
            >
              {copiedId ? (
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ClipboardDocumentIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        
        {/* Invitation Code */}
        {household.invitationCode && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{t('householdInvitationCode')}:</span>
              <div className="flex items-center gap-1">
                <code className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                  {household.invitationCode.substring(0, 8)}...
                </code>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToClipboard(household.invitationCode, 'code')
                  }}
                  className="p-1 text-gray-500 hover:text-primary-600"
                  title={t('copyInvitationCode')}
                >
                  {copiedCode ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-center pt-1">
              <QRCodeDisplay 
                value={household.invitationCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join?code=${household.invitationCode}&type=household` : ''} 
                size={80} 
                className="p-2 bg-white rounded" 
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-3 pt-2 border-t border-gray-100">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <HomeIcon className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-sm font-semibold text-gray-900">{household.stats.members}</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <CubeIcon className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-sm font-semibold text-gray-900">{household.stats.items}</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-sm font-semibold text-gray-900">{household.stats.rooms}</div>
        </div>
      </div>

      {isActive && onManageMembers && (
        <div className="pt-2 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onManageMembers(household.id)
            }}
            className="w-full px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors flex items-center justify-center gap-2"
            title="Manage Members"
          >
            <UserIcon className="h-4 w-4" />
            <span>Manage Members</span>
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-gray-100 text-xs">
        <Link
          href={`/household/${household.id}/reservation`}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
          title={t('householdReservation')}
        >
          <CalendarIcon className="h-4 w-4 mb-1" />
          <span className="hidden sm:inline">{t('householdReservation')}</span>
        </Link>
        <Link
          href={`/household/${household.id}/maintenance`}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
          title={t('householdMaintenance')}
        >
          <WrenchScrewdriverIcon className="h-4 w-4 mb-1" />
          <span className="hidden sm:inline">{t('householdMaintenance')}</span>
        </Link>
        <div className="relative group">
          <button
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors w-full"
            title={t('householdProperty')}
          >
            <BuildingStorefrontIcon className="h-4 w-4 mb-1" />
            <span className="hidden sm:inline">{t('householdProperty')}</span>
          </button>
          <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all min-w-[140px]">
            <Link
              href={`/household/${household.id}/property/mail`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded"
            >
              <EnvelopeIcon className="h-4 w-4 mr-2" />
              {t('householdMail')}
            </Link>
            <Link
              href={`/household/${household.id}/property/package`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded"
            >
              <CubeIcon className="h-4 w-4 mr-2" />
              {t('householdPackage')}
            </Link>
            <Link
              href={`/household/${household.id}/property/visitor`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded"
            >
              <IdentificationIcon className="h-4 w-4 mr-2" />
              {t('householdVisitorTag')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function HouseholdsTab({ buildingId }: { buildingId: string }) {
  const { t } = useLanguage()
  const [floors, setFloors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null)

  useEffect(() => {
    fetchHouseholds()
  }, [buildingId])

  const fetchHouseholds = async () => {
    try {
      const response = await fetch(`/api/building/${buildingId}/households`)
      if (response.ok) {
        const data = await response.json()
        setFloors(data.floors || [])
      }
    } catch (err) {
      console.error('Failed to fetch households:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleManageMembers = (householdId: string) => {
    setSelectedHouseholdId(householdId)
  }

  if (loading) {
    return <div className="text-center py-8">{t('buildingLoading')}</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">{t('buildingHouseholds')}</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          {t('addHousehold')}
        </button>
      </div>

      {floors.length === 0 ? (
        <div className="text-center py-8 text-gray-500">{t('buildingNoHouseholds')}</div>
      ) : (
        <div className="space-y-4">
          {floors.map((floor) => (
            <div key={floor.floorNumber} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h4 className="font-semibold text-gray-900">
                  {t('buildingFloor')} {floor.floorNumber}
                  {floor.floor?.name && ` - ${floor.floor.name}`}
                </h4>
              </div>
              <div className="overflow-x-auto">
                <div className="flex gap-3 min-w-max">
                  {floor.households.map((household: any) => (
                    <HouseholdCard 
                      key={household.id} 
                      household={household} 
                      onManageMembers={handleManageMembers}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <AddHouseholdModal
          buildingId={buildingId}
          onClose={() => setIsModalOpen(false)}
          onCreated={() => {
            setIsModalOpen(false)
            fetchHouseholds()
          }}
        />
      )}

      {selectedHouseholdId && (
        <HouseholdMemberRoleModal
          householdId={selectedHouseholdId}
          onClose={() => setSelectedHouseholdId(null)}
          onUpdated={() => {
            setSelectedHouseholdId(null)
            fetchHouseholds()
          }}
        />
      )}
    </div>
  )
}

function HouseholdMemberRoleModal({
  householdId,
  onClose,
  onUpdated,
}: {
  householdId: string
  onClose: () => void
  onUpdated: () => void
}) {
  const { t } = useLanguage()
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (householdId) {
      fetchMembers()
    }
  }, [householdId])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      console.log('[HouseholdMemberRoleModal] Fetching members for household:', householdId)
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/household/members?householdId=${householdId}&_t=${timestamp}`, {
        cache: 'no-store', // Always fetch fresh data
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[HouseholdMemberRoleModal] Failed to fetch members:', {
          status: response.status,
          error: errorData.error
        })
        throw new Error(errorData.error || 'Failed to fetch members')
      }
      
      const data = await response.json()
      console.log('[HouseholdMemberRoleModal] Members fetched:', {
        count: data.members?.length || 0,
        members: data.members?.map((m: any) => ({
          id: m.id,
          email: m.user?.email,
          role: m.role,
          userId: m.user?.id
        })),
        isBuildingAdmin: data.isBuildingAdmin,
        timestamp: new Date().toISOString()
      })
      // Force update state to ensure React re-renders with new data
      setMembers([])
      setTimeout(() => {
        setMembers(data.members || [])
      }, 0)
    } catch (err) {
      console.error('[HouseholdMemberRoleModal] Error fetching members:', err)
      toast.error(err instanceof Error ? err.message : 'Error loading members')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      setUpdating((prev) => ({ ...prev, [memberId]: true }))
      console.log('[HouseholdMemberRoleModal] Attempting role change:', {
        memberId,
        newRole,
        householdId
      })
      
      const response = await fetch(`/api/household/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      const responseData = await response.json().catch(() => ({}))

      if (!response.ok) {
        console.error('[HouseholdMemberRoleModal] Role update failed:', {
          status: response.status,
          statusText: response.statusText,
          error: responseData.error,
          debug: responseData.debug
        })
        throw new Error(responseData.error || `Failed to update role (${response.status})`)
      }

      console.log('[HouseholdMemberRoleModal] Role updated successfully:', responseData)
      toast.success('Role updated successfully')
      // Force refresh with a small delay to ensure database is updated
      setTimeout(() => {
        fetchMembers()
        onUpdated()
      }, 100)
    } catch (err) {
      console.error('[HouseholdMemberRoleModal] Error updating role:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error updating role'
      toast.error(errorMessage)
    } finally {
      setUpdating((prev) => ({ ...prev, [memberId]: false }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Manage Household Members</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">{t('buildingLoading')}</div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No members found</div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {member.user.name || member.user.email}
                      </p>
                      <p className="text-xs text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      disabled={updating[member.id]}
                      className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                    >
                      <option value="OWNER">OWNER</option>
                      <option value="USER">USER</option>
                      <option value="VISITOR">VISITOR</option>
                    </select>
                    {updating[member.id] && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {t('close') || 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddHouseholdModal({
  buildingId,
  onClose,
  onCreated,
}: {
  buildingId: string
  onClose: () => void
  onCreated: () => void
}) {
  const { t } = useLanguage()
  const [floorNumber, setFloorNumber] = useState(3)
  const [unitCount, setUnitCount] = useState(4)
  const [unitLabels, setUnitLabels] = useState<string[]>(['A', 'B', 'C', 'D'])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setUnitLabels((prev) => {
      const base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
      const next = [...prev]
      while (next.length < unitCount) {
        next.push(base[next.length % base.length])
      }
      return next.slice(0, unitCount)
    })
  }, [unitCount])

  const handleSubmit = async () => {
    try {
      setIsSaving(true)
      const units = unitLabels.map((label) => label.trim()).filter(Boolean)

      const response = await fetch(`/api/building/${buildingId}/households`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          floorNumber,
          units,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create households')
      }

      toast.success(t('householdCreated'))
      onCreated()
    } catch (error) {
      console.error('Error creating households:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create households')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('addHousehold')}</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('buildingFloor')}</label>
            <input
              type="number"
              min={1}
              max={50}
              value={floorNumber}
              onChange={(e) => setFloorNumber(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{t('householdCount')}</label>
            <input
              type="number"
              min={1}
              max={12}
              value={unitCount}
              onChange={(e) => setUnitCount(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{t('householdUnitLabels')}</label>
            <div className="mt-2 space-y-2 max-h-44 overflow-y-auto pr-2">
              {unitLabels.map((label, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 w-12">{t('buildingFloor')} {floorNumber}</span>
                  <input
                    value={label}
                    onChange={(e) => {
                      const next = [...unitLabels]
                      next[index] = e.target.value.toUpperCase()
                      setUnitLabels(next)
                    }}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-gray-400"
          >
            {isSaving ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}

function FrontDoorTab({ buildingId }: { buildingId: string }) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<any>(null)
  const [lockerCount, setLockerCount] = useState(10)
  const [updatingLockers, setUpdatingLockers] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/building/${buildingId}/front-door`)
      if (!response.ok) {
        throw new Error('Failed to load front door data')
      }
      const data = await response.json()
      setSummary(data.data)
      setLockerCount(data.data.packageLockers.length || 10)
    } catch (error) {
      console.error('Error loading front door data:', error)
      toast.error(t('frontDoorLoadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingId])

  const handleSync = async () => {
    try {
      setSyncing(true)
      const response = await fetch(`/api/building/${buildingId}/front-door`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageLockerCount: lockerCount }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to sync front door facilities')
      }
      toast.success(t('frontDoorSyncSuccess'))
      fetchSummary()
    } catch (error) {
      console.error('Error syncing front door facilities:', error)
      toast.error(error instanceof Error ? error.message : t('frontDoorSyncError'))
    } finally {
      setSyncing(false)
    }
  }

  const handleLockerUpdate = async () => {
    try {
      setUpdatingLockers(true)
      const response = await fetch(`/api/building/${buildingId}/package-locker`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: lockerCount }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update locker count')
      }
      toast.success(t('frontDoorLockerUpdateSuccess'))
      fetchSummary()
    } catch (error) {
      console.error('Error updating locker count:', error)
      toast.error(error instanceof Error ? error.message : t('frontDoorLockerUpdateError'))
    } finally {
      setUpdatingLockers(false)
    }
  }

  const handleMailNotify = async (mailboxId: string) => {
    try {
      const response = await fetch(`/api/building/${buildingId}/mailboxes/${mailboxId}/notify`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Failed to notify household')
      }
      toast.success(t('frontDoorNotifySuccess'))
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error(t('frontDoorNotifyError'))
    }
  }

  const handleDoorBellToggle = async (doorBellId: string, isEnabled: boolean) => {
    try {
      const response = await fetch(`/api/building/${buildingId}/door-bell/${doorBellId}/enable`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled }),
      })
      if (!response.ok) {
        throw new Error('Failed to update door bell')
      }
      toast.success(isEnabled ? t('frontDoorEnable') : t('frontDoorDisable'))
      fetchSummary()
    } catch (error) {
      console.error('Error toggling door bell:', error)
      toast.error(t('frontDoorDoorBellError'))
    }
  }

  const handleRingDoorBell = async (doorBellId: string) => {
    try {
      const response = await fetch(`/api/building/${buildingId}/door-bell/ring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doorBellId }),
      })
      if (!response.ok) {
        throw new Error('Failed to ring door bell')
      }
      toast.success(t('frontDoorRingSuccess'))
    } catch (error) {
      console.error('Error ringing door bell:', error)
      toast.error(t('frontDoorRingError'))
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">{t('frontDoorLoading')}</div>
  }

  if (!summary) {
    return <div className="text-center py-8 text-gray-500">{t('frontDoorLoadError')}</div>
  }

  const loginUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/building/${buildingId}/front-door/login?auto=true`
    : ''

  return (
    <div className="space-y-6">
      {/* QR Code for Front Door Login */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Front Door Login QR Code</h3>
            <p className="text-xs text-blue-700 mb-3">
              Scan this QR code to quickly log in to the front door system. This will automatically log in with the frontdesk account.
            </p>
            {loginUrl && (
              <div className="flex items-center space-x-4">
                <div className="bg-white p-2 rounded">
                  <QRCodeDisplay value={loginUrl} size={120} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-blue-600 mb-2">Login URL:</p>
                  <p className="text-xs font-mono text-blue-800 break-all">{loginUrl}</p>
                  <Link
                    href={`/building/${buildingId}/front-door/login`}
                    className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Open Login Page →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">{summary.households.length}</div>
          <p className="text-sm text-gray-500 mt-1">{t('frontDoorStatsHouseholds')}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">{summary.mailboxes.length}</div>
          <p className="text-sm text-gray-500 mt-1">{t('frontDoorStatsMailboxes')}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">{summary.doorBells.length}</div>
          <p className="text-sm text-gray-500 mt-1">{t('frontDoorStatsDoorBells')}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">{summary.packageLockers.length}</div>
          <p className="text-sm text-gray-500 mt-1">{t('frontDoorStatsLockers')}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-700">{t('frontDoorLockerCountLabel')}</p>
            <p className="text-xs text-gray-500">{t('frontDoorLockerCountHint')}</p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min={0}
              max={100}
              value={lockerCount}
              onChange={(e) => setLockerCount(Number(e.target.value))}
              className="w-24 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
            <button
              onClick={handleLockerUpdate}
              disabled={updatingLockers}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-gray-400"
            >
              {updatingLockers ? t('saving') : t('save')}
            </button>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-md hover:bg-primary-100 disabled:bg-gray-100"
            >
              {syncing ? t('frontDoorSyncing') : t('frontDoorSyncButton')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold text-gray-900">{t('buildingMailboxes')}</h4>
            <span className="text-xs text-gray-500">{summary.mailboxes.length}</span>
          </div>
          {summary.mailboxes.length === 0 ? (
            <p className="text-sm text-gray-500">{t('frontDoorNoMailboxes')}</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {summary.mailboxes.map((mailbox: any) => (
                <div key={mailbox.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{mailbox.mailboxNumber}</p>
                    <p className="text-xs text-gray-500">
                      {mailbox.household?.name || t('householdProperty')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleMailNotify(mailbox.id)}
                    className="px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                  >
                    {t('frontDoorNotifyButton')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold text-gray-900">{t('frontDoorDoorBells')}</h4>
            <span className="text-xs text-gray-500">{summary.doorBells.length}</span>
          </div>
          {summary.doorBells.length === 0 ? (
            <p className="text-sm text-gray-500">{t('frontDoorNoDoorBells')}</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {summary.doorBells.map((bell: any) => (
                <div key={bell.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">{bell.doorBellNumber}</p>
                        {bell.isEnabled && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800">
                            Enabled
                          </span>
                        )}
                        {bell.household ? (
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800">
                            Linked
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                            Not Linked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {bell.household?.name || bell.household?.apartmentNo || 'No household linked'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDoorBellToggle(bell.id, !bell.isEnabled)}
                        disabled={!bell.household}
                        className="px-3 py-1 text-xs font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                        title={!bell.household ? 'Link household first' : ''}
                      >
                        {bell.isEnabled ? t('frontDoorDisable') : t('frontDoorEnable')}
                      </button>
                      <button
                        onClick={() => handleRingDoorBell(bell.id)}
                        disabled={!bell.isEnabled || !bell.household}
                        className="px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        title={!bell.household ? 'Link household first' : !bell.isEnabled ? 'Enable first' : ''}
                      >
                        {t('frontDoorRingButton')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-semibold text-gray-900">{t('frontDoorPackageLockers')}</h4>
          <span className="text-xs text-gray-500">{summary.packageLockers.length}</span>
        </div>
        {summary.packageLockers.length === 0 ? (
          <p className="text-sm text-gray-500">{t('frontDoorNoLockers')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">{t('frontDoorLocker')}</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summary.packageLockers.map((locker: any) => (
                  <tr key={locker.id}>
                    <td className="px-4 py-2 font-medium text-gray-900">#{locker.lockerNumber}</td>
                    <td className="px-4 py-2">
                      {locker.isOccupied ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {t('occupied')}
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {t('available')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function ensureWeekHours(hours: any[]) {
  const map = new Map<number, any>()
  hours.forEach((entry) => map.set(entry.dayOfWeek, entry))
  const defaults = []
  for (let day = 0; day < 7; day++) {
    defaults.push(
      map.get(day) || {
        dayOfWeek: day,
        openTime: '09:00',
        closeTime: '21:00',
        isClosed: day === 0,
      }
    )
  }
  return defaults
}

function AnnouncementsTab({ 
  buildingId, 
  buildingName, 
  onShowCreate 
}: { 
  buildingId: string
  buildingName: string
  onShowCreate: () => void
}) {
  const { t } = useLanguage()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnnouncements()
  }, [buildingId])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/announcements?source=BUILDING&sourceId=${buildingId}`)
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

function FacilitiesTab({ buildingId }: { buildingId: string }) {
  const { t } = useLanguage()
  const [facilities, setFacilities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '',
    type: 'custom',
    floorNumber: 2,
    capacity: 10,
  })
  const [editingFacility, setEditingFacility] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    type: 'custom',
    floorNumber: 2,
    capacity: 10,
  })
  const [hoursState, setHoursState] = useState<Record<string, any[]>>({})
  const [savingFacility, setSavingFacility] = useState(false)
  const [savingHours, setSavingHours] = useState<Record<string, boolean>>({})
  const [updatingFacility, setUpdatingFacility] = useState<Record<string, boolean>>({})

  const fetchFacilities = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/building/${buildingId}/facility`)
      if (!response.ok) {
        throw new Error('Failed to load facilities')
      }
      const data = await response.json()
      setFacilities(data.data || [])
      const map: Record<string, any[]> = {}
      data.data?.forEach((facility: any) => {
        map[facility.id] = ensureWeekHours(facility.operatingHours || [])
      })
      setHoursState(map)
    } catch (error) {
      console.error('Error loading facilities:', error)
      toast.error(t('facilityLoadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFacilities()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingId])

  const handleCreate = async () => {
    try {
      setSavingFacility(true)
      const response = await fetch(`/api/building/${buildingId}/facility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create facility')
      }
      toast.success(t('facilityCreated'))
      setForm({ name: '', type: 'custom', floorNumber: 2, capacity: 10 })
      fetchFacilities()
    } catch (error) {
      console.error('Error creating facility:', error)
      toast.error(error instanceof Error ? error.message : t('facilityCreateError'))
    } finally {
      setSavingFacility(false)
    }
  }

  const handleEdit = (facility: any) => {
    setEditingFacility(facility.id)
    setEditForm({
      name: facility.name || '',
      type: facility.type || 'custom',
      floorNumber: facility.floorNumber || 2,
      capacity: facility.capacity || 10,
    })
  }

  const handleCancelEdit = () => {
    setEditingFacility(null)
    setEditForm({ name: '', type: 'custom', floorNumber: 2, capacity: 10 })
  }

  const handleUpdate = async (facilityId: string) => {
    try {
      setUpdatingFacility(prev => ({ ...prev, [facilityId]: true }))
      const response = await fetch(`/api/building/${buildingId}/facility/${facilityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update facility')
      }
      toast.success(t('facilityUpdated') || 'Facility updated successfully')
      setEditingFacility(null)
      setEditForm({ name: '', type: 'custom', floorNumber: 2, capacity: 10 })
      fetchFacilities()
    } catch (error) {
      console.error('Error updating facility:', error)
      toast.error(error instanceof Error ? error.message : t('facilityUpdateError') || 'Failed to update facility')
    } finally {
      setUpdatingFacility(prev => ({ ...prev, [facilityId]: false }))
    }
  }

  const handleDelete = async (facilityId: string) => {
    if (!confirm(t('facilityDeleteConfirm'))) {
      return
    }
    try {
      const response = await fetch(`/api/building/${buildingId}/facility/${facilityId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete facility')
      }
      toast.success(t('facilityDeleted'))
      fetchFacilities()
    } catch (error) {
      console.error('Error deleting facility:', error)
      toast.error(t('facilityDeleteError'))
    }
  }

  const updateHoursState = (facilityId: string, dayIndex: number, field: string, value: string | boolean) => {
    setHoursState((prev) => {
      const next = { ...prev }
      const dayHours = [...(next[facilityId] || ensureWeekHours([]))]
      dayHours[dayIndex] = {
        ...dayHours[dayIndex],
        [field]: value,
      }
      next[facilityId] = dayHours
      return next
    })
  }

  const saveHours = async (facilityId: string) => {
    try {
      setSavingHours((prev) => ({ ...prev, [facilityId]: true }))
      const response = await fetch(`/api/building/${buildingId}/facility/${facilityId}/operating-hours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatingHours: hoursState[facilityId],
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to save operating hours')
      }
      toast.success(t('facilityHoursSaved'))
      fetchFacilities()
    } catch (error) {
      console.error('Error saving hours:', error)
      toast.error(t('facilityHoursError'))
    } finally {
      setSavingHours((prev) => ({ ...prev, [facilityId]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-base font-semibold text-gray-900 mb-4">{t('facilityAddNew')}</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('facilityNameLabel')}</label>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('facilityTypeLabel')}</label>
            <input
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('facilityFloorLabel')}</label>
            <input
              type="number"
              min={1}
              max={50}
              value={form.floorNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, floorNumber: Number(e.target.value) }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('facilityCapacityLabel')}</label>
            <input
              type="number"
              min={1}
              max={500}
              value={form.capacity}
              onChange={(e) => setForm((prev) => ({ ...prev, capacity: Number(e.target.value) }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleCreate}
            disabled={savingFacility || !form.name}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-gray-400"
          >
            {savingFacility ? t('saving') : t('facilityCreateButton')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">{t('facilityLoading')}</div>
      ) : facilities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">{t('facilityNoFacilities')}</div>
      ) : (
        <div className="space-y-4">
          {facilities.map((facility) => (
            <div key={facility.id} className="border border-gray-200 rounded-lg p-4">
              {editingFacility === facility.id ? (
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">{t('editFacility') || 'Edit Facility'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('facilityNameLabel')}</label>
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('facilityTypeLabel')}</label>
                      <input
                        value={editForm.type}
                        onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('facilityFloorLabel')}</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={editForm.floorNumber}
                        onChange={(e) => setEditForm(prev => ({ ...prev, floorNumber: Number(e.target.value) }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('facilityCapacityLabel')}</label>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={editForm.capacity}
                        onChange={(e) => setEditForm(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={() => handleUpdate(facility.id)}
                      disabled={updatingFacility[facility.id] || !editForm.name}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-gray-400"
                    >
                      {updatingFacility[facility.id] ? t('saving') : t('save')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">{facility.name}</h4>
                    <p className="text-xs text-gray-500">
                      {t('facilityTypeLabel')}: {facility.type || 'custom'} · {t('facilityFloorLabel')}:{' '}
                      {facility.floorNumber || '-'} · {t('facilityCapacityLabel')}: {facility.capacity || '-'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(facility)}
                      className="text-xs text-primary-600 hover:text-primary-800"
                    >
                      {t('edit') || 'Edit'}
                    </button>
                    <button
                      onClick={() => handleDelete(facility.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      {t('facilityDelete')}
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">{t('day')}</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">{t('facilityOpenTime')}</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">{t('facilityCloseTime')}</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">{t('facilityClosed')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(hoursState[facility.id] || ensureWeekHours([])).map((hours, index) => (
                      <tr key={index}>
                        <td className="px-2 py-2 font-medium text-gray-900">{DAYS[index]}</td>
                        <td className="px-2 py-2">
                          <input
                            type="time"
                            value={hours.openTime}
                            disabled={hours.isClosed}
                            onChange={(e) => updateHoursState(facility.id, index, 'openTime', e.target.value)}
                            className="w-28 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="time"
                            value={hours.closeTime}
                            disabled={hours.isClosed}
                            onChange={(e) => updateHoursState(facility.id, index, 'closeTime', e.target.value)}
                            className="w-28 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={hours.isClosed}
                            onChange={(e) => updateHoursState(facility.id, index, 'isClosed', e.target.checked)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => saveHours(facility.id)}
                  disabled={savingHours[facility.id]}
                  className="px-4 py-2 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-gray-400"
                >
                  {savingHours[facility.id] ? t('saving') : t('facilitySaveHours')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


function WorkingGroupsTab({ buildingId }: { buildingId: string }) {
  const { t } = useLanguage()
  const [workingGroups, setWorkingGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWorkingGroups()
  }, [buildingId])

  const fetchWorkingGroups = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/building/${buildingId}/working-groups`)
      if (response.ok) {
        const data = await response.json()
        setWorkingGroups(data.workingGroups || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to fetch working groups')
      }
    } catch (err) {
      console.error('Failed to fetch working groups:', err)
      setError(err instanceof Error ? err.message : 'Failed to load working groups')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t('loading') || 'Loading...'}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchWorkingGroups}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          {t('retry') || 'Retry'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">{t('communityWorkingGroups') || 'Working Groups'}</h3>
      </div>
      {workingGroups.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-4">No working groups found for this building.</p>
          <p className="text-sm text-gray-400">
            Working groups are automatically created when a building is created. If you don't see any groups, they may need to be initialized.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workingGroups.map((group) => (
            <div key={group.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900">{group.name}</h4>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  group.type === 'MANAGEMENT' 
                    ? 'bg-blue-100 text-blue-800'
                    : group.type === 'MAINTENANCE'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {group.type}
                </span>
              </div>
              {group.description && (
                <p className="text-sm text-gray-600 mt-1 mb-3">{group.description}</p>
              )}
              <div className="space-y-2">
                <div className="flex items-center text-xs text-gray-500">
                  <UserGroupIcon className="h-4 w-4 mr-1" />
                  <span>{group.stats.members} {t('members') || 'members'}</span>
                </div>
                {group.members && group.members.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-700 mb-2">Team Members:</p>
                    <div className="space-y-1">
                      {group.members.slice(0, 5).map((member: any) => (
                        <div key={member.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 truncate">
                            {member.userName || member.userEmail}
                          </span>
                          <span className={`px-1.5 py-0.5 text-xs rounded ${
                            member.role === 'LEADER'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {member.role}
                          </span>
                        </div>
                      ))}
                      {group.members.length > 5 && (
                        <p className="text-xs text-gray-400">+{group.members.length - 5} more</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

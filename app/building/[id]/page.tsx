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
  PlusIcon,
  EnvelopeIcon,
  CalendarIcon,
  WrenchScrewdriverIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline'
import MailboxManager from '@/components/building/MailboxManager'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useLanguage } from '@/components/LanguageProvider'

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
  const { data: session } = useSession()
  const { t } = useLanguage()
  const buildingId = params.id as string

  const [building, setBuilding] = useState<Building | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'households' | 'mailboxes'>('overview')

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
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: t('buildingOverview'), icon: BuildingOfficeIcon },
              { id: 'households', name: t('buildingHouseholds'), icon: HomeIcon },
              { id: 'mailboxes', name: t('buildingMailboxes'), icon: EnvelopeIcon },
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
          {activeTab === 'mailboxes' && <MailboxManager buildingId={buildingId} />}
        </div>
      </div>
    </div>
  )
}

function OverviewTab({ building, buildingId, onNavigateTab }: { building: Building; buildingId: string; onNavigateTab: (tab: 'overview' | 'households' | 'mailboxes') => void }) {
  const { t } = useLanguage()
  const [settingUp, setSettingUp] = useState(false)
  const [setupStatus, setSetupStatus] = useState<{
    floors: number
    households: number
    mailboxes: number
  } | null>(null)

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
  }, [building.floorCountActual, building.householdCount, building.mailboxCount, isSetup])

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
              {new Date(building.createdAt).toLocaleDateString('zh-CN')}
            </dd>
          </div>
          {building.invitationCode && (
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('buildingInvitationCode')}</dt>
              <dd className="mt-1">
                <div className="flex items-center space-x-2">
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
                <p className="mt-1 text-xs text-gray-500">
                  {t('buildingShareCode')}
                </p>
              </dd>
            </div>
          )}
        </dl>
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

function HouseholdsTab({ buildingId }: { buildingId: string }) {
  const { t } = useLanguage()
  const [floors, setFloors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return <div className="text-center py-8">{t('buildingLoading')}</div>
  }

  if (floors.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">{t('buildingHouseholds')}</h3>
        </div>
        <div className="text-center py-8 text-gray-500">{t('buildingNoHouseholds')}</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">{t('buildingHouseholds')}</h3>
      </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {floor.households.map((household: any) => (
                <div
                  key={household.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <Link
                        href={`/household/${household.id}`}
                        className="font-medium text-gray-900 hover:text-primary-600"
                      >
                        {household.name}
                      </Link>
                      {household.apartmentNo && (
                        <p className="text-xs text-gray-500 mt-1">{household.apartmentNo}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Stats with icons */}
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

                  {/* Action buttons with icons */}
                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-gray-100">
                    <Link
                      href={`/household/${household.id}/reservation`}
                      className="flex flex-col items-center p-2 text-xs text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title={t('householdReservation')}
                    >
                      <CalendarIcon className="h-4 w-4 mb-1" />
                      <span className="hidden sm:inline">{t('householdReservation')}</span>
                    </Link>
                    <Link
                      href={`/household/${household.id}/maintenance`}
                      className="flex flex-col items-center p-2 text-xs text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title={t('householdMaintenance')}
                    >
                      <WrenchScrewdriverIcon className="h-4 w-4 mb-1" />
                      <span className="hidden sm:inline">{t('householdMaintenance')}</span>
                    </Link>
                    <div className="relative group">
                      <button
                        className="flex flex-col items-center p-2 text-xs text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors w-full"
                        title={t('householdProperty')}
                      >
                        <BuildingStorefrontIcon className="h-4 w-4 mb-1" />
                        <span className="hidden sm:inline">{t('householdProperty')}</span>
                      </button>
                      <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all min-w-[120px]">
                        <Link
                          href={`/household/${household.id}/property/mail`}
                          className="flex items-center px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded"
                        >
                          <EnvelopeIcon className="h-4 w-4 mr-2" />
                          {t('householdMail')}
                        </Link>
                        <Link
                          href={`/household/${household.id}/property/package`}
                          className="flex items-center px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded"
                        >
                          <CubeIcon className="h-4 w-4 mr-2" />
                          {t('householdPackage')}
                        </Link>
                        <Link
                          href={`/household/${household.id}/property/visitor`}
                          className="flex items-center px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded"
                        >
                          <IdentificationIcon className="h-4 w-4 mr-2" />
                          {t('householdVisitorTag')}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


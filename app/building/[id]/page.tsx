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
  IdentificationIcon,
  CogIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import MailboxManager from '@/components/building/MailboxManager'
import QRCodeDisplay from '@/components/QRCode'
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
  const { currentLanguage, setLanguage, t } = useLanguage()
  const buildingId = params.id as string

  const [building, setBuilding] = useState<Building | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'households' | 'mailboxes' | 'frontdoor' | 'facilities'>('overview')

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
              { id: 'facilities', name: t('buildingFacilities'), icon: CogIcon },
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
          {activeTab === 'facilities' && <FacilitiesTab buildingId={buildingId} />}
        </div>
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

function HouseholdCard({ household }: { household: any }) {
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
    <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 w-72 flex-shrink-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/household/${household.id}`}
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
              onClick={() => copyToClipboard(household.id, 'id')}
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
                  onClick={() => copyToClipboard(household.invitationCode, 'code')}
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

      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-gray-100 text-xs">
        <Link
          href={`/household/${household.id}/reservation`}
          className="flex flex-col items-center p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
          title={t('householdReservation')}
        >
          <CalendarIcon className="h-4 w-4 mb-1" />
          <span className="hidden sm:inline">{t('householdReservation')}</span>
        </Link>
        <Link
          href={`/household/${household.id}/maintenance`}
          className="flex flex-col items-center p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
          title={t('householdMaintenance')}
        >
          <WrenchScrewdriverIcon className="h-4 w-4 mb-1" />
          <span className="hidden sm:inline">{t('householdMaintenance')}</span>
        </Link>
        <div className="relative group">
          <button
            className="flex flex-col items-center p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors w-full"
            title={t('householdProperty')}
          >
            <BuildingStorefrontIcon className="h-4 w-4 mb-1" />
            <span className="hidden sm:inline">{t('householdProperty')}</span>
          </button>
          <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all min-w-[140px]">
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
  )
}

function HouseholdsTab({ buildingId }: { buildingId: string }) {
  const { t } = useLanguage()
  const [floors, setFloors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

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
                    <HouseholdCard key={household.id} household={household} />
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

  return (
    <div className="space-y-6">
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
                    <div>
                      <p className="text-sm font-medium text-gray-900">{bell.doorBellNumber}</p>
                      <p className="text-xs text-gray-500">{bell.household?.name || t('householdProperty')}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDoorBellToggle(bell.id, !bell.isEnabled)}
                        className="px-3 py-1 text-xs font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        {bell.isEnabled ? t('frontDoorDisable') : t('frontDoorEnable')}
                      </button>
                      <button
                        onClick={() => handleRingDoorBell(bell.id)}
                        className="px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
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
  const [hoursState, setHoursState] = useState<Record<string, any[]>>({})
  const [savingFacility, setSavingFacility] = useState(false)
  const [savingHours, setSavingHours] = useState<Record<string, boolean>>({})

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
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <div>
                  <h4 className="text-base font-semibold text-gray-900">{facility.name}</h4>
                  <p className="text-xs text-gray-500">
                    {t('facilityTypeLabel')}: {facility.type || 'custom'} · {t('facilityFloorLabel')}:{' '}
                    {facility.floorNumber || '-'}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(facility.id)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  {t('facilityDelete')}
                </button>
              </div>

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


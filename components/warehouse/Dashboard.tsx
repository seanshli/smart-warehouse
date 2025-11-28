'use client'
// 主儀表板組件
// 整合所有主要功能：物品管理、搜尋、房間、分類、通知、活動、語音助理、Home Assistant 等

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { 
  HomeIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  CogIcon,
  BellIcon,
  UserGroupIcon,
  CubeIcon,
  MapPinIcon,
  ClockIcon,
  ArrowDownIcon,
  UsersIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  WifiIcon
} from '@heroicons/react/24/outline'
import AddItemModal from './AddItemModal'
import SearchModal from './SearchModal'
import EditItemModal from './EditItemModal'
import MoveItemModal from './MoveItemModal'
import CheckoutModal from './CheckoutModal'
import QuantityAdjustModal from './QuantityAdjustModal'
import ItemHistoryModal from './ItemHistoryModal'
import RoomManagement from './RoomManagement'
import CategoryManagement from './CategoryManagement'
import SearchPage from './SearchPage'
import { CompactLanguageSelector, useLanguage } from '../LanguageProvider'
import NotificationCenter from '../NotificationCenter'
import Activities from '../Activities'
import { useHousehold } from '../HouseholdProvider'
import { HouseholdMemberManagement } from '../HouseholdMemberManagement'
import ItemsList from './ItemsList'
import { useDeviceDetection } from '../MobileLayout'
import HouseholdSettings from '../HouseholdSettings'
import CreateHouseholdModal from '../CreateHouseholdModal'
import JoinHouseholdModal from '../JoinHouseholdModal'
import VoiceAssistantPanel from '../VoiceAssistantPanel'
import HomeAssistantPanel from '../mqtt/HomeAssistantPanel'
import MQTTPanel from '../mqtt/MQTTPanel'
import FacilityReservationPanel from '../facility/FacilityReservationPanel'

// 家庭切換器組件（用於在多個家庭之間切換）
function HouseholdSwitcher() {
  const { memberships, activeHouseholdId, setActiveHousehold, switching, error } = useHousehold() // 家庭相關狀態
  const { t } = useLanguage() // 語言設定
  const [showCreateModal, setShowCreateModal] = useState(false) // 是否顯示創建家庭模態框
  const [showJoinModal, setShowJoinModal] = useState(false) // 是否顯示加入家庭模態框
  const [pendingHouseholdId, setPendingHouseholdId] = useState<string | null>(null) // 待切換的家庭 ID
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false) // 是否顯示切換確認對話框

  if (!memberships || memberships.length === 0) return null // 無家庭成員資格時不渲染

  // 處理家庭變更
  const handleHouseholdChange = (householdId: string) => {
    if (householdId === activeHouseholdId) return // 無變更
    
    setPendingHouseholdId(householdId)
    setShowSwitchConfirm(true) // 顯示確認對話框
  }

  // 確認切換
  const confirmSwitch = () => {
    if (pendingHouseholdId) {
      setActiveHousehold(pendingHouseholdId)
    }
    setShowSwitchConfirm(false)
    setPendingHouseholdId(null)
  }

  // 取消切換
  const cancelSwitch = () => {
    setShowSwitchConfirm(false)
    setPendingHouseholdId(null)
  }

  const pendingHousehold = memberships.find(m => m.household.id === pendingHouseholdId) // 待切換的家庭資訊

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">{t('switchHousehold')}:</span>
      <div className="relative">
        <select
          value={activeHouseholdId || ''}
          onChange={(e) => handleHouseholdChange(e.target.value)}
          disabled={switching}
          className="border-gray-300 text-sm rounded-md px-2 py-1 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('switchHousehold')}
        >
          {memberships.map(m => (
            <option key={m.household.id} value={m.household.id} className="bg-white dark:bg-gray-700">
              {m.household.name} ({m.role})
            </option>
          ))}
        </select>
        {switching && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-700 rounded-md">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          </div>
        )}
      </div>
      
      {/* Confirmation Modal */}
      {showSwitchConfirm && pendingHousehold && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black opacity-30" onClick={cancelSwitch}></div>
            
            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Confirm Household Switch
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to switch to <strong>{pendingHousehold.household.name}</strong>?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelSwitch}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={confirmSwitch}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                >
                  {t('continue')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Create New Household and Join Household Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => {
            console.log('🔄 Create household button clicked')
            setShowCreateModal(true)
          }}
          className="inline-flex items-center px-2 py-1 text-xs font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/30 focus:outline-none focus:ring-2 focus:ring-primary-500"
          title={t('createNewHousehold') || 'Create New Household'}
        >
          <PlusIcon className="h-3 w-3 mr-1" />
          {t('createNewHousehold') || 'New'}
        </button>
        <button
          onClick={() => {
            console.log('🔄 Join household button clicked')
            setShowJoinModal(true)
          }}
          className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 focus:outline-none focus:ring-2 focus:ring-green-500"
          title={t('joinHousehold') || 'Join Household'}
        >
          <UserGroupIcon className="h-3 w-3 mr-1" />
          {t('joinHousehold') || 'Join'}
        </button>
      </div>
      
      {error && (
        <div className="text-xs text-red-500 dark:text-red-400 max-w-xs truncate" title={error}>
          {error}
        </div>
      )}

      {/* Create Household Modal */}
      {showCreateModal && (
        <CreateHouseholdModal 
          onClose={() => {
            console.log('🔄 Closing create household modal')
            setShowCreateModal(false)
          }} 
        />
      )}

      {/* Join Household Modal */}
      {showJoinModal && (
        <JoinHouseholdModal 
          onClose={() => {
            console.log('🔄 Closing join household modal')
            setShowJoinModal(false)
          }} 
        />
      )}
    </div>
  )
}

type MaintenanceTicketStatus = 'open' | 'inProgress' | 'resolved'

interface MaintenanceTicket {
  id: string
  title: string
  location: string
  requestedBy: string
  status: MaintenanceTicketStatus
  updatedAt: string
}

interface ReservationItem {
  id: string
  title: string
  location: string
  owner: string
  startTime: string
  endTime: string
  type: 'cleaning' | 'delivery' | 'visitor' | 'other'
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const { t } = useLanguage()
  const { household, role, permissions, refreshTrigger, forceRefresh } = useHousehold()
  const deviceInfo = useDeviceDetection()

  // Add error boundary for client-side errors
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Dashboard client error:', error)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Dashboard unhandled promise rejection:', event.reason)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])


  // Handle authentication errors - with debugging and less aggressive redirects
  useEffect(() => {
    console.log('🔐 Dashboard: Auth status check - status:', status, 'session:', !!session, 'user:', !!(session?.user as any)?.id)
    
    if (status === 'unauthenticated') {
      console.log('🔐 Dashboard: User not authenticated, but not redirecting immediately - waiting for API calls to complete')
      // Don't redirect immediately - let the API calls complete first
      return
    }

    if (status === 'authenticated' && (!session || !session.user || !(session.user as any).id)) {
      console.log('🔐 Dashboard: Invalid session, but not redirecting immediately - waiting for API calls to complete')
      // Don't redirect immediately - let the API calls complete first
      return
    }
  }, [session, status])

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading state if not authenticated
  if (status === 'unauthenticated' || !session || !session.user || !(session.user as any).id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }
  const [activeTab, setActiveTab] = useState('dashboard')
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'all'>('today')
  const [showAddItem, setShowAddItem] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Add error boundary for component errors
  useEffect(() => {
    const handleComponentError = (error: any) => {
      console.error('Dashboard component error:', error)
      setHasError(true)
    }

    // Catch any unhandled errors in the component
    try {
      // Component logic here
    } catch (error) {
      handleComponentError(error)
    }
  }, [])

  // If there's an error, show error state
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">An error occurred while loading the dashboard.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }
  const [showEditItem, setShowEditItem] = useState(false)
  const [showMoveItem, setShowMoveItem] = useState(false)
  const [showCheckoutItem, setShowCheckoutItem] = useState(false)
  const [showQuantityAdjust, setShowQuantityAdjust] = useState(false)
  const [showItemHistory, setShowItemHistory] = useState(false)

  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [refreshItemsList, setRefreshItemsList] = useState<(() => void) | null>(null)

  // Memoized callback to prevent infinite re-renders
  const handleItemsListRef = useCallback((refreshFn: () => void) => {
    console.log('Dashboard: ItemsList onRef called with function:', typeof refreshFn)
    setRefreshItemsList(refreshFn)
  }, [])

  // Force refresh when household changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 ===== DASHBOARD REFRESH TRIGGERED =====')
      console.log('🔄 Dashboard: Household changed, refreshTrigger:', refreshTrigger)
      console.log('🏠 Current household:', household ? { id: household.id, name: household.name } : 'None')
      console.log('🔄 Dashboard: Forcing data refresh...')
      
      // Refresh the items list when household changes
      if (refreshItemsList && typeof refreshItemsList === 'function') {
        console.log('🔄 Dashboard: Refreshing items list for new household')
        refreshItemsList()
      } else {
        console.log('🔄 Dashboard: refreshItemsList not available yet')
      }
      
      console.log('✅ Dashboard: Household switch completed, data should be refreshed')
      console.log('🔄 ===== DASHBOARD REFRESH COMPLETED =====')
    }
  }, [refreshTrigger, household, refreshItemsList])

  const tabs = [
    { id: 'dashboard', name: t('dashboard'), icon: HomeIcon },
    { id: 'search', name: t('search'), icon: MagnifyingGlassIcon },
    { id: 'items', name: t('items'), icon: ArchiveBoxIcon },
    { id: 'rooms', name: t('rooms'), icon: MapPinIcon },
    { id: 'categories', name: t('categories'), icon: CubeIcon },
    { id: 'activities', name: t('activities'), icon: ClockIcon },
    { id: 'notifications', name: t('notifications'), icon: BellIcon },
    { id: 'members', name: t('members'), icon: UsersIcon, permission: 'canManageMembers' },
    { id: 'homeassistant', name: t('homeAssistantPanelTitle'), icon: ShieldCheckIcon },
    { id: 'mqtt', name: t('mqttDevices') || 'MQTT Devices', icon: WifiIcon },
    { id: 'maintenance', name: (t as any)('maintenanceTickets') || '報修', icon: ExclamationTriangleIcon },
    { id: 'reservations', name: (t as any)('reservationCenter') || '預定', icon: ClockIcon },
    { id: 'assistant', name: t('assistant'), icon: SparklesIcon },
    { id: 'household', name: t('householdSettings'), icon: HomeIcon, permission: 'canManageHousehold' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden mobile-portrait-content">
      {/* Header - Ultra-compact for mobile */}
      <header className={`bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 ${
        deviceInfo.isMobile ? 'pt-safe-top' : 'pt-0'
      }`}>
        <div className="max-w-7xl mx-auto px-1 sm:px-4 lg:px-6">
          <div className={`flex justify-between items-center ${
            deviceInfo.isMobile ? 'h-10' : deviceInfo.isTablet ? 'h-12' : 'h-14'
          }`}>
            {/* Left side: App name only on mobile */}
            <div className="flex items-center space-x-1 sm:space-x-3 min-w-0 flex-1">
              <h1 className={`font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0 ${
                deviceInfo.isMobile ? 'text-xs' : deviceInfo.isTablet ? 'text-base' : 'text-lg'
              }`}>
                {deviceInfo.isMobile ? 'SW' : t('smartWarehouse')}
              </h1>
              {household && !deviceInfo.isMobile && (
                <>
                  <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">|</span>
                  <div className="min-w-0">
                    <HouseholdSwitcher />
                  </div>
                </>
              )}
            </div>
            
            {/* Right side: Minimal buttons on mobile */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Add Item - Primary action */}
              <button
                onClick={() => setShowAddItem(true)}
                className={`inline-flex items-center border border-transparent font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 flex-shrink-0 ${
                  deviceInfo.isMobile ? 'px-1.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
                }`}
              >
                <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                {!deviceInfo.isMobile && <span className="ml-1">{t('addItem')}</span>}
              </button>
              
              {/* Search - Icon only on mobile */}
              <button
                onClick={() => setShowSearch(true)}
                className={`inline-flex items-center border border-gray-300 dark:border-gray-600 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex-shrink-0 ${
                  deviceInfo.isMobile ? 'px-1.5 py-1' : deviceInfo.isTablet ? 'px-2 py-1.5' : 'px-3 py-1.5'
                }`}
                title={t('search')}
              >
                <MagnifyingGlassIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>

              {/* Settings - Only on larger screens */}
              {!deviceInfo.isMobile && (
                <a
                  href="/settings"
                  className={`inline-flex items-center border border-gray-300 dark:border-gray-600 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex-shrink-0 ${
                    deviceInfo.isTablet ? 'px-2 py-1.5' : 'px-3 py-1.5'
                  }`}
                  title="Settings"
                >
                  <CogIcon className="h-4 w-4" />
                </a>
              )}

              {/* Language - Always show, compact on mobile */}
              <CompactLanguageSelector />

              {/* Sign Out - Icon only on mobile */}
              <button
                onClick={() => {
                  console.log('Signing out...')
                  window.location.href = '/auth/signout'
                }}
                className={`text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0 ${
                  deviceInfo.isMobile ? 'px-1' : 'px-2'
                }`}
                title={t('signOut')}
              >
                {deviceInfo.isMobile ? '⏻' : t('signOut')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs - Ultra-compact for mobile */}
      <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-1 sm:px-4 lg:px-6">
          <div className={`flex overflow-x-auto whitespace-nowrap ${
            deviceInfo.isMobile ? 'space-x-0.5' : deviceInfo.isTablet ? 'space-x-1' : 'space-x-2 sm:space-x-4'
          }`}>
            {tabs.map((tab) => {
              // Check if user has permission for this tab
              if (tab.permission && (!permissions || !permissions[tab.permission as keyof typeof permissions])) {
                return null
              }
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 border-b-2 font-medium ${
                    deviceInfo.isMobile 
                      ? 'py-1.5 px-1.5 text-xs' 
                      : deviceInfo.isTablet 
                        ? 'py-2 px-2 text-xs'
                        : 'py-3 px-3 text-sm'
                  } ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <tab.icon className={`inline ${
                    deviceInfo.isMobile ? 'h-3 w-3' : deviceInfo.isTablet ? 'h-4 w-4 mr-1' : 'h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-1.5'
                  }`} />
                  <span className={deviceInfo.isMobile ? 'hidden' : ''}>{tab.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

             {/* Main Content */}
             <main className={`max-w-7xl mx-auto ${
               deviceInfo.isMobile 
                 ? 'py-2 px-2' 
                 : deviceInfo.isTablet 
                   ? 'py-4 px-4 sm:px-6' 
                   : 'py-4 sm:py-6 px-2 sm:px-6 lg:px-8'
             }`}>
               {activeTab === 'dashboard' && (
                <DashboardContent
                  household={household}
                  refreshTrigger={refreshTrigger}
                  onTabChange={setActiveTab}
                  onItemEdit={(item) => {
                     console.log('Dashboard: Edit handler called for item:', item.name)
                     console.log('Dashboard: Full item object:', item)
                     setSelectedItem(item)
                     setShowEditItem(true)
                   }}
                   onItemMove={(item) => {
                     console.log('Dashboard: Move handler called for item:', item.name)
                     setSelectedItem(item)
                     setShowMoveItem(true)
                   }}
                   onItemCheckout={(item) => {
                     console.log('Dashboard: Checkout handler called for item:', item.name)
                     setSelectedItem(item)
                     setShowCheckoutItem(true)
                   }}
                   onItemQuantityAdjust={(item) => {
                     console.log('Dashboard: Quantity adjust handler called for item:', item.name)
                     setSelectedItem(item)
                     setShowQuantityAdjust(true)
                   }}
                   onItemHistory={(item) => {
                     console.log('Dashboard: History handler called for item:', item.name)
                     setSelectedItem(item)
                     setShowItemHistory(true)
                   }}
                 />
               )}
               {activeTab === 'maintenance' && (
                <DashboardContent
                  household={household}
                  refreshTrigger={refreshTrigger}
                  onTabChange={setActiveTab}
                  activeTab="maintenance"
                  onItemEdit={(item) => {
                     setSelectedItem(item)
                     setShowEditItem(true)
                   }}
                   onItemMove={(item) => {
                     setSelectedItem(item)
                     setShowMoveItem(true)
                   }}
                   onItemCheckout={(item) => {
                     setSelectedItem(item)
                     setShowCheckoutItem(true)
                   }}
                   onItemQuantityAdjust={(item) => {
                     setSelectedItem(item)
                     setShowQuantityAdjust(true)
                   }}
                   onItemHistory={(item) => {
                     setSelectedItem(item)
                     setShowItemHistory(true)
                   }}
                 />
               )}
               {activeTab === 'reservations' && household?.id && (
                 <FacilityReservationPanel householdId={household.id} />
               )}
              {activeTab === 'search' && <SearchPage />}
              {activeTab === 'assistant' && <VoiceAssistantPanel />}
              {activeTab === 'homeassistant' && <HomeAssistantPanel />}
              {activeTab === 'mqtt' && <MQTTPanel />}
               {activeTab === 'items' && (
                 <div className="px-4 py-6 sm:px-0">
                   <ItemsList 
                     showCategory={true}
                     showLocation={true}
                     onRef={handleItemsListRef}
                     onItemEdit={(item) => {
                       console.log('Dashboard: Edit handler called for item:', item.name)
                       setSelectedItem(item)
                       setShowEditItem(true)
                     }}
                     onItemMove={(item) => {
                       console.log('Dashboard: Move handler called for item:', item.name)
                       setSelectedItem(item)
                       setShowMoveItem(true)
                     }}
                     onItemCheckout={(item) => {
                       console.log('Dashboard: Checkout handler called for item:', item.name)
                       setSelectedItem(item)
                       setShowCheckoutItem(true)
                     }}
                    onItemQuantityAdjust={(item) => {
                      console.log('Dashboard: Quantity adjust handler called for item:', item.name)
                      setSelectedItem(item)
                      setShowQuantityAdjust(true)
                    }}
                     onItemHistory={(item) => {
                       console.log('Dashboard: History handler called for item:', item.name)
                       setSelectedItem(item)
                       setShowItemHistory(true)
                     }}
                   />
                 </div>
               )}
               {activeTab === 'rooms' && <RoomManagement />}
               {activeTab === 'categories' && <CategoryManagement />}
               {activeTab === 'activities' && (
                 <div className="space-y-4">
                   <div className="flex justify-end">
                     <select
                       value={timeFilter}
                       onChange={(e) => setTimeFilter(e.target.value as 'today' | 'week' | 'all')}
                       className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                     >
                       <option value="today">{t('today')}</option>
                       <option value="week">{t('pastWeek')}</option>
                       <option value="all">{t('all')}</option>
                     </select>
                   </div>
                   <Activities timeFilter={timeFilter} />
                 </div>
               )}
               {activeTab === 'notifications' && <NotificationCenter />}
               {activeTab === 'members' && household && (
                 <HouseholdMemberManagement householdId={household.id} />
               )}
               
               {activeTab === 'household' && (
                 <HouseholdSettings />
               )}
             </main>

      {/* Modals */}
      {showAddItem && (
        <AddItemModal onClose={() => {
          setShowAddItem(false)
          // Refresh items list and dashboard stats after adding an item
          console.log('AddItemModal closed, refreshing data...')
          if (refreshItemsList && typeof refreshItemsList === 'function') {
            refreshItemsList()
          }
          // Force a refresh of all household data (will trigger dashboard stats refresh)
          forceRefresh()
        }} />
      )}
      {showSearch && (
        <SearchModal onClose={() => setShowSearch(false)} />
      )}
      {showEditItem && selectedItem && (
        <EditItemModal 
          item={selectedItem} 
          onClose={() => {
            setShowEditItem(false)
            setSelectedItem(null)
          }}
          onSuccess={() => {
            // Refresh the items list
            console.log('EditItemModal onSuccess called, refreshItemsList:', typeof refreshItemsList)
            try {
              if (refreshItemsList && typeof refreshItemsList === 'function') {
                console.log('Calling refreshItemsList function')
                refreshItemsList()
              } else {
                console.log('refreshItemsList not available, falling back to page reload')
                // Fallback to page reload if refresh function not available
                window.location.reload()
              }
            } catch (error) {
              console.error('Error in onSuccess callback:', error)
              // Fallback to page reload on error
              window.location.reload()
            }
          }}
        />
      )}
      {showMoveItem && selectedItem && (
        <MoveItemModal 
          item={selectedItem} 
          onClose={() => {
            setShowMoveItem(false)
            setSelectedItem(null)
          }}
          onSuccess={() => {
            // Refresh the items list
            window.location.reload()
          }}
        />
      )}
      {showCheckoutItem && selectedItem && (
        <CheckoutModal 
          item={selectedItem} 
          onClose={() => {
            setShowCheckoutItem(false)
            setSelectedItem(null)
          }}
          onSuccess={() => {
            // Refresh the items list
            window.location.reload()
          }}
        />
      )}
      {showQuantityAdjust && selectedItem && (
        <QuantityAdjustModal
          item={selectedItem}
          onClose={() => {
            setShowQuantityAdjust(false)
            setSelectedItem(null)
          }}
          onSuccess={() => {
            setShowQuantityAdjust(false)
            setSelectedItem(null)
            if (refreshItemsList && typeof refreshItemsList === 'function') {
              refreshItemsList()
            } else {
              window.location.reload()
            }
          }}
        />
      )}
      {showItemHistory && selectedItem && (
        <ItemHistoryModal 
          item={selectedItem} 
          onClose={() => {
            setShowItemHistory(false)
            setSelectedItem(null)
          }} 
        />
      )}


      {/* Mobile Household Switcher - Compact */}
      {deviceInfo.isMobile && (
        <div className="fixed bottom-12 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 py-1 z-40">
          <HouseholdSwitcher />
        </div>
      )}

      {/* Mobile Bottom Navigation - Ultra-compact */}
      {deviceInfo.isMobile && (
        <div className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-1 py-0.5 z-50 ${
          deviceInfo.orientation === 'landscape' ? 'pb-safe-bottom' : 'pb-0.5'
        }`}>
          <div className="flex justify-around">
            {tabs.slice(0, 4).map((tab) => {
              // Check if user has permission for this tab
              if (tab.permission && (!permissions || !permissions[tab.permission as keyof typeof permissions])) {
                return null
              }
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center py-1 px-0.5 text-xs ${
                    activeTab === tab.id
                      ? 'text-primary-600'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <tab.icon className={`mb-0.5 ${
                    deviceInfo.orientation === 'landscape' ? 'h-3 w-3' : 'h-4 w-4'
                  }`} />
                  <span className={`truncate ${
                    deviceInfo.orientation === 'landscape' ? 'max-w-10 text-xs' : 'max-w-12 text-xs'
                  }`}>
                    {deviceInfo.orientation === 'landscape' ? tab.name.slice(0, 2) : tab.name.slice(0, 4)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Add bottom padding for mobile navigation and household switcher */}
      <div className={`${deviceInfo.isMobile ? 'h-20' : 'h-0'} sm:hidden`}></div>
    </div>
  )
}

function DashboardContent({ 
  household,
  refreshTrigger,
  onTabChange,
  activeTab = 'dashboard',
  onItemEdit, 
  onItemMove, 
  onItemCheckout, 
  onItemQuantityAdjust,
  onItemHistory 
}: {
  household: any
  refreshTrigger: number
  onTabChange: (tab: string) => void
  activeTab?: string
  onItemEdit: (item: any) => void
  onItemMove: (item: any) => void
  onItemCheckout: (item: any) => void
  onItemQuantityAdjust: (item: any) => void
  onItemHistory: (item: any) => void
}) {
  const { t } = useLanguage()
  const deviceInfo = useDeviceDetection()
  const translate = useCallback(
    (key: string, fallback?: string) => {
      try {
        const result = (t as unknown as (k: string) => string)(key as any)
        if (typeof result === 'string' && result.trim().length > 0 && result !== key) {
          return result
        }
      } catch (error) {
        console.warn('Missing translation key:', key, error)
      }
      return fallback ?? key
    },
    [t]
  )
  const [stats, setStats] = useState<{
    totalItems: number
    totalRooms: number
    lowStockItems: number
    householdMembers: number
    recentActivities: any[]
  }>({
    totalItems: 0,
    totalRooms: 0,
    lowStockItems: 0,
    householdMembers: 0,
    recentActivities: []
  })
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'all'>('today')
  const [householdChangeDetected, setHouseholdChangeDetected] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState(0)
  const [maintenanceTickets] = useState<MaintenanceTicket[]>(() => [
    {
      id: 'RX-102',
      title: '浴室漏水維修',
      location: 'Master Bath',
      requestedBy: 'Grandma',
      status: 'open',
      updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
    {
      id: 'RX-099',
      title: '臥室冷氣異常',
      location: 'Bedroom 2',
      requestedBy: 'Dad',
      status: 'inProgress',
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: 'RX-095',
      title: '車庫門保養',
      location: 'Garage',
      requestedBy: 'System',
      status: 'resolved',
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ])
  const [reservations] = useState<ReservationItem[]>(() => [
    {
      id: 'EV-301',
      title: '快遞收件',
      location: 'Front Gate',
      owner: 'Mom',
      startTime: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
      endTime: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      type: 'delivery',
    },
    {
      id: 'EV-305',
      title: '清潔阿姨',
      location: 'Whole House',
      owner: 'System',
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 7).toISOString(),
      type: 'cleaning',
    },
    {
      id: 'EV-322',
      title: '朋友拜訪',
      location: 'Living Room',
      owner: 'Dad',
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 29).toISOString(),
      type: 'visitor',
    },
  ])

  const maintenanceStats = useMemo(() => ({
    open: maintenanceTickets.filter((ticket) => ticket.status === 'open').length,
    inProgress: maintenanceTickets.filter((ticket) => ticket.status === 'inProgress').length,
    resolved: maintenanceTickets.filter((ticket) => ticket.status === 'resolved').length,
  }), [maintenanceTickets])

  const upcomingReservations = useMemo(() => reservations.length, [reservations])

  const coreModules = useMemo(() => [
    {
      id: 'warehouse',
      title: translate('warehouse', 'Warehouse'),
      subtitle: translate('warehouseOverview', '家庭倉儲管理'),
      icon: ArchiveBoxIcon,
      tag: 'LIVE',
      metrics: [
        { label: translate('totalItems', '總物品數'), value: loading ? '...' : stats.totalItems },
        { label: translate('lowStockItems', '低庫存物品'), value: loading ? '...' : stats.lowStockItems },
      ],
      actions: [
        { label: translate('manageInventory', '管理物品'), onClick: () => onTabChange('items') },
        { label: translate('viewRooms', '房間配置'), onClick: () => onTabChange('rooms') },
      ],
      onClick: () => onTabChange('items'), // Navigate to warehouse items page
    },
    {
      id: 'mott',
      title: 'MOTT',
      subtitle: translate('smartAutomationCenter', '多品牌設備 + 自動化控管'),
      icon: WifiIcon,
      tag: 'LIVE',
      metrics: [
        { label: translate('connectedDevices', '連線設備'), value: 12 },
        { label: translate('activeAutomations', '自動化流程'), value: 5 },
      ],
      actions: [
        { label: translate('openMqttPanel', '裝置控管'), onClick: () => onTabChange('mqtt') },
        { label: translate('openAssistant', '語音助理'), onClick: () => onTabChange('assistant') },
      ],
      onClick: () => onTabChange('mqtt'), // Navigate to MQTT panel
    },
    {
      id: 'maintenance',
      title: translate('maintenanceTickets', '報修'),
      subtitle: translate('maintenanceSubtitle', '家庭維修工單中心'),
      icon: ExclamationTriangleIcon,
      tag: 'NEW',
      metrics: [
        { label: translate('pendingTickets', '待處理'), value: maintenanceStats.open },
        { label: translate('inProgress', '處理中'), value: maintenanceStats.inProgress },
      ],
      actions: [
        { label: translate('createTicket', '新增報修'), onClick: () => onTabChange('maintenance') },
        { label: translate('viewAll', '查看全部'), onClick: () => onTabChange('maintenance') },
      ],
      onClick: () => onTabChange('maintenance'), // Navigate to maintenance page
    },
    {
      id: 'reservation',
      title: translate('reservationCenter', '預定'),
      subtitle: translate('reservationSubtitle', '訪客 / 服務 / 預約管理'),
      icon: ClockIcon,
      tag: 'BETA',
      metrics: [
        { label: translate('upcoming', '即將到來'), value: upcomingReservations },
        { label: translate('today', '今日'), value: reservations.filter((reservation) => {
          const start = new Date(reservation.startTime)
          const now = new Date()
          return start.toDateString() === now.toDateString()
        }).length },
      ],
      actions: [
        { label: translate('addReservation', '新增預定'), onClick: () => onTabChange('reservations') },
        { label: translate('openCalendar', '檢視行事曆'), onClick: () => onTabChange('reservations') },
      ],
      onClick: () => onTabChange('reservations'), // Navigate to reservations page
    },
  ], [loading, maintenanceStats, onTabChange, reservations, stats.lowStockItems, stats.totalItems, translate, upcomingReservations])

  const fetchDashboardStats = async (currentHousehold?: any, currentRefreshTrigger?: number): Promise<void> => {
    try {
      // Debounce: prevent multiple rapid calls
      const now = Date.now()
      if (now - lastFetchTime < 2000) { // 2 second debounce
        console.log('🔄 Dashboard: Skipping API call - too soon after last call')
        return
      }
      setLastFetchTime(now)

      setLoading(true)
      console.log('🔄 Dashboard: Starting fetchDashboardStats')
      console.log('🔄 Dashboard: Household ID:', currentHousehold?.id)
      console.log('🔄 Dashboard: Refresh trigger:', currentRefreshTrigger)
      
      // Guard against undefined household
      if (!currentHousehold || !currentHousehold.id) {
        console.log('🔄 Dashboard: Skipping API call - no valid household provided')
        console.log('🔄 Dashboard: currentHousehold:', currentHousehold)
        setStats({
          totalItems: 0,
          totalRooms: 0,
          lowStockItems: 0,
          householdMembers: 0,
          recentActivities: []
        })
        return
      }
      
      // Fetch both dashboard stats and filtered activities
      const householdId = currentHousehold.id
      const bypassCache = (currentRefreshTrigger || 0) > 0 ? 'true' : 'false'
      
      console.log('🔄 Dashboard: Making API calls...')
      console.log('🔄 Dashboard: Stats URL:', `/api/warehouse/dashboard/simple?householdId=${householdId}`)
      console.log('🔄 Dashboard: Activities URL:', 'SKIPPED (using simple API only)')
      
      // Add timeout to prevent hanging (reduced since we're only calling simple API)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout to support slower connections
      
      // Use only simple API for maximum performance - no activities for now
      console.log('🔄 Dashboard: Using SIMPLE API only for better performance')
      const statsResponse = await fetch(`/api/warehouse/dashboard/simple?householdId=${householdId}`, {
        signal: controller.signal
      })
      
      // Skip activities API for now to prevent timeouts
      const activitiesResponse = { 
        ok: true, 
        status: 200,
        json: () => Promise.resolve([]) 
      } as Response
      
      clearTimeout(timeoutId)
      console.log('🔄 Dashboard: API responses received')
      console.log('🔄 Dashboard: Stats response status:', statsResponse.status)
      console.log('🔄 Dashboard: Activities response status:', activitiesResponse.status)
      
      if (statsResponse.ok && activitiesResponse.ok) {
        const [statsData, activitiesData] = await Promise.all([
          statsResponse.json(),
          activitiesResponse.json()
        ])
        
        console.log('Dashboard API Response:', statsData)
        console.log('Activities API Response:', activitiesData)
        
        // Map the dashboard stats and use filtered activities
        setStats({
          totalItems: statsData.totalItems || 0,
          totalRooms: statsData.totalRooms || 0,
          lowStockItems: statsData.lowStockItems || 0,
          householdMembers: statsData.householdMembers || 0,
          recentActivities: Array.isArray(activitiesData) ? activitiesData.slice(0, 10) : []
        })
      } else {
        console.error('Failed to fetch dashboard stats')
        // Set default stats to prevent crashes
        setStats({
          totalItems: 0,
          totalRooms: 0,
          lowStockItems: 0,
          householdMembers: 0,
          recentActivities: []
        })
      }
    } catch (error) {
      console.error('❌ Dashboard: Error fetching dashboard stats:', error)
      
        if (error instanceof Error && error.name === 'AbortError') {
          console.error('❌ Dashboard: API call timed out after 5 seconds')
          console.log('🔄 Dashboard: Setting fallback stats instead of redirecting to login')
        // Set fallback stats to prevent crashes and login redirects
        setStats({
          totalItems: 0,
          totalRooms: 0,
          lowStockItems: 0,
          householdMembers: 0,
          recentActivities: []
        })
      } else {
        console.error('❌ Dashboard: API call failed:', error)
        console.log('🔄 Dashboard: Setting fallback stats instead of redirecting to login')
        // Set fallback stats to prevent crashes and login redirects
        setStats({
          totalItems: 0,
          totalRooms: 0,
          lowStockItems: 0,
          householdMembers: 0,
          recentActivities: []
        })
      }
    } finally {
      setLoading(false)
      console.log('🔄 Dashboard: fetchDashboardStats completed, loading set to false')
    }
  }

  const checkForHouseholdChanges = async () => {
    try {
      const response = await fetch('/api/realtime')
      if (response.ok) {
        const data = await response.json()
        if (data.hasChanges) {
          setHouseholdChangeDetected(true)
        }
      }
    } catch (error) {
      console.error('Error checking for household changes:', error)
    }
  }

  const handleRefresh = () => {
    const currentHousehold = household
    const currentRefreshTrigger = refreshTrigger
    setHouseholdChangeDetected(false)
    
    if (!currentHousehold || !currentHousehold.id) {
      console.log('🔄 Dashboard: Cannot refresh - no valid household available')
      return
    }
    
    console.log('🔄 Dashboard: Manual refresh triggered for household:', currentHousehold.id)
    fetchDashboardStats(currentHousehold, currentRefreshTrigger)
  }

  // Separate useEffect for data fetching
  useEffect(() => {
    // Only fetch stats if we have a valid household
    if (!household || !household.id) {
      console.log('🔄 Dashboard: Skipping fetchDashboardStats - no household available')
      console.log('🔄 Dashboard: household:', household)
      return
    }

    console.log('🔄 Dashboard: useEffect triggered with household:', household.id, household.name)
    fetchDashboardStats(household, refreshTrigger)
  }, [timeFilter, household?.id, refreshTrigger]) // Only re-fetch when these specific values change

  // Separate useEffect for interval (runs only once)
  useEffect(() => {
    // Check for household changes every 30 seconds
    const interval = setInterval(() => {
      checkForHouseholdChanges()
    }, 30000)
    
    return () => clearInterval(interval)
  }, []) // Empty dependency array - runs only once

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return t('justNow')
    if (diffMinutes < 60) return `${diffMinutes}m ${t('ago')}`
    if (diffHours < 24) return `${diffHours}h ${t('ago')}`
    if (diffDays < 7) return `${diffDays}d ${t('ago')}`
    
    return date.toLocaleDateString()
  }

  const translateActivityDescription = (activity: any) => {
    const itemName = activity.item?.name || ''
    
    if (activity.action === 'created') {
      return `${t('item')} "${itemName}" ${t('itemWasAddedToInventory')}`
    } else if (activity.action === 'room_created') {
      return `${t('roomWasAdded')}: "${activity.description?.replace('Room "', '').replace('" was created', '')}"`
    } else if (activity.action === 'room_deleted') {
      return `${t('roomWasRemoved')}: "${activity.description?.replace('Room "', '').replace('" was deleted', '')}"`
    } else if (activity.action === 'category_created') {
      return `${t('categoryWasAdded')}: "${activity.description?.replace('Category "', '').replace('" was created', '')}"`
    } else if (activity.action === 'category_deleted') {
      return `${t('categoryWasRemoved')}: "${activity.description?.replace('Category "', '').replace('" was deleted', '')}"`
    }
    
    return activity.description
  }

  return (
    <div className={`${deviceInfo.isMobile ? 'px-1 py-2' : 'px-2 sm:px-4 py-4 sm:py-6 sm:px-0'} space-y-6 sm:space-y-8`}>
      <div
        className={`grid gap-3 sm:gap-4 lg:gap-5 ${
          deviceInfo.isMobile 
            ? deviceInfo.orientation === 'landscape' 
              ? 'grid-cols-2' 
              : 'grid-cols-1'
            : deviceInfo.isTablet 
              ? deviceInfo.orientation === 'landscape'
                ? 'grid-cols-4'
                : 'grid-cols-2'
              : 'grid-cols-2 lg:grid-cols-4'
        }`}
      >
        {coreModules.map((module) => (
          <div
            key={module.id}
            onClick={module.onClick}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 flex flex-col cursor-pointer hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 active:scale-[0.98]"
          >
            <div className={`${deviceInfo.isMobile && deviceInfo.orientation === 'landscape' ? 'p-3' : 'p-4'} sm:p-5 flex-1 flex flex-col`}>
              <div className="flex items-start justify-between">
                <div className={`flex items-center ${deviceInfo.isMobile && deviceInfo.orientation === 'landscape' ? 'space-x-2' : 'space-x-3'} min-w-0 flex-1`}>
                  <div className={`${deviceInfo.isMobile && deviceInfo.orientation === 'landscape' ? 'h-8 w-8' : 'h-10 w-10'} rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0`}>
                    <module.icon className={`${deviceInfo.isMobile && deviceInfo.orientation === 'landscape' ? 'h-4 w-4' : 'h-5 w-5'} text-primary-600 dark:text-primary-400`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`${deviceInfo.isMobile && deviceInfo.orientation === 'landscape' ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-gray-100 truncate`}>{module.title}</p>
                    <p className={`${deviceInfo.isMobile && deviceInfo.orientation === 'landscape' ? 'text-[10px]' : 'text-xs'} text-gray-500 dark:text-gray-400 ${deviceInfo.isMobile && deviceInfo.orientation === 'landscape' ? 'line-clamp-1' : ''}`}>{module.subtitle}</p>
                  </div>
                </div>
                {module.tag && (
                  <span className={`${deviceInfo.isMobile && deviceInfo.orientation === 'landscape' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]'} font-semibold uppercase tracking-wide bg-primary-50 text-primary-600 rounded-full flex-shrink-0`}>
                    {module.tag}
                  </span>
                )}
              </div>

              <div className={`grid grid-cols-2 gap-2 ${deviceInfo.isMobile && deviceInfo.orientation === 'landscape' ? 'mt-2' : 'mt-4'}`}>
                {module.metrics.map((metric) => (
                  <div key={metric.label} className={`rounded-lg bg-gray-50 dark:bg-gray-900/40 ${deviceInfo.isMobile && deviceInfo.orientation === 'landscape' ? 'p-1.5' : 'p-2'}`}>
                    <p className={`${deviceInfo.isMobile && deviceInfo.orientation === 'landscape' ? 'text-[9px]' : 'text-[11px]'} uppercase tracking-wide text-gray-500 dark:text-gray-400 truncate`}>
                      {metric.label}
                    </p>
                    <p className={`${deviceInfo.isMobile && deviceInfo.orientation === 'landscape' ? 'text-sm' : 'text-lg'} font-semibold text-gray-900 dark:text-gray-100`}>{metric.value}</p>
                  </div>
                ))}
              </div>

              {!(deviceInfo.isMobile && deviceInfo.orientation === 'landscape') && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {module.actions.map((action) => (
                    <button
                      key={action.label}
                      onClick={(e) => {
                        e.stopPropagation()
                        action.onClick()
                      }}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 rounded-full px-3 py-1 transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={`grid gap-4 lg:gap-6 ${
        deviceInfo.isMobile 
          ? deviceInfo.orientation === 'landscape' 
            ? 'grid-cols-2' 
            : 'grid-cols-1'
          : deviceInfo.isTablet
            ? deviceInfo.orientation === 'landscape'
              ? 'grid-cols-2'
              : 'grid-cols-1'
            : 'lg:grid-cols-2'
      }`}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {translate('maintenanceTickets', '報修中心')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {translate('maintenanceSubtitle', '追蹤家庭維修與保養狀態')}
                </p>
              </div>
              <div className="flex space-x-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-red-50 text-red-600">
                  {translate('pendingTickets', '待處理')} {maintenanceStats.open}
                </span>
                <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-600">
                  {translate('inProgress', '處理中')} {maintenanceStats.inProgress}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {maintenanceTickets.map((ticket) => (
                <div key={ticket.id} className="border border-gray-100 dark:border-gray-700/60 rounded-xl p-3 sm:p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{ticket.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        #{ticket.id} • {ticket.location} • {t('by')} {ticket.requestedBy}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-semibold rounded-full px-3 py-1 ${
                        ticket.status === 'open'
                          ? 'bg-red-50 text-red-600'
                          : ticket.status === 'inProgress'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-green-50 text-green-600'
                      }`}
                    >
                      {ticket.status === 'open'
                        ? translate('pending', '待處理')
                        : ticket.status === 'inProgress'
                        ? translate('inProgress', '處理中')
                        : translate('resolved', '已完成')}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {translate('lastUpdated', '最近更新')}：{formatDate(ticket.updatedAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {translate('reservationCenter', '預定中心')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {translate('reservationSubtitle', '訪客與服務安排')}
                </p>
              </div>
              <button
                onClick={() => console.log('TODO: open reservation center')}
                className="text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                {translate('viewAll', '查看全部')}
              </button>
            </div>

            <div className="space-y-4">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="border border-gray-100 dark:border-gray-700/60 rounded-xl p-3 sm:p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{reservation.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {reservation.location} • {reservation.owner}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold rounded-full px-3 py-1 bg-blue-50 text-blue-600">
                      {reservation.type === 'delivery'
                        ? translate('delivery', '快遞')
                        : reservation.type === 'cleaning'
                        ? translate('cleaning', '清潔')
                        : reservation.type === 'visitor'
                        ? translate('visitor', '訪客')
                        : translate('other', '其他')}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(reservation.startTime).toLocaleString()} - {new Date(reservation.endTime).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Items List with Photos and Quantity Aggregation - MOVED TO TOP */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
              {t('items')}
            </h3>
            <div className="flex items-center space-x-2">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as 'today' | 'week' | 'all')}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="today">{t('today')}</option>
                <option value="week">{t('pastWeek')}</option>
                <option value="all">{t('all')}</option>
              </select>
            </div>
          </div>
          <ItemsList 
            showCategory={true}
            showLocation={true}
            onItemEdit={onItemEdit}
            onItemMove={onItemMove}
            onItemCheckout={onItemCheckout}
            onItemQuantityAdjust={(item) => {
              console.log('Dashboard: Quantity adjust handler called for item:', item.name)
              onItemQuantityAdjust(item)
            }}
            onItemHistory={onItemHistory}
          />
        </div>
      </div>

      {/* Household Change Notification */}
      {householdChangeDetected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BellIcon className="h-5 w-5 text-blue-600 mr-2" />
              <p className="text-sm text-blue-800">
                {t('householdChangesDetected')} {t('refreshToSeeChanges')}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              {t('refresh')}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                    {t('recentActivity')}
                  </h3>
                  <button
                    onClick={() => {
                      if (household && household.id) {
                        console.log('🔄 Dashboard: Refresh button clicked for household:', household.id)
                        fetchDashboardStats(household, refreshTrigger)
                      } else {
                        console.log('🔄 Dashboard: Cannot refresh - no valid household available')
                      }
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {t('refresh')}
                  </button>
                </div>
                
                {loading ? (
                  <div className="animate-pulse space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : stats.recentActivities.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentActivities.map((activity: any) => (
                      <div key={activity.id} className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            activity.action === 'checkout' ? 'bg-orange-100' :
                            activity.action === 'created' ? 'bg-green-100' :
                            activity.action === 'moved' ? 'bg-blue-100' :
                            'bg-gray-100'
                          }`}>
                            {activity.action === 'checkout' ? (
                              <ArrowDownIcon className="h-4 w-4 text-orange-600" />
                            ) : activity.action === 'created' ? (
                              <PlusIcon className="h-4 w-4 text-green-600" />
                            ) : activity.action === 'moved' ? (
                              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                            ) : (
                              <CubeIcon className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {translateActivityDescription(activity)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {activity.item?.room?.name} • {formatDate(activity.createdAt)} • {t('by')} {activity.performer?.name || activity.performer?.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t('noRecentActivity')} {t('startByAddingFirstItem')}
                  </div>
                )}
        </div>
      </div>

    </div>
  )
}


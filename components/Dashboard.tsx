'use client'

import { useState, useEffect, useCallback } from 'react'
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
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import AddItemModal from './AddItemModal'
import SearchModal from './SearchModal'
import EditItemModal from './EditItemModal'
import MoveItemModal from './MoveItemModal'
import CheckoutModal from './CheckoutModal'
import ItemHistoryModal from './ItemHistoryModal'
import RoomManagement from './RoomManagement'
import CategoryManagement from './CategoryManagement'
import SearchPage from './SearchPage'
import { CompactLanguageSelector, useLanguage } from './LanguageProvider'
import NotificationCenter from './NotificationCenter'
import Activities from './Activities'
import { useHousehold } from './HouseholdProvider'
import { HouseholdMemberManagement } from './HouseholdMemberManagement'
import ItemsList from './ItemsList'
import { useDeviceDetection } from './MobileLayout'
import HouseholdSettings from './HouseholdSettings'
import CreateHouseholdModal from './CreateHouseholdModal'


function HouseholdSwitcher() {
  const { memberships, activeHouseholdId, setActiveHousehold, switching, error } = useHousehold()
  const { t } = useLanguage()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [pendingHouseholdId, setPendingHouseholdId] = useState<string | null>(null)
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false)

  if (!memberships || memberships.length === 0) return null

  const handleHouseholdChange = (householdId: string) => {
    if (householdId === activeHouseholdId) return // No change
    
    setPendingHouseholdId(householdId)
    setShowSwitchConfirm(true)
  }

  const confirmSwitch = () => {
    if (pendingHouseholdId) {
      setActiveHousehold(pendingHouseholdId)
    }
    setShowSwitchConfirm(false)
    setPendingHouseholdId(null)
  }

  const cancelSwitch = () => {
    setShowSwitchConfirm(false)
    setPendingHouseholdId(null)
  }

  const pendingHousehold = memberships.find(m => m.household.id === pendingHouseholdId)

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
      
      {/* Create New Household Button */}
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
    </div>
  )
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
    { id: 'household', name: t('householdSettings'), icon: HomeIcon, permission: 'canManageHousehold' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - Streamlined for tablets */}
      <header className={`bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 ${
        deviceInfo.isMobile ? 'pt-safe-top' : 'pt-0'
      }`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className={`flex justify-between items-center ${
            deviceInfo.isMobile ? 'h-12' : deviceInfo.isTablet ? 'h-12' : 'h-14'
          }`}>
            {/* Left side: App name + Household */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <h1 className={`font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0 ${
                deviceInfo.isMobile ? 'text-sm' : deviceInfo.isTablet ? 'text-base' : 'text-lg'
              }`}>
                {t('smartWarehouse')}
              </h1>
              {household && (
                <>
                  <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">|</span>
                  <div className="min-w-0">
                    <HouseholdSwitcher />
                  </div>
                </>
              )}
            </div>
            
            {/* Right side: Compact action buttons */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Add Item - Primary action */}
              <button
                onClick={() => setShowAddItem(true)}
                className={`inline-flex items-center border border-transparent font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 flex-shrink-0 ${
                  deviceInfo.isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
                }`}
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                {!deviceInfo.isMobile && <span>{t('addItem')}</span>}
              </button>
              
              {/* Search */}
              <button
                onClick={() => setShowSearch(true)}
                className={`inline-flex items-center border border-gray-300 dark:border-gray-600 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex-shrink-0 ${
                  deviceInfo.isMobile ? 'px-2 py-1' : deviceInfo.isTablet ? 'px-2 py-1.5' : 'px-3 py-1.5'
                }`}
                title={t('search')}
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
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

              {/* Language */}
              <CompactLanguageSelector />

              {/* Sign Out */}
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
                {deviceInfo.isMobile ? t('signOut').slice(0, 2) : t('signOut')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs - Compact for tablets */}
      <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className={`flex overflow-x-auto whitespace-nowrap ${
            deviceInfo.isTablet ? 'space-x-1' : 'space-x-2 sm:space-x-4'
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
                      ? 'py-2 px-2 text-xs' 
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
                    deviceInfo.isTablet ? 'h-4 w-4 mr-1' : 'h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-1.5'
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
                   onItemHistory={(item) => {
                     console.log('Dashboard: History handler called for item:', item.name)
                     setSelectedItem(item)
                     setShowItemHistory(true)
                   }}
                 />
               )}
               {activeTab === 'search' && <SearchPage />}
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
      {showItemHistory && selectedItem && (
        <ItemHistoryModal 
          item={selectedItem} 
          onClose={() => {
            setShowItemHistory(false)
            setSelectedItem(null)
          }} 
        />
      )}


      {/* Mobile Household Switcher */}
      {deviceInfo.isMobile && (
        <div className="fixed bottom-16 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 z-40">
          <HouseholdSwitcher />
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {deviceInfo.isMobile && (
        <div className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 py-1 z-50 ${
          deviceInfo.orientation === 'landscape' ? 'pb-safe-bottom' : 'pb-1'
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
                  className={`flex flex-col items-center py-2 px-1 text-xs ${
                    activeTab === tab.id
                      ? 'text-primary-600'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <tab.icon className={`mb-1 ${
                    deviceInfo.orientation === 'landscape' ? 'h-4 w-4' : 'h-5 w-5'
                  }`} />
                  <span className={`truncate ${
                    deviceInfo.orientation === 'landscape' ? 'max-w-12 text-xs' : 'max-w-16'
                  }`}>
                    {deviceInfo.orientation === 'landscape' ? tab.name.slice(0, 3) : tab.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Add bottom padding for mobile navigation and household switcher */}
      <div className={`${deviceInfo.isMobile ? 'h-24' : 'h-0'} sm:hidden`}></div>
    </div>
  )
}

function DashboardContent({ 
  household,
  refreshTrigger,
  onTabChange,
  onItemEdit, 
  onItemMove, 
  onItemCheckout, 
  onItemHistory 
}: {
  household: any
  refreshTrigger: number
  onTabChange: (tab: string) => void
  onItemEdit: (item: any) => void
  onItemMove: (item: any) => void
  onItemCheckout: (item: any) => void
  onItemHistory: (item: any) => void
}) {
  const { t } = useLanguage()
  const deviceInfo = useDeviceDetection()
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
      console.log('🔄 Dashboard: Stats URL:', `/api/dashboard/simple?householdId=${householdId}`)
      console.log('🔄 Dashboard: Activities URL:', 'SKIPPED (using simple API only)')
      
      // Add timeout to prevent hanging (reduced since we're only calling simple API)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      // Use only simple API for maximum performance - no activities for now
      console.log('🔄 Dashboard: Using SIMPLE API only for better performance')
      const statsResponse = await fetch(`/api/dashboard/simple?householdId=${householdId}`, {
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
    <div className={`${
      deviceInfo.isMobile ? 'px-1 py-2' : 'px-2 sm:px-4 py-4 sm:py-6 sm:px-0'
    }`}>
      <div className={`grid gap-3 sm:gap-6 mb-6 sm:mb-8 ${
        deviceInfo.isMobile 
          ? 'grid-cols-2' 
          : deviceInfo.isTablet 
            ? 'grid-cols-2 md:grid-cols-4' 
            : 'grid-cols-2 lg:grid-cols-4'
      }`}>
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className={`${deviceInfo.isMobile ? 'p-2' : 'p-3 sm:p-5'}`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CubeIcon className={`text-gray-400 ${
                  deviceInfo.isMobile ? 'h-4 w-4' : 'h-5 w-5 sm:h-6 sm:w-6'
                }`} />
              </div>
              <div className={`w-0 flex-1 ${deviceInfo.isMobile ? 'ml-2' : 'ml-3 sm:ml-5'}`}>
                <dl>
                  <dt className={`font-medium text-gray-500 dark:text-gray-400 truncate ${
                    deviceInfo.isMobile ? 'text-xs' : 'text-xs sm:text-sm'
                  }`}>
                    {t('totalItems')}
                  </dt>
                  <dd className={`font-medium text-gray-900 dark:text-gray-100 ${
                    deviceInfo.isMobile ? 'text-sm' : 'text-base sm:text-lg'
                  }`}>
                    {loading ? '...' : stats.totalItems}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => onTabChange('rooms')}
          className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer w-full text-left"
        >
          <div className={`${deviceInfo.isMobile ? 'p-2' : 'p-3 sm:p-5'}`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPinIcon className={`text-gray-400 ${
                  deviceInfo.isMobile ? 'h-4 w-4' : 'h-5 w-5 sm:h-6 sm:w-6'
                }`} />
              </div>
              <div className={`w-0 flex-1 ${deviceInfo.isMobile ? 'ml-2' : 'ml-3 sm:ml-5'}`}>
                <dl>
                  <dt className={`font-medium text-gray-500 dark:text-gray-400 truncate ${
                    deviceInfo.isMobile ? 'text-xs' : 'text-xs sm:text-sm'
                  }`}>
                    {t('rooms')}
                  </dt>
                  <dd className={`font-medium text-gray-900 dark:text-gray-100 ${
                    deviceInfo.isMobile ? 'text-sm' : 'text-base sm:text-lg'
                  }`}>
                    {loading ? '...' : stats.totalRooms}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </button>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className={`${deviceInfo.isMobile ? 'p-2' : 'p-3 sm:p-5'}`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BellIcon className={`text-gray-400 ${
                  deviceInfo.isMobile ? 'h-4 w-4' : 'h-5 w-5 sm:h-6 sm:w-6'
                }`} />
              </div>
              <div className={`w-0 flex-1 ${deviceInfo.isMobile ? 'ml-2' : 'ml-3 sm:ml-5'}`}>
                <dl>
                  <dt className={`font-medium text-gray-500 dark:text-gray-400 truncate ${
                    deviceInfo.isMobile ? 'text-xs' : 'text-xs sm:text-sm'
                  }`}>
                    {t('lowStockItems')}
                  </dt>
                  <dd className={`font-medium text-red-600 ${
                    deviceInfo.isMobile ? 'text-sm' : 'text-base sm:text-lg'
                  }`}>
                    {loading ? '...' : stats.lowStockItems}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className={`${deviceInfo.isMobile ? 'p-2' : 'p-3 sm:p-5'}`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className={`text-gray-400 ${
                  deviceInfo.isMobile ? 'h-4 w-4' : 'h-5 w-5 sm:h-6 sm:w-6'
                }`} />
              </div>
              <div className={`w-0 flex-1 ${deviceInfo.isMobile ? 'ml-2' : 'ml-3 sm:ml-5'}`}>
                <dl>
                  <dt className={`font-medium text-gray-500 dark:text-gray-400 truncate ${
                    deviceInfo.isMobile ? 'text-xs' : 'text-xs sm:text-sm'
                  }`}>
                    {t('householdMembers')}
                  </dt>
                  <dd className={`font-medium text-gray-900 dark:text-gray-100 ${
                    deviceInfo.isMobile ? 'text-sm' : 'text-base sm:text-lg'
                  }`}>
                    {loading ? '...' : stats.householdMembers}
                  </dd>
                </dl>
              </div>
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


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
import { useHousehold, PermissionGate } from './HouseholdProvider'
import { HouseholdMemberManagement } from './HouseholdMemberManagement'
import ItemsList from './ItemsList'


function HouseholdSwitcher() {
  const { memberships, activeHouseholdId, setActiveHousehold } = useHousehold()
  const { t } = useLanguage()

  if (!memberships || memberships.length <= 1) return null

  return (
    <select
      value={activeHouseholdId || ''}
      onChange={(e) => setActiveHousehold(e.target.value)}
      className="ml-2 border-gray-300 text-sm rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
      title={t('switchHousehold')}
    >
      {memberships.map(m => (
        <option key={m.household.id} value={m.household.id} className="bg-white dark:bg-gray-700">
          {m.household.name} ({m.role})
        </option>
      ))}
    </select>
  )
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const { t } = useLanguage()
  const { household, role, permissions } = useHousehold()

  // Handle authentication errors
  useEffect(() => {
    if (status === 'unauthenticated') {
      console.log('[Dashboard] User not authenticated, redirecting to login')
      window.location.href = '/auth/signin'
      return
    }

    if (status === 'authenticated' && (!session || !session.user || !(session.user as any).id)) {
      console.log('[Dashboard] Invalid session, redirecting to login')
      window.location.href = '/auth/signin'
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

  const tabs = [
    { id: 'dashboard', name: t('dashboard'), icon: HomeIcon },
    { id: 'search', name: t('search'), icon: MagnifyingGlassIcon },
    { id: 'items', name: t('items'), icon: ArchiveBoxIcon },
    { id: 'rooms', name: t('rooms'), icon: MapPinIcon },
    { id: 'categories', name: t('categories'), icon: CubeIcon },
    { id: 'activities', name: t('activities'), icon: ClockIcon },
    { id: 'notifications', name: t('notifications'), icon: BellIcon },
    { id: 'members', name: t('members'), icon: UsersIcon, permission: 'canManageMembers' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b pt-safe-area-inset-top">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 flex-wrap gap-1 sm:gap-2">
            <div className="flex items-center min-w-0">
              <h1 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                {t('smartWarehouse')}
              </h1>
              {household && (
                <div className="ml-2 sm:ml-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1 sm:space-x-2 truncate">
                  <span className="truncate">{household.name}<span className="hidden sm:inline"> • {role || 'Member'}</span></span>
                  {/* Household switcher */}
                  <HouseholdSwitcher />
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-4">
              <button
                onClick={() => setShowAddItem(true)}
                className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <PlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">{t('addItem')}</span>
              </button>
              <a
                href="/duplicates"
                className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ExclamationTriangleIcon className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">{t('duplicates')}</span>
              </a>
              
              <button
                onClick={() => setShowSearch(true)}
                className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">{t('search')}</span>
              </button>

              <a
                href="/settings"
                className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <CogIcon className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Settings</span>
              </a>

              <div className="flex items-center space-x-1 sm:space-x-2">
                <CompactLanguageSelector />
                <div className="hidden lg:block text-sm text-gray-700">
                  {t('welcome')}, {session?.user?.name || session?.user?.email}
                </div>
                <button
                  onClick={() => {
                    console.log('Signing out...')
                    // Navigate to dedicated sign out page
                    window.location.href = '/auth/signout'
                  }}
                  className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-1"
                >
                  <span className="hidden sm:inline">{t('signOut')}</span>
                  <span className="sm:hidden">{t('signOut').slice(0, 4)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-4 overflow-x-auto whitespace-nowrap pb-1 sm:pb-2">
            {tabs.map((tab) => {
              // Check if user has permission for this tab
              if (tab.permission && (!permissions || !permissions[tab.permission as keyof typeof permissions])) {
                return null
              }
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                  } flex-shrink-0`}
                >
                  <tab.icon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

             {/* Main Content */}
             <main className="max-w-7xl mx-auto py-4 sm:py-6 px-2 sm:px-6 lg:px-8">
               {activeTab === 'dashboard' && (
                 <DashboardContent 
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
             </main>

      {/* Modals */}
      {showAddItem && (
        <AddItemModal onClose={() => setShowAddItem(false)} />
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


      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 sm:hidden z-50">
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
                    : 'text-gray-500'
                }`}
              >
                <tab.icon className="h-5 w-5 mb-1" />
                <span className="truncate max-w-16">{tab.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Add bottom padding for mobile navigation */}
      <div className="h-16 sm:hidden"></div>
    </div>
  )
}

function DashboardContent({ 
  onTabChange,
  onItemEdit, 
  onItemMove, 
  onItemCheckout, 
  onItemHistory 
}: {
  onTabChange: (tab: string) => void
  onItemEdit: (item: any) => void
  onItemMove: (item: any) => void
  onItemCheckout: (item: any) => void
  onItemHistory: (item: any) => void
}) {
  const { t } = useLanguage()
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

  useEffect(() => {
    try {
      fetchDashboardStats()
      
      // Check for household changes every 30 seconds
      const interval = setInterval(() => {
        checkForHouseholdChanges()
      }, 30000)
      
      return () => clearInterval(interval)
    } catch (error) {
      console.error('Error in useEffect:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter]) // Only re-fetch when timeFilter changes

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
    setHouseholdChangeDetected(false)
    fetchDashboardStats()
  }

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      
      // Fetch both dashboard stats and filtered activities
      const [statsResponse, activitiesResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch(`/api/activities?timeFilter=${timeFilter}`)
      ])
      
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
      console.error('Error fetching dashboard stats:', error)
      // Set default stats to prevent crashes
      setStats({
        totalItems: 0,
        totalRooms: 0,
        lowStockItems: 0,
        householdMembers: 0,
        recentActivities: []
      })
    } finally {
      setLoading(false)
    }
  }

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
    <div className="px-2 sm:px-4 py-4 sm:py-6 sm:px-0">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CubeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
              <div className="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    {t('totalItems')}
                  </dt>
                  <dd className="text-base sm:text-lg font-medium text-gray-900">
                    {loading ? '...' : stats.totalItems}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => onTabChange('rooms')}
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer w-full text-left"
        >
          <div className="p-3 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPinIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
              <div className="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    {t('rooms')}
                  </dt>
                  <dd className="text-base sm:text-lg font-medium text-gray-900">
                    {loading ? '...' : stats.totalRooms}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </button>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BellIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
              <div className="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    {t('lowStockItems')}
                  </dt>
                  <dd className="text-base sm:text-lg font-medium text-red-600">
                    {loading ? '...' : stats.lowStockItems}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
              <div className="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    {t('householdMembers')}
                  </dt>
                  <dd className="text-base sm:text-lg font-medium text-gray-900">
                    {loading ? '...' : stats.householdMembers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items List with Photos and Quantity Aggregation - MOVED TO TOP */}
      <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {t('items')}
            </h3>
            <div className="flex items-center space-x-2">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as 'today' | 'week' | 'all')}
                className="text-sm border border-gray-300 rounded-md px-2 py-1"
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

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {t('recentActivity')}
                  </h3>
                  <button
                    onClick={fetchDashboardStats}
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
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {translateActivityDescription(activity)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {activity.item?.room?.name} • {formatDate(activity.createdAt)} • {t('by')} {activity.performer?.name || activity.performer?.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    {t('noRecentActivity')} {t('startByAddingFirstItem')}
                  </div>
                )}
        </div>
      </div>

    </div>
  )
}


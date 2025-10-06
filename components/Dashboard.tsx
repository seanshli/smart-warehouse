'use client'

import { useState, useEffect } from 'react'
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
  ArchiveBoxIcon
} from '@heroicons/react/24/outline'
import AddItemModal from './AddItemModal'
import SearchModal from './SearchModal'
import RoomManagement from './RoomManagement'
import CategoryManagement from './CategoryManagement'
import { CompactLanguageSelector, useLanguage } from './LanguageProvider'
import NotificationCenter from './NotificationCenter'
import Activities from './Activities'
import { useHousehold, PermissionGate } from './HouseholdProvider'
import { HouseholdMemberManagement } from './HouseholdMemberManagement'
import ItemsList from './ItemsList'

function HouseholdSwitcher() {
  const { memberships, activeHouseholdId, setActiveHousehold } = useHousehold()

  if (!memberships || memberships.length <= 1) return null

  return (
    <select
      value={activeHouseholdId || ''}
      onChange={(e) => setActiveHousehold(e.target.value)}
      className="ml-2 border-gray-300 text-sm rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
      title="Switch household"
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
  const { data: session } = useSession()
  const { t } = useLanguage()
  const { household, role, permissions } = useHousehold()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showAddItem, setShowAddItem] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const tabs = [
    { id: 'dashboard', name: t('dashboard'), icon: HomeIcon },
    { id: 'items', name: t('items'), icon: ArchiveBoxIcon },
    { id: 'rooms', name: t('rooms'), icon: MapPinIcon, permission: 'canManageRooms' },
    { id: 'categories', name: t('categories'), icon: CubeIcon, permission: 'canManageCategories' },
    { id: 'activities', name: t('activities'), icon: ClockIcon },
    { id: 'notifications', name: t('notifications'), icon: BellIcon },
    { id: 'members', name: t('members'), icon: UsersIcon, permission: 'canManageMembers' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t('smartWarehouse')}
              </h1>
              {household && (
                <div className="ml-4 text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                  <span>{household.name} • {role}</span>
                  {/* Household switcher */}
                  <HouseholdSwitcher />
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddItem(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                {t('addItem')}
              </button>
              
              <button
                onClick={() => setShowSearch(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                {t('search')}
              </button>

              <div className="flex items-center space-x-2">
                <CompactLanguageSelector />
                <div className="text-sm text-gray-700">
                  {t('welcome')}, {session?.user?.name || session?.user?.email}
                </div>
                <button
                  onClick={() => {
                    console.log('Signing out...')
                    // Navigate to dedicated sign out page
                    window.location.href = '/auth/signout'
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {t('signOut')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              // Check if user has permission for this tab
              if (tab.permission && (!permissions || !permissions[tab.permission as keyof typeof permissions])) {
                return null
              }
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <tab.icon className="h-5 w-5 inline mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

             {/* Main Content */}
             <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
               {activeTab === 'dashboard' && <DashboardContent />}
               {activeTab === 'items' && (
                 <div className="px-4 py-6 sm:px-0">
                   <ItemsList 
                     showCategory={true}
                     showLocation={true}
                     onItemEdit={(item) => {
                       // TODO: Implement edit functionality
                       console.log('Edit item:', item)
                     }}
                     onItemMove={(item) => {
                       // TODO: Implement move functionality
                       console.log('Move item:', item)
                     }}
                     onItemCheckout={(item) => {
                       // TODO: Implement checkout functionality
                       console.log('Checkout item:', item)
                     }}
                     onItemHistory={(item) => {
                       // TODO: Implement history functionality
                       console.log('View history for item:', item)
                     }}
                   />
                 </div>
               )}
               {activeTab === 'rooms' && <RoomManagement />}
               {activeTab === 'categories' && <CategoryManagement />}
               {activeTab === 'activities' && <Activities />}
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
    </div>
  )
}

function DashboardContent() {
  const { t } = useLanguage()
  const [stats, setStats] = useState({
    totalItems: 0,
    totalRooms: 0,
    lowStockItems: 0,
    householdMembers: 0,
    recentActivities: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error('Failed to fetch dashboard stats')
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
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
    <div className="px-4 py-6 sm:px-0">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CubeIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {t('totalItems')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '...' : stats.totalItems}
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
                <MapPinIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {t('rooms')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '...' : stats.totalRooms}
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
                <BellIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {t('lowStockItems')}
                  </dt>
                  <dd className="text-lg font-medium text-red-600">
                    {loading ? '...' : stats.lowStockItems}
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
                <UserGroupIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {t('householdMembers')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '...' : stats.householdMembers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {/* Items List with Photos and Quantity Aggregation */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <ItemsList 
            showCategory={true}
            showLocation={true}
            onItemEdit={(item) => {
              // TODO: Implement edit functionality
              console.log('Edit item:', item)
            }}
            onItemMove={(item) => {
              // TODO: Implement move functionality
              console.log('Move item:', item)
            }}
            onItemCheckout={(item) => {
              // TODO: Implement checkout functionality
              console.log('Checkout item:', item)
            }}
            onItemHistory={(item) => {
              // TODO: Implement history functionality
              console.log('View history for item:', item)
            }}
          />
        </div>
      </div>
    </div>
  )
}


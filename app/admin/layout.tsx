'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/components/LanguageProvider'
import { 
  HomeIcon,
  UserGroupIcon,
  CubeIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  BellIcon,
  ShoppingBagIcon,
  TruckIcon,
} from '@heroicons/react/24/outline'

interface AdminContext {
  isSuperAdmin: boolean
  communityAdmins: Array<{ id: string; name: string }>
  buildingAdmins: Array<{ id: string; name: string; communityId: string; communityName: string }>
  supplierAdmins: Array<{ id: string; name: string; serviceTypes: string[] }>
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  // Use the language context for actual language switching
  const { currentLanguage, setLanguage, t } = useLanguage()
  const [adminContext, setAdminContext] = useState<AdminContext | null>(null)
  const [loadingContext, setLoadingContext] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/admin/context')
        .then(res => res.json())
        .then(data => {
          setAdminContext(data)
          setLoadingContext(false)
        })
        .catch(err => {
          console.error('Error fetching admin context:', err)
          setLoadingContext(false)
        })
    }
  }, [status])

  // If not authenticated, show login prompt
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <ShieldCheckIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('adminAccessRequired') || 'Admin Access Required'}</h2>
            <p className="text-gray-600 mb-6">{t('adminPleaseSignIn') || 'Please sign in to access the admin panel'}</p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {t('commonSignIn') || 'Sign In'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Build navigation based on admin context
  const navigation: Array<{ name: string; href: string; icon: any; current: boolean }> = []
  
  // Super admin and community/building admins see all navigation
  if (adminContext?.isSuperAdmin || 
      (adminContext?.communityAdmins && adminContext.communityAdmins.length > 0) ||
      (adminContext?.buildingAdmins && adminContext.buildingAdmins.length > 0)) {
    navigation.push(
      { name: t('adminDashboard'), href: '/admin', icon: HomeIcon, current: pathname === '/admin' },
      { name: t('adminCommunities'), href: '/admin/communities', icon: BuildingOfficeIcon, current: pathname === '/admin/communities' },
      { name: t('adminBuildings'), href: '/admin/buildings', icon: BuildingOfficeIcon, current: pathname === '/admin/buildings' },
      { name: t('adminHouseholds'), href: '/admin/households', icon: UserGroupIcon, current: pathname === '/admin/households' },
      { name: t('adminItems'), href: '/admin/items', icon: CubeIcon, current: pathname === '/admin/items' },
      { name: t('adminAnnouncements'), href: '/admin/announcements', icon: BellIcon, current: pathname === '/admin/announcements' },
      { name: t('adminChatHistory') || 'Chat History', href: '/admin/chat-history', icon: BellIcon, current: pathname === '/admin/chat-history' },
      { name: t('adminDuplicateManagement'), href: '/admin/duplicates', icon: ExclamationTriangleIcon, current: pathname === '/admin/duplicates' },
      { name: t('adminMaintenance'), href: '/admin/maintenance', icon: ExclamationTriangleIcon, current: pathname === '/admin/maintenance' },
      { name: 'Catering', href: '/admin/catering', icon: ShoppingBagIcon, current: pathname.startsWith('/admin/catering') },
      { name: t('adminUsers'), href: '/admin/users', icon: ShieldCheckIcon, current: pathname === '/admin/users' },
      { name: t('adminRoles'), href: '/admin/roles', icon: ShieldCheckIcon, current: pathname === '/admin/roles' },
      { name: t('adminAnalytics'), href: '/admin/analytics', icon: ChartBarIcon, current: pathname === '/admin/analytics' },
      { name: t('adminSettings'), href: '/admin/settings', icon: CogIcon, current: pathname === '/admin/settings' },
    )
  }
  
  // Supplier admins only see their supplier-specific maintenance page
  if (adminContext?.supplierAdmins && adminContext.supplierAdmins.length > 0) {
    adminContext.supplierAdmins.forEach((supplier) => {
      navigation.push({
        name: `${supplier.name} - 工單`,
        href: `/admin/suppliers/${supplier.id}/maintenance`,
        icon: TruckIcon,
        current: pathname === `/admin/suppliers/${supplier.id}/maintenance`,
      })
    })
  }

  const handleSignOut = () => {
    // Redirect to admin signout page for proper cleanup
    window.location.href = '/admin-auth/signout'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b border-red-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <ShieldCheckIcon className="h-8 w-8 text-red-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{t('adminPanel')}</h1>
                  <p className="text-sm text-gray-500">
                    {loadingContext ? (
                      t('adminManagement') || 'Loading...'
                    ) : adminContext?.isSuperAdmin ? (
                      <span className="text-red-600 font-semibold">Super Administrator</span>
                    ) : adminContext?.communityAdmins && adminContext.communityAdmins.length > 0 ? (
                      <span className="text-blue-600 font-semibold">
                        Community Admin: {adminContext.communityAdmins.map(c => c.name).join(', ')}
                      </span>
                    ) : adminContext?.buildingAdmins && adminContext.buildingAdmins.length > 0 ? (
                      <span className="text-green-600 font-semibold">
                        Building Admin: {adminContext.buildingAdmins.map(b => b.name).join(', ')}
                      </span>
                    ) : adminContext?.supplierAdmins && adminContext.supplierAdmins.length > 0 ? (
                      <span className="text-purple-600 font-semibold">
                        Supplier Admin: {adminContext.supplierAdmins.map(s => s.name).join(', ')}
                      </span>
                    ) : (
                      t('adminManagement') || 'Administrator'
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Language Selection */}
              <div className="flex items-center space-x-2">
                <label htmlFor="language-select" className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{t('commonLanguage') || '語言'}:</label>
                <select
                  id="language-select"
                  value={currentLanguage}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="block w-36 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                >
                  <option value="en">English</option>
                  <option value="zh-TW">繁體中文</option>
                  <option value="zh">简体中文</option>
                  <option value="ja">日文</option>
                </select>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{session?.user?.name || session?.user?.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('adminAdministrator') || 'Administrator'}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
                {t('commonSignOut') || 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Layout: Vertical Sidebar + Content */}
      <div className="flex">
        {/* Vertical Sidebar Navigation */}
        <div className="w-64 flex-shrink-0 bg-white shadow-sm border-r border-gray-200">
          <div className="h-[calc(100vh-120px)] overflow-y-auto p-2">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    prefetch={false}
                    className={`${
                      item.current
                        ? 'bg-red-50 text-red-600 border-red-500'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                    } w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md border-l-2 transition-colors`}
                    title={item.name}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Admin Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2024 {t('adminCopyright')}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{t('adminAccess')}</span>
              <div className="flex items-center space-x-1">
                <ShieldCheckIcon className="h-4 w-4 text-red-600" />
                <span className="text-red-600 font-medium">{t('adminSecure')}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
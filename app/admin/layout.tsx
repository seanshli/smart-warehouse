'use client'

import { useState } from 'react'
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
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  // Use the language context for actual language switching
  const { currentLanguage, setLanguage, t } = useLanguage()

  const navigation = [
    { name: t('admin.dashboard'), href: '/admin', icon: HomeIcon, current: pathname === '/admin' },
    { name: t('admin.households'), href: '/admin/households', icon: UserGroupIcon, current: pathname === '/admin/households' },
    { name: t('admin.items'), href: '/admin/items', icon: CubeIcon, current: pathname === '/admin/items' },
    { name: t('admin.users'), href: '/admin/users', icon: ShieldCheckIcon, current: pathname === '/admin/users' },
    { name: t('admin.roles'), href: '/admin/roles', icon: ShieldCheckIcon, current: pathname === '/admin/roles' },
    { name: t('admin.analytics'), href: '/admin/analytics', icon: ChartBarIcon, current: pathname === '/admin/analytics' },
    { name: t('admin.settings'), href: '/admin/settings', icon: CogIcon, current: pathname === '/admin/settings' },
  ]

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
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
                  <h1 className="text-xl font-bold text-gray-900">{t('admin.panel')}</h1>
                  <p className="text-sm text-gray-500">{t('admin.management')}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
            {/* Language Selection */}
            <div className="flex items-center space-x-2">
              <label htmlFor="language-select" className="text-sm text-gray-500">{t('common.language')}:</label>
              <select
                id="language-select"
                value={currentLanguage}
                onChange={(e) => setLanguage(e.target.value)}
                className="block w-32 px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              >
                <option value="en">English</option>
                <option value="zh-TW">繁體中文</option>
                <option value="zh">简体中文</option>
                <option value="ja">日文</option>
              </select>
            </div>
              
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{session?.user?.name || session?.user?.email}</p>
                  <p className="text-xs text-gray-500">{t('admin.administrator')}</p>
                  <p className="text-xs text-gray-400">{t('common.currentLanguage')}: {currentLanguage}</p>
                </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
                {t('common.signOut')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    item.current
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2024 {t('admin.copyright')}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{t('admin.access')}</span>
              <div className="flex items-center space-x-1">
                <ShieldCheckIcon className="h-4 w-4 text-red-600" />
                <span className="text-red-600 font-medium">{t('admin.secure')}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
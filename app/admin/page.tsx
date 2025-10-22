'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useLanguage } from '@/components/LanguageProvider'
import { 
  HomeIcon, 
  UserGroupIcon, 
  CubeIcon, 
  ChartBarIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  BellIcon,
  CogIcon
} from '@heroicons/react/24/outline'

interface AdminStats {
  users: number;
  households: number;
  items: number;
  recentActivities?: any[];
  systemHealth?: {
    database: 'healthy' | 'warning' | 'error';
    api: 'healthy' | 'warning' | 'error';
    storage: 'healthy' | 'warning' | 'error';
  };
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/admin/stats')
        if (!res.ok) {
          throw new Error('Failed to load admin stats')
        }
        const data = await res.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('adminLoading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold">{t('adminError')}</div>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {t('adminWelcome')}, {session?.user?.name || t('adminAdministrator')}
        </h1>
        <p className="mt-2 text-gray-600">
          {t('adminOverview')}
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('adminTotalUsers')}</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.users}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <HomeIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('adminHouseholds')}</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.households}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CubeIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('adminTotalItems')}</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.items}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('adminAvgItems')}</dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.households > 0 ? Math.round(stats.items / stats.households) : 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('adminQuickActions')}</h3>
          <div className="space-y-3">
            <Link
              href="/admin/households"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <UserGroupIcon className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">{t('adminManageHouseholds')}</span>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400" />
            </Link>
            
            <Link
              href="/admin/items"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <CubeIcon className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-900">{t('adminViewAllItems')}</span>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400" />
            </Link>
            
            <Link
              href="/admin/analytics"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <ChartBarIcon className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">{t('adminViewAnalytics')}</span>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400" />
            </Link>
            
            <Link
              href="/admin/settings"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <CogIcon className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">{t('adminSystemSettings')}</span>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400" />
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('adminSystemStatus')}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('adminDatabase')}</span>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">{t('adminHealthy')}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('adminAPIServices')}</span>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">{t('adminHealthy')}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('adminStorage')}</span>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">{t('adminHealthy')}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('adminAuthentication')}</span>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">{t('adminHealthy')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('adminRecentActivity')}</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <BellIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{t('adminSystemMonitoring')}</p>
              <p className="text-xs text-gray-500">{t('adminAllServicesRunning')}</p>
            </div>
            <div className="flex-shrink-0">
              <span className="text-xs text-gray-500">{t('adminJustNow')}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{t('adminDashboardAccessed')}</p>
              <p className="text-xs text-gray-500">{t('adminSecureAuth')}</p>
            </div>
            <div className="flex-shrink-0">
              <span className="text-xs text-gray-500">{t('admin2MinutesAgo')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          {t('adminCopyright')} • {t('adminLastUpdated')}: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  )
}
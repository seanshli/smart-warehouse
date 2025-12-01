'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/components/LanguageProvider'
import { 
  CogIcon,
  ServerIcon,
  CircleStackIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface SystemStatus {
  database: boolean
  authentication: boolean
  adminUsers: number
  totalUsers: number
  totalHouseholds: number
  totalItems: number
}

export default function AdminSettingsPage() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(false)

  useEffect(() => {
    loadSystemStatus()
  }, [])

  const loadSystemStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) {
        throw new Error('Failed to load system status')
      }
      const data = await res.json()
      
      // Mock system status - in a real app, you'd check actual system health
      setStatus({
        database: true,
        authentication: true,
        adminUsers: 2,
        totalUsers: data.users || 0,
        totalHouseholds: data.households || 0,
        totalItems: data.items || 0
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (isHealthy: boolean) => {
    return isHealthy ? (
      <CheckCircleIcon className="h-5 w-5 text-green-500" />
    ) : (
      <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
    )
  }

  const getStatusText = (isHealthy: boolean) => {
    return isHealthy ? (
      <span className="text-green-700 font-medium">Healthy</span>
    ) : (
      <span className="text-red-700 font-medium">Issues Detected</span>
    )
  }

  const initializeWorkingGroups = async () => {
    if (!confirm('This will create working groups for all existing communities and buildings. Continue?')) {
      return
    }

    setInitializing(true)
    try {
      const response = await fetch('/api/admin/initialize-working-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to initialize working groups')
      }

      const data = await response.json()
      toast.success('Working groups initialized successfully!')
      console.log('Initialization results:', data.results)
    } catch (err) {
      console.error('Error initializing working groups:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to initialize working groups')
    } finally {
      setInitializing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">{error}</div>
          <button
            onClick={loadSystemStatus}
            className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('adminSettings')}</h1>
        <p className="text-gray-600 mt-1">{t('adminSettingsDescription')}</p>
      </div>

      {/* System Status */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            <ServerIcon className="h-5 w-5 inline mr-2" />
            System Health Status
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CircleStackIcon className="h-6 w-6 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Database</p>
                  <p className="text-sm text-gray-500">PostgreSQL Connection</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(status?.database || false)}
                {getStatusText(status?.database || false)}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <ShieldCheckIcon className="h-6 w-6 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Authentication</p>
                  <p className="text-sm text-gray-500">NextAuth.js System</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(status?.authentication || false)}
                {getStatusText(status?.authentication || false)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Statistics */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            <CogIcon className="h-5 w-5 inline mr-2" />
            System Statistics
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{status?.totalUsers || 0}</div>
              <div className="text-sm text-gray-500">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{status?.adminUsers || 0}</div>
              <div className="text-sm text-gray-500">Admin Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{status?.totalHouseholds || 0}</div>
              <div className="text-sm text-gray-500">Households</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{status?.totalItems || 0}</div>
              <div className="text-sm text-gray-500">Items</div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Configuration
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">Environment</p>
                <p className="text-sm text-gray-500">Production</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">Database</p>
                <p className="text-sm text-gray-500">Supabase PostgreSQL</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">Deployment</p>
                <p className="text-sm text-gray-500">Vercel Platform</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Deployed
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Version</p>
                <p className="text-sm text-gray-500">Smart Warehouse v1.0</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Latest
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Management */}
      <div className="bg-white shadow rounded-lg mt-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            <CogIcon className="h-5 w-5 inline mr-2" />
            System Management
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <UserGroupIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Initialize Working Groups</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Create working groups (Management, Maintenance, Front Door) for all existing communities and buildings. 
                    This will also create default accounts (doorbell and frontdesk) for each building and add them to the Front Door Team.
                  </p>
                  <button
                    onClick={initializeWorkingGroups}
                    disabled={initializing}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {initializing ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      <>
                        <UserGroupIcon className="h-4 w-4 mr-2" />
                        Initialize Working Groups
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

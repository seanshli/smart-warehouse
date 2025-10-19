'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

interface AnalyticsData {
  users: number
  households: number
  items: number
  perDay: Record<string, number>
  perHour: Record<string, number>
}

interface AdminUser {
  id: string
  email: string
  name: string
  adminRole: string
  language: string
}

export default function AdminAnalyticsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all')

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, rolesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/roles')
      ])
      
      if (!statsRes.ok) {
        throw new Error('Failed to load analytics data')
      }
      
      const analyticsData = await statsRes.json()
      setData(analyticsData)
      
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json()
        setAdminUsers(rolesData.adminUsers || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getPerDayChart = () => {
    if (!data?.perDay) return null
    
    const entries = Object.entries(data.perDay).sort(([a], [b]) => a.localeCompare(b))
    const maxValue = Math.max(...entries.map(([, value]) => value))
    
    return (
      <div className="space-y-2">
        {entries.map(([date, value]) => (
          <div key={date} className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 w-20">{new Date(date).toLocaleDateString()}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
              <div 
                className="bg-red-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${(value / maxValue) * 100}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                {value}
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const getPerHourChart = () => {
    if (!data?.perHour) return null
    
    const entries = Object.entries(data.perHour).sort(([a], [b]) => a.localeCompare(b))
    const maxValue = Math.max(...entries.map(([, value]) => value))
    
    return (
      <div className="space-y-2">
        {entries.map(([hour, value]) => (
          <div key={hour} className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 w-24">{new Date(hour).toLocaleString()}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${(value / maxValue) * 100}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                {value}
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
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
            onClick={loadAnalytics}
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">System performance and usage statistics</p>
          </div>
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
              >
                <option value="all">All Languages</option>
                <option value="en">English</option>
                <option value="tw">Traditional Chinese</option>
                <option value="ch">Simplified Chinese</option>
                <option value="jp">Japanese</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{data?.users || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Households</dt>
                  <dd className="text-lg font-medium text-gray-900">{data?.households || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingDownIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Items</dt>
                  <dd className="text-lg font-medium text-gray-900">{data?.items || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Roles Section */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            <ChartBarIcon className="h-5 w-5 inline mr-2" />
            Admin Roles & Languages
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {adminUsers.map((admin) => (
              <div key={admin.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">{admin.name || admin.email}</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    admin.adminRole === 'SUPERUSER' ? 'bg-red-100 text-red-800' :
                    admin.adminRole === 'USER_MANAGEMENT' ? 'bg-blue-100 text-blue-800' :
                    admin.adminRole === 'ITEM_MANAGEMENT' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {admin.adminRole.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{admin.email}</p>
                <p className="text-xs text-gray-500">Language: {admin.language?.toUpperCase() || 'EN'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              <CalendarIcon className="h-5 w-5 inline mr-2" />
              Activity by Day (Last 7 Days)
            </h3>
            {getPerDayChart() || (
              <p className="text-gray-500 text-center py-8">No activity data available</p>
            )}
          </div>
        </div>

        {/* Hourly Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              <ClockIcon className="h-5 w-5 inline mr-2" />
              Activity by Hour (Last 7 Days)
            </h3>
            {getPerHourChart() || (
              <p className="text-gray-500 text-center py-8">No activity data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

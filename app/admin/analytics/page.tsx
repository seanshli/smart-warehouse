'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/components/LanguageProvider'
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CalendarIcon,
  FunnelIcon,
  UserGroupIcon,
  CubeIcon,
  HomeIcon
} from '@heroicons/react/24/outline'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Pie } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface AnalyticsData {
  users: number
  households: number
  items: number
  perDay: Record<string, number>
  perHour: Record<string, number>
  itemsByCategory?: Record<string, number>
  itemsByRoom?: Record<string, number>
  usersByHousehold?: Record<string, number>
  activityByUser?: Record<string, number>
}

interface AdminUser {
  id: string
  email: string
  name: string
  adminRole: string
  language: string
}

interface Household {
  id: string
  name: string
  memberCount: number
}

interface FilterOptions {
  householdId: string
  userId: string
  categoryId: string
  roomId: string
  timeRange: '7d' | '30d' | '90d' | '1y'
}

export default function AdminAnalyticsPage() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [households, setHouseholds] = useState<Household[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all')
  const [filters, setFilters] = useState<FilterOptions>({
    householdId: 'all',
    userId: 'all',
    categoryId: 'all',
    roomId: 'all',
    timeRange: '7d'
  })

  useEffect(() => {
    loadAnalytics()
  }, [filters])

  const loadAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      // Build query parameters for filtering
      const params = new URLSearchParams()
      if (filters.householdId !== 'all') params.append('householdId', filters.householdId)
      if (filters.userId !== 'all') params.append('userId', filters.userId)
      if (filters.categoryId !== 'all') params.append('categoryId', filters.categoryId)
      if (filters.roomId !== 'all') params.append('roomId', filters.roomId)
      params.append('timeRange', filters.timeRange)
      
      const [statsRes, rolesRes, householdsRes] = await Promise.all([
        fetch(`/api/admin/stats?${params.toString()}`),
        fetch('/api/admin/roles'),
        fetch('/api/admin/households')
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
      
      if (householdsRes.ok) {
        const householdsData = await householdsRes.json()
        setHouseholds(householdsData.households || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getLineChartData = () => {
    if (!data?.perDay) return null
    
    const entries = Object.entries(data.perDay).sort(([a], [b]) => a.localeCompare(b))
    
    return {
      labels: entries.map(([date]) => new Date(date).toLocaleDateString()),
      datasets: [
        {
          label: 'Daily Activity',
          data: entries.map(([, value]) => value),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
        },
      ],
    }
  }

  const getBarChartData = () => {
    if (!data?.perHour) return null
    
    const entries = Object.entries(data.perHour).sort(([a], [b]) => a.localeCompare(b))
    
    return {
      labels: entries.map(([hour]) => {
        try {
          if (hour.includes('T')) {
            const date = new Date(hour + ':00:00.000Z')
            return date.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })
          }
          return hour
        } catch {
          return hour
        }
      }),
      datasets: [
        {
          label: 'Hourly Activity',
          data: entries.map(([, value]) => value),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
      ],
    }
  }

  const getPieChartData = (data: Record<string, number>, title: string) => {
    if (!data || Object.keys(data).length === 0) return null
    
    const entries = Object.entries(data)
    const colors = [
      '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
      '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
    ]
    
    return {
      labels: entries.map(([key]) => key),
      datasets: [
        {
          label: title,
          data: entries.map(([, value]) => value),
          backgroundColor: colors.slice(0, entries.length),
          borderColor: colors.slice(0, entries.length).map(color => color.replace('0.8', '1')),
          borderWidth: 2,
        },
      ],
    }
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
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
            <h1 className="text-3xl font-bold text-gray-900">{t('adminAnalytics')}</h1>
            <p className="text-gray-600 mt-1">{t('adminAnalyticsDescription')}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as any }))}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Household</label>
            <select
              value={filters.householdId}
              onChange={(e) => setFilters(prev => ({ ...prev, householdId: e.target.value }))}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
            >
              <option value="all">All Households</option>
              {households.map(household => (
                <option key={household.id} value={household.id}>
                  {household.name} ({household.memberCount} members)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select
              value={filters.userId}
              onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
            >
              <option value="all">All Users</option>
              {adminUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value }))}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
            >
              <option value="all">All Categories</option>
              {/* Categories will be populated from API */}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
            <select
              value={filters.roomId}
              onChange={(e) => setFilters(prev => ({ ...prev, roomId: e.target.value }))}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
            >
              <option value="all">All Rooms</option>
              {/* Rooms will be populated from API */}
            </select>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">{t('adminTotalUsers')}</dt>
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
            {t('adminRolesLanguages')}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Daily Activity Line Chart */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              <CalendarIcon className="h-5 w-5 inline mr-2" />
              Activity Trends (Line Chart)
            </h3>
            {getLineChartData() ? (
              <Line data={getLineChartData()!} options={chartOptions} />
            ) : (
              <p className="text-gray-500 text-center py-8">No activity data available</p>
            )}
          </div>
        </div>

        {/* Hourly Activity Bar Chart */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              <ClockIcon className="h-5 w-5 inline mr-2" />
              Hourly Activity (Bar Chart)
            </h3>
            {getBarChartData() ? (
              <Bar data={getBarChartData()!} options={chartOptions} />
            ) : (
              <p className="text-gray-500 text-center py-8">No activity data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Items by Category */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              <CubeIcon className="h-5 w-5 inline mr-2" />
              Items by Category
            </h3>
            {data?.itemsByCategory && getPieChartData(data.itemsByCategory, 'Items by Category') ? (
              <Pie data={getPieChartData(data.itemsByCategory, 'Items by Category')!} options={pieChartOptions} />
            ) : (
              <p className="text-gray-500 text-center py-8">No category data available</p>
            )}
          </div>
        </div>

        {/* Items by Room */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              <HomeIcon className="h-5 w-5 inline mr-2" />
              Items by Room
            </h3>
            {data?.itemsByRoom && getPieChartData(data.itemsByRoom, 'Items by Room') ? (
              <Pie data={getPieChartData(data.itemsByRoom, 'Items by Room')!} options={pieChartOptions} />
            ) : (
              <p className="text-gray-500 text-center py-8">No room data available</p>
            )}
          </div>
        </div>

        {/* Users by Household */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              <UserGroupIcon className="h-5 w-5 inline mr-2" />
              Users by Household
            </h3>
            {data?.usersByHousehold && getPieChartData(data.usersByHousehold, 'Users by Household') ? (
              <Pie data={getPieChartData(data.usersByHousehold, 'Users by Household')!} options={pieChartOptions} />
            ) : (
              <p className="text-gray-500 text-center py-8">No household data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

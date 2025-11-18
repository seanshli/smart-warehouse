'use client'
// 活動記錄組件
// 顯示倉庫中的所有操作活動，包括物品創建、移動、更新等

import { useState, useEffect } from 'react'
import { ClockIcon, UserIcon, ArrowRightIcon, PlusIcon, PencilIcon, ArrowsRightLeftIcon, ShoppingCartIcon, HomeIcon, XMarkIcon, FolderIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useLanguage } from './LanguageProvider'
import { useHousehold } from './HouseholdProvider'

// 活動介面定義
interface Activity {
  id: string // 活動 ID
  action: string // 操作類型
  description: string // 操作描述
  createdAt: string // 創建時間
  performer: {
    name: string // 執行者名稱
    email: string // 執行者電子郵件
  }
  item?: {
    id: string // 相關物品 ID
    name: string // 相關物品名稱
  }
  oldRoom?: {
    name: string // 舊房間名稱
  }
  newRoom?: {
    name: string // 新房間名稱
  }
  oldCabinet?: {
    name: string // 舊櫃子名稱
  }
  newCabinet?: {
    name: string // 新櫃子名稱
  }
}

// 活動組件屬性介面
interface ActivitiesProps {
  timeFilter?: 'today' | 'week' | 'all' // 時間篩選器
}

export default function Activities({ timeFilter = 'all' }: ActivitiesProps) {
  const { t, currentLanguage } = useLanguage() // 語言設定
  const { household } = useHousehold() // 當前家庭
  const [activities, setActivities] = useState<Activity[]>([]) // 活動列表
  const [loading, setLoading] = useState(true) // 載入狀態

  useEffect(() => {
    fetchActivities() // 初始載入活動列表
  }, [])

  // 當語言、時間篩選器或家庭變更時重新獲取活動
  useEffect(() => {
    fetchActivities()
  }, [currentLanguage, timeFilter, household?.id])

  // 獲取活動列表
  const fetchActivities = async () => {
    try {
      setLoading(true)
      
      // 重要：等待家庭載入完成後再獲取活動
      if (!household?.id) {
        console.log('Activities: Waiting for household to load, skipping fetch')
        setLoading(false)
        setActivities([])
        return
      }
      
      const params = new URLSearchParams()
      params.append('timeFilter', timeFilter) // 時間篩選器
      params.append('householdId', household.id) // 始終包含家庭 ID
      
      const url = `/api/activities?${params.toString()}`
      console.log('Activities: Fetching from URL:', url)
      console.log('Activities: Active household:', household.id, household.name)
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      } else {
        console.error('Failed to fetch activities')
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  // 根據操作類型獲取對應的圖示
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': // 創建
        return <PlusIcon className="h-4 w-4" />
      case 'moved': // 移動
        return <ArrowsRightLeftIcon className="h-4 w-4" />
      case 'quantity_updated': // 數量更新
        return <PencilIcon className="h-4 w-4" />
      case 'updated': // 更新
        return <PencilIcon className="h-4 w-4" />
      case 'room_created': // 房間創建
        return <HomeIcon className="h-4 w-4" />
      case 'room_deleted': // 房間刪除
        return <XMarkIcon className="h-4 w-4" />
      case 'category_created':
        return <FolderIcon className="h-4 w-4" />
      case 'category_deleted':
        return <TrashIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 text-green-800'
      case 'moved':
        return 'bg-blue-100 text-blue-800'
      case 'quantity_updated':
        return 'bg-yellow-100 text-yellow-800'
      case 'updated':
        return 'bg-purple-100 text-purple-800'
      case 'room_created':
        return 'bg-indigo-100 text-indigo-800'
      case 'room_deleted':
        return 'bg-red-100 text-red-800'
      case 'category_created':
        return 'bg-teal-100 text-teal-800'
      case 'category_deleted':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
    if (diffMinutes < 60) return `${diffMinutes}${t('minutesAgo')}`
    if (diffHours < 24) return `${diffHours}${t('hoursAgo')}`
    if (diffDays < 7) return `${diffDays}${t('daysAgo')}`
    
    return date.toLocaleDateString()
  }

  const getActionText = (action: string) => {
    switch (action) {
      case 'created':
      case 'item_added':
        return t('itemAdded')
      case 'moved':
      case 'item_moved':
        return t('itemMoved')
      case 'quantity_updated':
        return t('quantityUpdated')
      case 'updated':
        return t('updated')
      case 'room_created':
        return t('roomCreated')
      case 'room_deleted':
        return t('roomDeleted')
      case 'category_created':
        return t('categoryCreated')
      case 'category_deleted':
        return t('categoryDeleted')
      case 'test_activity':
        return t('testActivity')
      default:
        return action.replace('_', ' ')
    }
  }

  const getActivityDescription = (activity: Activity) => {
    // Always use the stored description from the database
    // This allows for dynamic content like item names, room names, etc.
    return activity.description
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{t('recentActivity')}</h2>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('recentActivity')}</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchActivities}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ClockIcon className="h-4 w-4 mr-2" />
            {t('refresh')}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        {activities.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      {getActionIcon(activity.action)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}>
                          {getActionText(activity.action)}
                        </span>
                        {activity.item && (
                          <span className="text-sm font-medium text-gray-900">
                            {activity.item?.name || 'Unknown Item'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {formatDate(activity.createdAt)}
                      </div>
                    </div>
                    
                    <p className="mt-2 text-sm text-gray-600">
                      {getActivityDescription(activity)}
                    </p>
                    
                    {/* Show location changes for move actions */}
                    {activity.action === 'moved' && (activity.oldRoom || activity.newRoom) && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        {activity.oldRoom && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-800">
                            {activity.oldRoom.name}
                            {activity.oldCabinet && ` → ${activity.oldCabinet.name}`}
                          </span>
                        )}
                        {(activity.oldRoom || activity.oldCabinet) && (activity.newRoom || activity.newCabinet) && (
                          <ArrowRightIcon className="h-4 w-4 mx-2 text-gray-400" />
                        )}
                        {activity.newRoom && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800">
                            {activity.newRoom.name}
                            {activity.newCabinet && ` → ${activity.newCabinet.name}`}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <UserIcon className="h-3 w-3 mr-1" />
                      & {activity.performer?.name || activity.performer?.email || 'demo'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noActivities')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('activitiesWillAppearHere')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

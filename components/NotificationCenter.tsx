'use client'
// 通知中心組件
// 顯示和管理倉庫相關的通知，包括低庫存警告、物品變更通知等

import { useState, useEffect } from 'react'
import { BellIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useHousehold } from './HouseholdProvider'

// 通知介面定義
interface Notification {
  id: string // 通知 ID
  type: 'LOW_INVENTORY' | 'ITEM_ADDED' | 'ITEM_UPDATED' | 'SYSTEM' // 通知類型
  title: string // 通知標題
  message: string // 通知訊息
  read: boolean // 是否已讀
  createdAt: string // 創建時間
  item?: {
    name: string // 相關物品名稱
  }
}

export default function NotificationCenter() {
  const { household } = useHousehold() // 當前家庭
  const [notifications, setNotifications] = useState<Notification[]>([]) // 通知列表
  const [isLoading, setIsLoading] = useState(true) // 載入狀態

  useEffect(() => {
    fetchNotifications() // 載入通知列表
  }, [household?.id])

  // 獲取通知列表
  const fetchNotifications = async () => {
    try {
      // 重要：等待家庭載入完成後再獲取通知
      if (!household?.id) {
        console.log('NotificationCenter: Waiting for household to load, skipping fetch')
        setNotifications([])
        return
      }
      
      const params = new URLSearchParams()
      params.append('householdId', household.id) // 始終包含家庭 ID
      
      const url = `/api/notifications${params.toString() ? '?' + params.toString() : ''}`
      console.log('NotificationCenter: Fetching from URL:', url)
      console.log('NotificationCenter: Active household:', household.id, household.name)
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 標記單個通知為已讀
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true }), // 標記為已讀
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        )
      }
    } catch (error) {
      toast.error('Failed to mark notification as read')
    }
  }

  // 標記所有通知為已讀
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, read: true })) // 將所有通知標記為已讀
        )
        toast.success('All notifications marked as read')
      }
    } catch (error) {
      toast.error('Failed to mark all notifications as read')
    }
  }

  // 根據通知類型獲取對應的圖示
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LOW_INVENTORY': // 低庫存
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'ITEM_ADDED': // 物品已添加
      case 'ITEM_UPDATED':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'LOW_INVENTORY':
        return 'border-l-red-500 bg-red-50'
      case 'ITEM_ADDED':
        return 'border-l-green-500 bg-green-50'
      case 'ITEM_UPDATED':
        return 'border-l-blue-500 bg-blue-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {unreadCount} unread
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border-l-4 p-4 rounded-r-lg ${
                notification.read 
                  ? 'bg-white border-gray-200' 
                  : getNotificationColor(notification.type)
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-medium ${
                      notification.read ? 'text-gray-900' : 'text-gray-900'
                    }`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-primary-600 hover:text-primary-800"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={`mt-1 text-sm ${
                    notification.read ? 'text-gray-600' : 'text-gray-700'
                  }`}>
                    {notification.message}
                  </p>
                  {notification.item && (
                    <p className="mt-1 text-xs text-gray-500">
                      Item: {notification.item?.name || 'Unknown Item'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
          <p className="mt-1 text-sm text-gray-500">
            You're all caught up! Notifications will appear here when items are running low or other important events occur.
          </p>
        </div>
      )}
    </div>
  )
}



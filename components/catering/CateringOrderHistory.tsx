'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  subtotal: number
  menuItem: {
    id: string
    name: string
    imageUrl?: string
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  deliveryType: string
  scheduledTime?: string
  totalAmount: number
  notes?: string
  orderedAt: string
  confirmedAt?: string
  preparedAt?: string
  deliveredAt?: string
  cancelledAt?: string
  items: OrderItem[]
}

interface CateringOrderHistoryProps {
  householdId: string
}

export default function CateringOrderHistory({ householdId }: CateringOrderHistoryProps) {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [householdId])

  const loadOrders = async () => {
    try {
      const response = await fetch(`/api/catering/orders?householdId=${householdId}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'ready':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      submitted: '已提交',
      accepted: '已接受',
      preparing: '準備中',
      ready: '已就緒',
      delivered: '已送達',
      closed: '已完成',
      cancelled: '已取消',
      pending: '待處理',
      confirmed: '已確認',
    }
    return statusMap[status] || status
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">訂單歷史 (Order History)</h2>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">尚無訂單</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">您的訂單將顯示在這裡</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => router.push(`/catering/orders/${order.id}`)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    訂單 #{order.orderNumber}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(order.orderedAt)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>

              {/* Workflow Progress */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 text-xs">
                  <div className={`flex items-center ${['submitted', 'accepted', 'preparing', 'ready', 'delivered', 'closed'].includes(order.status) ? 'text-blue-600' : 'text-gray-400'}`}>
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    <span>已提交</span>
                  </div>
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <div className={`flex items-center ${['accepted', 'preparing', 'ready', 'delivered', 'closed'].includes(order.status) ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    <span>已接受</span>
                  </div>
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <div className={`flex items-center ${['preparing', 'ready', 'delivered', 'closed'].includes(order.status) ? 'text-yellow-600' : 'text-gray-400'}`}>
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>準備中</span>
                  </div>
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <div className={`flex items-center ${['ready', 'delivered', 'closed'].includes(order.status) ? 'text-purple-600' : 'text-gray-400'}`}>
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    <span>已就緒</span>
                  </div>
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <div className={`flex items-center ${['delivered', 'closed'].includes(order.status) ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    <span>已送達</span>
                  </div>
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <div className={`flex items-center ${order.status === 'closed' ? 'text-gray-600' : 'text-gray-400'}`}>
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    <span>已完成</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </p>
                    {order.deliveryType === 'scheduled' && order.scheduledTime && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        預約時間: {formatDate(order.scheduledTime)}
                      </p>
                    )}
                  </div>
                  <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                    ${parseFloat(order.totalAmount.toString()).toFixed(2)} 台幣
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

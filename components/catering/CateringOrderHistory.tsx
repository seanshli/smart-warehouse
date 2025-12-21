'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

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
  items: OrderItem[]
}

export default function CateringOrderHistory({ householdId }: { householdId: string }) {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  useEffect(() => {
    loadOrders()
  }, [householdId, selectedStatus])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('householdId', householdId)
      if (selectedStatus) params.append('status', selectedStatus)

      const response = await fetch(`/api/catering/orders?${params.toString()}`)
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'preparing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'ready':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircleIcon className="h-5 w-5" />
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5" />
      default:
        return <ClockIcon className="h-5 w-5" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Order History</h2>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/catering/orders/${order.id}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Order #{order.orderNumber}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(order.orderedAt)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {order.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    {item.menuItem.imageUrl && (
                      <div className="relative h-12 w-12 flex-shrink-0">
                        <Image
                          src={item.menuItem.imageUrl}
                          alt={item.menuItem.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                    <span className="flex-1 text-gray-700 dark:text-gray-300">
                      {item.menuItem.name} × {item.quantity}
                    </span>
                    <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    +{order.items.length - 3} more items
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {order.deliveryType === 'scheduled' && order.scheduledTime && (
                    <span>
                      Scheduled: {formatDate(order.scheduledTime)}
                    </span>
                  )}
                  {order.deliveryType === 'immediate' && (
                    <span>Immediate delivery</span>
                  )}
                </div>
                <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  ${parseFloat(order.totalAmount.toString()).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

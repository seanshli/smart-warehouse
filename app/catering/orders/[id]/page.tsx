'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeftIcon, XCircleIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
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
    description?: string
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
  workgroup?: {
    id: string
    name: string
  }
}

export default function CateringOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!params.id) return
    let cancelled = false
    
    const loadOrder = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/catering/orders/${params.id}`, {
          credentials: 'include',
        })
        
        if (cancelled) return
        
        if (response.ok) {
          const data = await response.json()
          if (!cancelled) {
            setOrder(data)
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Order not found' }))
          console.error('Error loading order:', errorData)
          if (!cancelled) {
            toast.error(errorData.error || 'Order not found')
            setTimeout(() => {
              if (!cancelled) {
                router.push('/catering/orders')
              }
            }, 1000)
          }
        }
      } catch (error) {
        if (cancelled) return
        console.error('Error loading order:', error)
        toast.error('Failed to load order. Please try again.')
        setTimeout(() => {
          if (!cancelled) {
            router.push('/catering/orders')
          }
        }, 1000)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    
    loadOrder()
    
    return () => {
      cancelled = true
    }
  }, [params.id, router])

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return

    setCancelling(true)
    try {
      const response = await fetch(`/api/catering/orders/${params.id}/cancel`, {
        method: 'PUT',
        credentials: 'include',
      })

      if (response.ok) {
        const cancelledOrder = await response.json()
        setOrder(cancelledOrder)
        toast.success('Order cancelled successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to cancel order')
      }
    } catch (error) {
      toast.error('Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const canCancel = order && ['pending', 'submitted', 'accepted'].includes(order.status)

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        Back to Orders
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Order #{order.orderNumber}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Placed on {formatDate(order.orderedAt)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              order.status === 'delivered' || order.status === 'closed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              order.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              order.status === 'submitted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              order.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              order.status === 'ready' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
              {order.status === 'submitted' ? '已提交' :
               order.status === 'accepted' ? '已接受' :
               order.status === 'preparing' ? '準備中' :
               order.status === 'ready' ? '已就緒' :
               order.status === 'delivered' ? '已送達' :
               order.status === 'closed' ? '已完成' :
               order.status === 'cancelled' ? '已取消' :
               order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50"
              >
                <XCircleIcon className="h-5 w-5" />
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>

        {/* Workflow Progress */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">訂單流程 (Order Workflow)</h2>
            <a
              href="/admin/maintenance"
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
            >
              工單派遣 (Work Order Dispatch)
            </a>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <div className={`flex items-center ${['submitted', 'accepted', 'preparing', 'ready', 'delivered', 'closed'].includes(order.status) ? 'text-blue-600' : 'text-gray-400'}`}>
              <CheckCircleIcon className="h-5 w-5 mr-1" />
              <span>已提交</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className={`flex items-center ${['accepted', 'preparing', 'ready', 'delivered', 'closed'].includes(order.status) ? 'text-green-600' : 'text-gray-400'}`}>
              <CheckCircleIcon className="h-5 w-5 mr-1" />
              <span>已接受</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className={`flex items-center ${['preparing', 'ready', 'delivered', 'closed'].includes(order.status) ? 'text-yellow-600' : 'text-gray-400'}`}>
              <ClockIcon className="h-5 w-5 mr-1" />
              <span>準備中</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className={`flex items-center ${['ready', 'delivered', 'closed'].includes(order.status) ? 'text-purple-600' : 'text-gray-400'}`}>
              <CheckCircleIcon className="h-5 w-5 mr-1" />
              <span>已就緒</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className={`flex items-center ${['delivered', 'closed'].includes(order.status) ? 'text-green-600' : 'text-gray-400'}`}>
              <CheckCircleIcon className="h-5 w-5 mr-1" />
              <span>已送達</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className={`flex items-center ${order.status === 'closed' ? 'text-gray-600' : 'text-gray-400'}`}>
              <CheckCircleIcon className="h-5 w-5 mr-1" />
              <span>已完成</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h2 className="text-lg font-semibold mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4">
                {item.menuItem.imageUrl && (
                  <div className="relative h-20 w-20 flex-shrink-0">
                    <Image
                      src={item.menuItem.imageUrl}
                      alt={item.menuItem.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {item.menuItem.name}
                  </h3>
                  {item.menuItem.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.menuItem.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Quantity: {item.quantity} × ${parseFloat(item.unitPrice?.toString() || '0').toFixed(2)}
                  </p>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${parseFloat(item.subtotal?.toString() || '0').toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="space-y-2">
            {order.workgroup && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">工作組 (Workgroup)</span>
                <span className="font-medium">
                  {order.workgroup.name}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Delivery Type</span>
              <span className="font-medium">
                {order.deliveryType === 'scheduled' ? 'Scheduled (預約)' : 'Immediate'}
              </span>
            </div>
            {order.scheduledTime && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Scheduled Time</span>
                <span className="font-medium">{formatDate(order.scheduledTime)}</span>
              </div>
            )}
            {order.notes && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Special Instructions</span>
                <p className="mt-1 text-gray-900 dark:text-white">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex justify-between items-center">
            <span className="text-xl font-semibold text-gray-900 dark:text-white">Total</span>
            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              ${parseFloat(order.totalAmount.toString()).toFixed(2)}
            </span>
          </div>
        </div>

        {order.status === 'cancelled' && order.cancelledAt && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cancelled on {formatDate(order.cancelledAt)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

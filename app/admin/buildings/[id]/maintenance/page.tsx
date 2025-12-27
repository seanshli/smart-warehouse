'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/components/LanguageProvider'
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  HomeIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface MaintenanceTicket {
  id: string
  ticketNumber: string
  title: string
  description?: string
  category: string
  priority: string
  status: string
  routingType?: string
  household: {
    id: string
    name: string
    apartmentNo?: string
  }
  requestedBy: {
    id: string
    name: string
    email: string
  }
  assignedCrew?: {
    id: string
    name: string
  }
  assignedSupplier?: {
    id: string
    name: string
  }
  requestedAt: string
}

interface CateringOrder {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  deliveryType: string
  orderedAt: string
  household: {
    id: string
    name: string
  }
  items: Array<{
    menuItem: {
      name: string
    }
    quantity: number
  }>
}

interface UnifiedWorkOrder {
  id: string
  type: 'maintenance' | 'catering'
  number: string
  title: string
  description?: string
  status: string
  category?: string
  priority?: string
  household: {
    id: string
    name: string
  }
  requestedAt: string
  assignedTo?: string
  ticket?: MaintenanceTicket
  order?: CateringOrder
}

export default function BuildingMaintenancePage() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const params = useParams()
  const buildingId = params?.id as string
  const [building, setBuilding] = useState<any>(null)
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([])
  const [orders, setOrders] = useState<CateringOrder[]>([])
  const [unifiedWorkOrders, setUnifiedWorkOrders] = useState<UnifiedWorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  useEffect(() => {
    if (buildingId) {
      fetchBuilding()
      fetchWorkOrders()
    }
  }, [buildingId, selectedStatus])

  const fetchBuilding = async () => {
    try {
      const response = await fetch(`/api/admin/buildings/${buildingId}`)
      if (response.ok) {
        const data = await response.json()
        setBuilding(data.building)
      }
    } catch (error) {
      console.error('Error fetching building:', error)
    }
  }

  const fetchWorkOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ 
        admin: 'true',
        buildingId: buildingId 
      })
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

      // Fetch both maintenance tickets and catering orders
      const [ticketsRes, ordersRes] = await Promise.all([
        fetch(`/api/maintenance/tickets?${params.toString()}`),
        fetch(`/api/catering/orders?${params.toString()}`)
      ])

      if (!ticketsRes.ok) throw new Error('Failed to fetch tickets')
      if (!ordersRes.ok) throw new Error('Failed to fetch orders')

      const ticketsData = await ticketsRes.json()
      const ordersData = await ordersRes.json()

      setTickets(ticketsData.tickets || [])
      setOrders(ordersData.orders || [])

      // Combine into unified work orders
      const unified: UnifiedWorkOrder[] = [
        ...(ticketsData.tickets || []).map((ticket: MaintenanceTicket) => ({
          id: ticket.id,
          type: 'maintenance' as const,
          number: ticket.ticketNumber,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          category: ticket.category,
          priority: ticket.priority,
          household: ticket.household,
          requestedAt: ticket.requestedAt,
          assignedTo: ticket.assignedCrew?.name || ticket.assignedSupplier?.name,
          ticket,
        })),
        ...(ordersData.orders || []).map((order: CateringOrder) => ({
          id: order.id,
          type: 'catering' as const,
          number: order.orderNumber,
          title: `叫餐訂單 - ${order.items.map(i => `${i.menuItem.name} x${i.quantity}`).join(', ')}`,
          description: `總金額: $${order.totalAmount.toFixed(2)} | 配送方式: ${order.deliveryType === 'immediate' ? '立即送達' : order.deliveryType === 'scheduled' ? '預約送達' : '餐廳內用'}`,
          status: order.status,
          household: order.household,
          requestedAt: order.orderedAt,
          order,
        })),
      ].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())

      setUnifiedWorkOrders(unified)
    } catch (error: any) {
      console.error('Error fetching work orders:', error)
      toast.error('Failed to load work orders')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !building) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{t('loading') || 'Loading...'}</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Link
              href="/admin/buildings"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              建築物列表
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-sm font-medium text-gray-900">
              {building?.name || 'Building'} - 工單管理
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {building?.name || 'Building'} - 工單管理
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {building?.community?.name && `所屬社區: ${building.community.name}`}
          </p>
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
        >
          <option value="all">{t('all') || 'All'}</option>
          <option value="PENDING_EVALUATION">{t('pendingEvaluation') || 'Pending Evaluation'}</option>
          <option value="submitted">{'已提交'}</option>
          <option value="EVALUATED">{t('evaluated') || 'Evaluated'}</option>
          <option value="ASSIGNED">{t('assigned') || 'Assigned'}</option>
          <option value="IN_PROGRESS">{t('inProgress') || 'In Progress'}</option>
          <option value="preparing">{'準備中'}</option>
        </select>
      </div>

      {unifiedWorkOrders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {selectedStatus !== 'all'
              ? `目前沒有狀態為「${selectedStatus}」的工單`
              : '目前沒有工單'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {unifiedWorkOrders.map((workOrder) => {
            const getStatusColor = (status: string, type: 'maintenance' | 'catering') => {
              if (type === 'catering') {
                switch (status) {
                  case 'submitted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  case 'accepted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  case 'preparing': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  case 'ready': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                  case 'delivered':
                  case 'closed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }
              }
              return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }
            
            const getStatusLabel = (status: string, type: 'maintenance' | 'catering') => {
              if (type === 'catering') {
                const labels: Record<string, string> = {
                  submitted: '已提交',
                  accepted: '已接受',
                  preparing: '準備中',
                  ready: '已就緒',
                  delivered: '已送達',
                  closed: '已完成',
                  cancelled: '已取消',
                }
                return labels[status] || status
              }
              return status.replace(/_/g, ' ')
            }
            
            return (
              <div
                key={workOrder.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  if (workOrder.type === 'catering' && workOrder.order) {
                    window.location.href = `/catering/orders/${workOrder.order.id}`
                  } else if (workOrder.type === 'maintenance' && workOrder.ticket) {
                    window.location.href = `/admin/maintenance?ticketId=${workOrder.ticket.id}`
                  }
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mr-2">
                      {workOrder.type === 'catering' ? '叫餐' : '報修'}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {workOrder.number}
                    </span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(workOrder.status, workOrder.type)}`}>
                      {getStatusLabel(workOrder.status, workOrder.type)}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  {workOrder.title}
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>{t('household')}: {workOrder.household.name}</p>
                  {workOrder.category && (
                    <p>{t('category')}: {workOrder.category.replace(/_/g, ' ')}</p>
                  )}
                  {workOrder.priority && (
                    <p>{t('priority')}: {workOrder.priority}</p>
                  )}
                  {workOrder.assignedTo && (
                    <p>{'指派給'}: {workOrder.assignedTo}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}

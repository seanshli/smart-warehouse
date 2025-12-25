'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/components/LanguageProvider'
import { useHousehold } from '@/components/HouseholdProvider'
import { 
  ExclamationTriangleIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import FrontDeskChatButton from './FrontDeskChatButton'
import TicketRequestForm from './TicketRequestForm'
import toast from 'react-hot-toast'

interface MaintenanceTicket {
  id: string
  ticketNumber: string
  title: string
  description?: string
  category: string
  priority: string
  location?: string
  status: string
  routingType?: string
  requestedAt: string
  assignedCrew?: {
    id: string
    name: string
  }
  assignedSupplier?: {
    id: string
    name: string
  }
  _count?: {
    workLogs: number
    signoffs: number
  }
}

interface CateringOrder {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  deliveryType: string
  orderedAt: string
  items: Array<{
    menuItem: {
      name: string
    }
    quantity: number
  }>
  workgroup?: {
    id: string
    name: string
  }
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
  requestedAt: string
  assignedTo?: string
  ticket?: MaintenanceTicket
  order?: CateringOrder
}

export default function TicketList() {
  const { t } = useLanguage()
  const { household } = useHousehold()
  const { data: session } = useSession()
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([])
  const [orders, setOrders] = useState<CateringOrder[]>([])
  const [unifiedWorkOrders, setUnifiedWorkOrders] = useState<UnifiedWorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  useEffect(() => {
    if (household?.id) {
      fetchWorkOrders()
    }
  }, [household?.id, selectedStatus])

  const fetchWorkOrders = async () => {
    if (!household?.id) return

    setLoading(true)
    try {
      // Fetch both maintenance tickets and catering orders
      const params = new URLSearchParams({ householdId: household.id })
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

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
          requestedAt: order.orderedAt,
          assignedTo: order.workgroup?.name,
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

  const getStatusColor = (status: string, type: 'maintenance' | 'catering') => {
    if (type === 'catering') {
      switch (status) {
        case 'submitted':
          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        case 'accepted':
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        case 'preparing':
          return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
        case 'ready':
          return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
        case 'delivered':
        case 'closed':
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        case 'cancelled':
          return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        default:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      }
    }
    
    // Maintenance ticket statuses
    switch (status) {
      case 'PENDING_EVALUATION':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'EVALUATED':
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'WORK_COMPLETED':
      case 'SIGNED_OFF_BY_CREW':
      case 'SIGNED_OFF_BY_SUPPLIER':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
      case 'SIGNED_OFF_BY_HOUSEHOLD':
      case 'CLOSED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string, type: 'maintenance' | 'catering') => {
    if (type === 'catering') {
      if (status === 'closed' || status === 'delivered') {
        return CheckCircleIcon
      }
      if (status === 'cancelled') {
        return XCircleIcon
      }
      if (status === 'preparing' || status === 'ready') {
        return ClockIcon
      }
      return ExclamationTriangleIcon
    }
    
    // Maintenance
    if (status.includes('SIGNED_OFF') || status === 'CLOSED') {
      return CheckCircleIcon
    }
    if (status === 'CANCELLED') {
      return XCircleIcon
    }
    if (status === 'IN_PROGRESS' || status === 'WORK_COMPLETED') {
      return ClockIcon
    }
    return ExclamationTriangleIcon
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
  
  const handleWorkOrderClick = (workOrder: UnifiedWorkOrder) => {
    if (workOrder.type === 'catering' && workOrder.order) {
      window.location.href = `/catering/orders/${workOrder.order.id}`
    } else if (workOrder.type === 'maintenance' && workOrder.ticket) {
      // Navigate to ticket detail or open chat
      // For now, just open chat
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-600 dark:text-red-400'
      case 'HIGH':
        return 'text-orange-600 dark:text-orange-400'
      case 'NORMAL':
        return 'text-blue-600 dark:text-blue-400'
      case 'LOW':
        return 'text-gray-600 dark:text-gray-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{t('loading') || 'Loading...'}</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {'工單'} ({t('maintenanceTickets')} & {'叫餐訂單'})
        </h2>
        <div className="flex items-center space-x-2">
          <FrontDeskChatButton />
          <button
            onClick={() => setShowRequestForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            {t('createTicket')}
          </button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">{t('filter')}:</span>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
        >
          <option value="all">{t('all') || 'All'}</option>
          <option value="PENDING_EVALUATION">{t('pendingEvaluation') || 'Pending Evaluation'}</option>
          <option value="submitted">{'已提交'}</option>
          <option value="EVALUATED">{t('evaluated') || 'Evaluated'}</option>
          <option value="ASSIGNED">{t('assigned') || 'Assigned'}</option>
          <option value="IN_PROGRESS">{t('inProgress') || 'In Progress'}</option>
          <option value="preparing">{'準備中'}</option>
          <option value="WORK_COMPLETED">{t('workCompleted')}</option>
          <option value="CLOSED">{t('closed')}</option>
        </select>
      </div>

      {/* Unified work orders list */}
      {unifiedWorkOrders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {'沒有工單'}
          </p>
          <button
            onClick={() => setShowRequestForm(true)}
            className="mt-4 text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {t('createFirstTicket')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {unifiedWorkOrders.map((workOrder) => {
            const StatusIcon = getStatusIcon(workOrder.status, workOrder.type)
            return (
              <div
                key={workOrder.id}
                onClick={() => handleWorkOrderClick(workOrder)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {workOrder.type === 'catering' ? '叫餐' : '報修'}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {workOrder.number}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(workOrder.status, workOrder.type)}`}>
                        {getStatusLabel(workOrder.status, workOrder.type)}
                      </span>
                      {workOrder.priority && (
                        <span className={`text-xs font-medium ${getPriorityColor(workOrder.priority)}`}>
                          {workOrder.priority}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      {workOrder.title}
                    </h3>
                    {workOrder.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {workOrder.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      {workOrder.category && (
                        <span>{t('category') || 'Category'}: {workOrder.category.replace(/_/g, ' ')}</span>
                      )}
                      {workOrder.assignedTo && (
                        <span>{'指派給'}: {workOrder.assignedTo}</span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {t('requested')}: {new Date(workOrder.requestedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {workOrder.type === 'maintenance' && workOrder.ticket && (
                      <FrontDeskChatButton ticketId={workOrder.ticket.id} />
                    )}
                    <StatusIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Request form modal */}
      {showRequestForm && (
        <TicketRequestForm
          isOpen={showRequestForm}
          onClose={() => setShowRequestForm(false)}
          onSuccess={() => {
            fetchWorkOrders()
            setShowRequestForm(false)
          }}
        />
      )}
    </div>
  )
}

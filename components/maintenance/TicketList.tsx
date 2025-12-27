'use client'

import { useState, useEffect, useCallback } from 'react'
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
  status: string // Original status from database
  normalizedStatus?: 'pending' | 'in_progress' | 'completed' | 'cancelled' // Normalized status for filtering
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
  
  // Helper function to safely get translations with fallback
  const getTranslation = (key: string, fallback: string): string => {
    try {
      const result = (t as any)(key)
      if (typeof result === 'string' && result !== key) {
        return result
      }
    } catch (e) {
      // Ignore translation errors
    }
    return fallback
  }

  // Normalize status to common status categories across all order types
  const normalizeStatus = useCallback((status: string, type: 'maintenance' | 'catering'): 'pending' | 'in_progress' | 'completed' | 'cancelled' => {
    const statusLower = status.toLowerCase()
    
    // Cancelled status (same for both)
    if (statusLower === 'cancelled') {
      return 'cancelled'
    }
    
    if (type === 'maintenance') {
      // Maintenance pending statuses
      if (statusLower === 'pending_evaluation' || statusLower === 'open' || statusLower === 'pending') {
        return 'pending'
      }
      // Maintenance in-progress statuses
      if (statusLower === 'evaluated' || statusLower === 'assigned' || statusLower === 'in_progress' || 
          statusLower === 'work_completed' || statusLower === 'signed_off_by_crew' || statusLower === 'signed_off_by_supplier') {
        return 'in_progress'
      }
      // Maintenance completed statuses
      if (statusLower === 'closed' || statusLower === 'signed_off_by_household' || statusLower === 'resolved') {
        return 'completed'
      }
    } else {
      // Catering pending statuses
      if (statusLower === 'submitted' || statusLower === 'accepted') {
        return 'pending'
      }
      // Catering in-progress statuses
      if (statusLower === 'preparing' || statusLower === 'ready') {
        return 'in_progress'
      }
      // Catering completed statuses
      if (statusLower === 'delivered' || statusLower === 'closed') {
        return 'completed'
      }
    }
    
    // Default fallback
    return 'pending'
  }, [])

  // Get normalized status label for display (consistent across all types)
  const getNormalizedStatusLabel = (normalizedStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled'): string => {
    const labels: Record<string, string> = {
      'pending': getTranslation('pending', '待處理'),
      'in_progress': getTranslation('inProgress', '處理中'),
      'completed': getTranslation('completed', '已完成'),
      'cancelled': getTranslation('cancelled', '已取消'),
    }
    return labels[normalizedStatus] || normalizedStatus
  }

  // Get normalized status color (consistent across all types)
  const getNormalizedStatusColor = (normalizedStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled'): string => {
    switch (normalizedStatus) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([])
  const [orders, setOrders] = useState<CateringOrder[]>([])
  const [unifiedWorkOrders, setUnifiedWorkOrders] = useState<UnifiedWorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<'all' | 'maintenance' | 'catering'>('all')

  useEffect(() => {
    if (household?.id) {
      fetchWorkOrders()
    }
  }, [household?.id, selectedStatus, selectedType, normalizeStatus])

  const fetchWorkOrders = useCallback(async () => {
    if (!household?.id) {
      setUnifiedWorkOrders([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Fetch both maintenance tickets and catering orders
      // Don't filter by status on API - we'll filter client-side using normalized statuses
      const params = new URLSearchParams({ householdId: household.id })

      const [ticketsRes, ordersRes] = await Promise.all([
        fetch(`/api/maintenance/tickets?${params.toString()}`),
        fetch(`/api/catering/orders?${params.toString()}`)
      ])

      // Handle tickets response
      let ticketsData: any = { tickets: [] }
      if (ticketsRes.ok) {
        try {
          ticketsData = await ticketsRes.json()
        } catch (e) {
          console.error('Error parsing tickets JSON:', e)
          toast.error('Failed to parse tickets data')
        }
      } else {
        const errorText = await ticketsRes.text()
        console.error('Failed to fetch tickets:', ticketsRes.status, errorText)
        toast.error(`Failed to fetch tickets: ${ticketsRes.status}`)
      }

      // Handle orders response
      let ordersData: any = { orders: [] }
      if (ordersRes.ok) {
        try {
          ordersData = await ordersRes.json()
        } catch (e) {
          console.error('Error parsing orders JSON:', e)
          toast.error('Failed to parse orders data')
        }
      } else {
        const errorText = await ordersRes.text()
        console.error('Failed to fetch orders:', ordersRes.status, errorText)
        // Don't show error toast for orders if tickets succeeded - just log
        if (!ticketsRes.ok) {
          toast.error(`Failed to fetch orders: ${ordersRes.status}`)
        }
      }

      setTickets(ticketsData.tickets || [])
      setOrders(ordersData.orders || [])

      // Combine into unified work orders with normalized statuses
      let unified: UnifiedWorkOrder[] = [
        ...(ticketsData.tickets || []).map((ticket: MaintenanceTicket) => ({
          id: ticket.id,
          type: 'maintenance' as const,
          number: ticket.ticketNumber || ticket.id,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status, // Keep original status for display
          normalizedStatus: normalizeStatus(ticket.status, 'maintenance'), // Add normalized status for filtering
          category: ticket.category,
          priority: ticket.priority,
          requestedAt: ticket.requestedAt,
          assignedTo: ticket.assignedCrew?.name || ticket.assignedSupplier?.name,
          ticket,
        })),
        ...(ordersData.orders || []).map((order: any) => {
          // Safely convert totalAmount to number (API should return number, but handle edge cases)
          const totalAmount = typeof order.totalAmount === 'number' 
            ? order.totalAmount 
            : parseFloat(order.totalAmount?.toString() || '0')
          
          return {
            id: order.id,
            type: 'catering' as const,
            number: order.orderNumber || order.id,
            title: `叫餐訂單 - ${(order.items || []).map((i: any) => `${i.menuItem?.name || 'Item'} x${i.quantity}`).join(', ') || '訂單'}`,
            description: `總金額: $${totalAmount.toFixed(2)} | 配送方式: ${order.deliveryType === 'immediate' ? '立即送達' : order.deliveryType === 'scheduled' ? '預約送達' : order.deliveryType === 'dine-in' ? '餐廳內用' : '未知'}`,
            status: order.status, // Keep original status for display
            normalizedStatus: normalizeStatus(order.status, 'catering'), // Add normalized status for filtering
            requestedAt: order.orderedAt,
            assignedTo: order.workgroup?.name,
            order,
          }
        }),
      ].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())

      // Apply type filter
      if (selectedType !== 'all') {
        unified = unified.filter(wo => wo.type === selectedType)
      }

      // Apply status filter using normalized statuses
      if (selectedStatus !== 'all') {
        unified = unified.filter(wo => {
          const normalized = wo.normalizedStatus || normalizeStatus(wo.status, wo.type)
          return normalized === selectedStatus
        })
      }

      setUnifiedWorkOrders(unified)
    } catch (error: any) {
      console.error('Error fetching work orders:', error)
      toast.error(`Failed to load work orders: ${error.message || 'Unknown error'}`)
      setUnifiedWorkOrders([])
    } finally {
      setLoading(false)
    }
  }, [household?.id, selectedStatus, selectedType, normalizeStatus])

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
    const statusLower = status.toLowerCase()
    
    // Map statuses to translation keys - consistent across both types
    const statusMap: Record<string, string> = {
      // Maintenance statuses
      'pending_evaluation': getTranslation('pendingEvaluation', '待評估'),
      'pending': getTranslation('pending', '待處理'),
      'evaluated': getTranslation('evaluated', '已評估'),
      'assigned': getTranslation('assigned', '已指派'),
      'in_progress': getTranslation('inProgress', '處理中'),
      'work_completed': getTranslation('workCompleted', '工作完成'),
      'signed_off_by_crew': getTranslation('signedOffByCrew', '工作組簽核'),
      'signed_off_by_supplier': getTranslation('signedOffBySupplier', '供應商簽核'),
      'signed_off_by_household': getTranslation('signedOffByHousehold', '住戶簽核'),
      'closed': getTranslation('closed', '已完成'),
      'cancelled': getTranslation('cancelled', '已取消'),
      
      // Catering statuses
      'submitted': getTranslation('submitted', '已提交'),
      'accepted': getTranslation('accepted', '已接受'),
      'preparing': getTranslation('preparing', '準備中'),
      'ready': getTranslation('ready', '已就緒'),
      'delivered': getTranslation('delivered', '已送達'),
    }
    
    // Try exact match first
    if (statusMap[statusLower]) {
      return statusMap[statusLower]
    }
    
    // Try uppercase match for maintenance statuses
    if (type === 'maintenance') {
      const upperStatus = status.toUpperCase()
      const upperLower = upperStatus.toLowerCase()
      if (statusMap[upperLower]) {
        return statusMap[upperLower]
      }
      // Fallback: replace underscores with spaces and capitalize
      return status.replace(/_/g, ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
    }
    
    // Fallback for catering - capitalize first letter
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
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
        <p className="mt-2 text-gray-600 dark:text-gray-400">{getTranslation('loading', '載入中')}</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {getTranslation('workOrders', '工單')} ({getTranslation('maintenanceTickets', '報修單')} & {getTranslation('cateringOrders', '叫餐訂單')})
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">{getTranslation('filter', '篩選')}:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as 'all' | 'maintenance' | 'catering')}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
          >
            <option value="all">{getTranslation('allTypes', '全部類型')}</option>
            <option value="maintenance">{getTranslation('maintenance', '報修')}</option>
            <option value="catering">{getTranslation('catering', '叫餐')}</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
          >
            <option value="all">{getTranslation('allStatus', '全部狀態')}</option>
            <option value="pending">{getTranslation('pending', '待處理')}</option>
            <option value="in_progress">{getTranslation('inProgress', '處理中')}</option>
            <option value="completed">{getTranslation('completed', '已完成')}</option>
            <option value="cancelled">{getTranslation('cancelled', '已取消')}</option>
          </select>
        </div>
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
            {getTranslation('createFirstTicket', '建立您的第一張報修單')}
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
                        {workOrder.type === 'catering' ? getTranslation('catering', '叫餐') : getTranslation('maintenance', '報修')}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {workOrder.number}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getNormalizedStatusColor(workOrder.normalizedStatus || normalizeStatus(workOrder.status, workOrder.type))}`}>
                        {getNormalizedStatusLabel(workOrder.normalizedStatus || normalizeStatus(workOrder.status, workOrder.type))}
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

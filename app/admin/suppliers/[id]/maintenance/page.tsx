'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/components/LanguageProvider'
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  HomeIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

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
  assignedSupplier?: {
    id: string
    name: string
  }
  requestedAt: string
  _count?: {
    workLogs: number
    signoffs: number
  }
}

interface Supplier {
  id: string
  name: string
  serviceTypes: string[]
}

export default function SupplierAdminMaintenancePage() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const supplierId = params?.id as string
  
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([])
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null)

  useEffect(() => {
    if (supplierId) {
      fetchSupplier()
      fetchTickets()
    }
  }, [supplierId, selectedStatus])

  const fetchSupplier = async () => {
    try {
      const response = await fetch(`/api/admin/suppliers/${supplierId}`)
      if (!response.ok) throw new Error('Failed to fetch supplier')
      const data = await response.json()
      setSupplier(data.supplier)
    } catch (error: any) {
      console.error('Error fetching supplier:', error)
      toast.error('Failed to load supplier information')
    }
  }

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ 
        admin: 'true',
        supplierId: supplierId 
      })
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

      const response = await fetch(`/api/maintenance/tickets?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch tickets')

      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (error: any) {
      console.error('Error fetching tickets:', error)
      toast.error('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/maintenance/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update ticket')
      }

      toast.success('Ticket updated successfully')
      fetchTickets()
      setSelectedTicket(null)
    } catch (error: any) {
      console.error('Error updating ticket:', error)
      toast.error(error.message || 'Failed to update ticket')
    }
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === 'pending_evaluation' || statusLower === 'submitted') {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }
    if (statusLower === 'evaluated' || statusLower === 'assigned' || statusLower === 'accepted') {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    }
    if (statusLower === 'in_progress' || statusLower === 'preparing') {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    }
    if (statusLower === 'closed' || statusLower === 'completed' || statusLower === 'delivered') {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'PENDING_EVALUATION': '待評估',
      'submitted': '已提交',
      'EVALUATED': '已評估',
      'ASSIGNED': '已分配',
      'accepted': '已接受',
      'IN_PROGRESS': '處理中',
      'preparing': '準備中',
      'WORK_COMPLETED': '工作完成',
      'CLOSED': '已完成',
      'completed': '已完成',
      'delivered': '已送達',
    }
    return statusMap[status] || status
  }

  if (loading && !supplier) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{t('loading') || 'Loading...'}</p>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Supplier Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The supplier you're looking for doesn't exist or you don't have access.
        </p>
        <button
          onClick={() => router.push('/admin')}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Back to Admin Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Side Menu */}
      <div className="w-64 flex-shrink-0 bg-white shadow-sm border-r border-gray-200">
        <div className="h-[calc(100vh-120px)] overflow-y-auto p-2">
          <nav className="space-y-1">
            <Link
              href={`/admin/suppliers/${supplierId}/maintenance`}
              className="bg-red-50 text-red-600 border-red-500 w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md border-l-2 transition-colors"
            >
              <WrenchScrewdriverIcon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">工單管理</span>
            </Link>
            <Link
              href="/admin"
              className="text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md border-l-2 transition-colors"
            >
              <HomeIcon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">管理儀表板</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <TruckIcon className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {supplier.name} - 工單管理
              </h1>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              服務類型: {supplier.serviceTypes.join(', ') || '無'}
            </p>
          </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
        >
          <option value="all">{t('all') || 'All'}</option>
          <option value="PENDING_EVALUATION">待評估</option>
          <option value="EVALUATED">已評估</option>
          <option value="ASSIGNED">已分配</option>
          <option value="IN_PROGRESS">處理中</option>
          <option value="WORK_COMPLETED">工作完成</option>
          <option value="CLOSED">已完成</option>
        </select>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {selectedStatus === 'all' 
              ? '目前沒有分配給此供應商的工單' 
              : `目前沒有狀態為「${getStatusLabel(selectedStatus)}」的工單`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {ticket.ticketNumber}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {getStatusLabel(ticket.status)}
                    </span>
                    {ticket.priority && (
                      <span className={`text-xs font-medium ${
                        ticket.priority === 'HIGH' ? 'text-red-600' :
                        ticket.priority === 'MEDIUM' ? 'text-yellow-600' : 'text-gray-600'
                      }`}>
                        {ticket.priority}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    {ticket.title}
                  </h3>
                  {ticket.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {ticket.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p>分類: {ticket.category}</p>
                    <p>住戶: {ticket.household.name} {ticket.household.apartmentNo ? `(${ticket.household.apartmentNo})` : ''}</p>
                    <p>請求人: {ticket.requestedBy.name}</p>
                    <p>請求時間: {new Date(ticket.requestedAt).toLocaleString('zh-TW')}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedTicket.ticketNumber}
                </h2>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    狀態
                  </label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusUpdate(selectedTicket.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  >
                    <option value="EVALUATED">已評估</option>
                    <option value="ASSIGNED">已分配</option>
                    <option value="IN_PROGRESS">處理中</option>
                    <option value="WORK_COMPLETED">工作完成</option>
                    <option value="CLOSED">已完成</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    標題
                  </label>
                  <p className="text-gray-900 dark:text-white">{selectedTicket.title}</p>
                </div>

                {selectedTicket.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      描述
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedTicket.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      分類
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedTicket.category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      優先級
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedTicket.priority || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    住戶
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedTicket.household.name} {selectedTicket.household.apartmentNo ? `(${selectedTicket.household.apartmentNo})` : ''}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    請求人
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedTicket.requestedBy.name} ({selectedTicket.requestedBy.email})
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    請求時間
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedTicket.requestedAt).toLocaleString('zh-TW')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

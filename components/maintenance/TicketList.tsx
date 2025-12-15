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
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
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

export default function TicketList() {
  const { t } = useLanguage()
  const { household } = useHousehold()
  const { data: session } = useSession()
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  useEffect(() => {
    if (household?.id) {
      fetchTickets()
    }
  }, [household?.id, selectedStatus])

  const fetchTickets = async () => {
    if (!household?.id) return

    setLoading(true)
    try {
      const params = new URLSearchParams({ householdId: household.id })
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

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
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
          {t('maintenanceTickets')}
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
          <option value="EVALUATED">{t('evaluated') || 'Evaluated'}</option>
          <option value="ASSIGNED">{t('assigned') || 'Assigned'}</option>
          <option value="IN_PROGRESS">{t('inProgress') || 'In Progress'}</option>
          <option value="WORK_COMPLETED">{t('workCompleted')}</option>
          <option value="CLOSED">{t('closed')}</option>
        </select>
      </div>

      {/* Ticket list */}
      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {t('noTickets') || 'No maintenance tickets found'}
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
          {tickets.map((ticket) => {
            const StatusIcon = getStatusIcon(ticket.status)
            return (
              <div
                key={ticket.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {ticket.ticketNumber}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      {ticket.title}
                    </h3>
                    {ticket.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {ticket.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>{t('category') || 'Category'}: {ticket.category.replace(/_/g, ' ')}</span>
                      {ticket.location && <span>{t('location')}: {ticket.location}</span>}
                      {ticket.assignedCrew && (
                        <span>{t('assignedCrew')}: {ticket.assignedCrew.name}</span>
                      )}
                      {ticket.assignedSupplier && (
                        <span>{t('supplier')}: {ticket.assignedSupplier.name}</span>
                      )}
                      {ticket._count && ticket._count.workLogs > 0 && (
                        <span>{ticket._count.workLogs} {t('workLogs')}</span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {t('requested')}: {new Date(ticket.requestedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <FrontDeskChatButton ticketId={ticket.id} />
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
            fetchTickets()
            setShowRequestForm(false)
          }}
        />
      )}
    </div>
  )
}

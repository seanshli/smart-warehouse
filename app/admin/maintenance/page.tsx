'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/components/LanguageProvider'
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
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
  assignedCrew?: {
    id: string
    name: string
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

export default function AdminMaintenancePage() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null)

  // Get householdId from URL params
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const householdId = searchParams?.get('householdId')

  useEffect(() => {
    fetchTickets()
  }, [selectedStatus, householdId])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ admin: 'true' })
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }
      if (householdId) {
        params.append('householdId', householdId)
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

  const handleEvaluate = async (ticketId: string, routingType: string, assignedId: string) => {
    try {
      const response = await fetch(`/api/admin/maintenance/tickets/${ticketId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routingType,
          assignedCrewId: routingType.startsWith('INTERNAL') ? assignedId : null,
          assignedSupplierId: routingType === 'EXTERNAL_SUPPLIER' ? assignedId : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to evaluate ticket')
      }

      toast.success('Ticket evaluated successfully')
      fetchTickets()
      setSelectedTicket(null)
    } catch (error: any) {
      console.error('Error evaluating ticket:', error)
      toast.error(error.message || 'Failed to evaluate ticket')
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('maintenanceTicketManagement')}
          </h1>
          {householdId && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('filteredByHousehold') || 'Filtered by household'}
            </p>
          )}
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
        >
          <option value="all">{t('all') || 'All'}</option>
          <option value="PENDING_EVALUATION">{t('pendingEvaluation') || 'Pending Evaluation'}</option>
          <option value="EVALUATED">{t('evaluated') || 'Evaluated'}</option>
          <option value="ASSIGNED">{t('assigned') || 'Assigned'}</option>
          <option value="IN_PROGRESS">{t('inProgress') || 'In Progress'}</option>
        </select>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {t('noTickets') || 'No maintenance tickets found'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {ticket.ticketNumber}
                  </span>
                  <span className="ml-2 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    {ticket.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {ticket.title}
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>{t('household')}: {ticket.household.name}</p>
                <p>{t('category')}: {ticket.category.replace(/_/g, ' ')}</p>
                <p>{t('priority')}: {ticket.priority}</p>
                {ticket.routingType && (
                  <p className="mt-1">
                    <span className="font-medium">{t('routingType') || 'Routing'}:</span>{' '}
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {ticket.routingType.replace(/_/g, ' ')}
                    </span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Evaluation modal */}
      {selectedTicket && selectedTicket.status === 'PENDING_EVALUATION' && (
        <TicketEvaluationModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onEvaluate={handleEvaluate}
        />
      )}
    </div>
  )
}

function TicketEvaluationModal({
  ticket,
  onClose,
  onEvaluate,
}: {
  ticket: MaintenanceTicket
  onClose: () => void
  onEvaluate: (ticketId: string, routingType: string, assignedId: string) => void
}) {
  // Use ticket's existing routingType if set, otherwise allow selection
  const [routingType, setRoutingType] = useState<string>(ticket.routingType || '')
  const [assignedId, setAssignedId] = useState<string>('')
  const [crews, setCrews] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // If routingType is already set from ticket creation, fetch teams immediately
    if (ticket.routingType) {
      if (ticket.routingType.startsWith('INTERNAL')) {
        fetchCrews()
      } else if (ticket.routingType === 'EXTERNAL_SUPPLIER') {
        fetchSuppliers()
      }
    } else if (routingType) {
      // Otherwise fetch when user selects routing type
      if (routingType.startsWith('INTERNAL')) {
        fetchCrews()
      } else if (routingType === 'EXTERNAL_SUPPLIER') {
        fetchSuppliers()
      }
    }
  }, [routingType, ticket.routingType])

  const fetchCrews = async () => {
    try {
      const response = await fetch('/api/admin/maintenance/crews')
      if (response.ok) {
        const data = await response.json()
        setCrews(data.crews || [])
      }
    } catch (error) {
      console.error('Error fetching crews:', error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/admin/maintenance/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.suppliers || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const handleSubmit = () => {
    if (!routingType || !assignedId) {
      toast.error('Please select routing type and assignee')
      return
    }
    onEvaluate(ticket.id, routingType, assignedId)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Evaluate Ticket: {ticket.ticketNumber}</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Routing Type *</label>
            <select
              value={routingType}
              onChange={(e) => {
                setRoutingType(e.target.value)
                setAssignedId('')
              }}
              disabled={!!ticket.routingType} // Disable if already set from ticket creation
              className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select routing type</option>
              <option value="INTERNAL_BUILDING">Internal Building Crew</option>
              <option value="INTERNAL_COMMUNITY">Internal Community Crew</option>
              <option value="EXTERNAL_SUPPLIER">External Supplier</option>
            </select>
            {ticket.routingType && (
              <p className="mt-1 text-xs text-gray-500">
                Routing type automatically set based on job category: {ticket.category}
              </p>
            )}
          </div>

          {routingType.startsWith('INTERNAL') && (
            <div>
              <label className="block text-sm font-medium mb-1">Assign to Crew *</label>
              <select
                value={assignedId}
                onChange={(e) => setAssignedId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select crew</option>
                {crews.map((crew) => (
                  <option key={crew.id} value={crew.id}>
                    {crew.name} ({crew.crewType})
                  </option>
                ))}
              </select>
            </div>
          )}

          {routingType === 'EXTERNAL_SUPPLIER' && (
            <div>
              <label className="block text-sm font-medium mb-1">Assign to Supplier *</label>
              <select
                value={assignedId}
                onChange={(e) => setAssignedId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!routingType || !assignedId || loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md disabled:opacity-50"
            >
              Evaluate & Route
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

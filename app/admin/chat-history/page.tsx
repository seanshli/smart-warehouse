'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import { ChatBubbleLeftRightIcon, UserGroupIcon, BuildingOfficeIcon, ClockIcon } from '@heroicons/react/24/outline'

interface ChatHistoryEntry {
  id: string
  content: string
  messageType: string
  format: string
  receiverType: string
  receiverId: string | null
  createdAt: string
  sender: {
    id: string
    name: string | null
    email: string
  }
  household: {
    id: string
    name: string
    apartmentNo: string | null
  } | null
  conversation: {
    id: string
    type: string
  } | null
}

export default function AdminChatHistoryPage() {
  const { t } = useLanguage()
  const [chatHistory, setChatHistory] = useState<ChatHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    householdId: '',
    receiverType: '',
    startDate: '',
    endDate: '',
  })
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100,
    offset: 0,
    hasMore: false,
  })

  useEffect(() => {
    fetchChatHistory()
  }, [filters, pagination.offset])

  const fetchChatHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      })
      
      if (filters.householdId) params.append('householdId', filters.householdId)
      if (filters.receiverType) params.append('receiverType', filters.receiverType)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`/api/admin/chat-history?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch chat history')
      }
      const data = await response.json()
      setChatHistory(data.data || [])
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        hasMore: data.pagination?.hasMore || false,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatReceiver = (entry: ChatHistoryEntry) => {
    switch (entry.receiverType) {
      case 'household':
        return `Household (${entry.receiverId})`
      case 'frontdesk':
        return 'Front Desk'
      case 'frontdoor':
        return 'Front Door / Visitor'
      default:
        return entry.receiverType || 'Unknown'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  if (loading && chatHistory.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('adminLoading') || 'Loading...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
          <ChatBubbleLeftRightIcon className="h-8 w-8" />
          <span>{t('adminChatHistory') || 'Chat History'}</span>
        </h1>
        <p className="mt-2 text-gray-600">
          {t('adminChatHistoryDescription') || 'View all text chat messages between households, front desk, and front door visitors'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('adminFilters') || 'Filters'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('adminHousehold') || 'Household ID'}
            </label>
            <input
              type="text"
              value={filters.householdId}
              onChange={(e) => setFilters({ ...filters, householdId: e.target.value })}
              placeholder="Filter by household..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('adminReceiverType') || 'Receiver Type'}
            </label>
            <select
              value={filters.receiverType}
              onChange={(e) => setFilters({ ...filters, receiverType: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            >
              <option value="">All Types</option>
              <option value="household">Household</option>
              <option value="frontdesk">Front Desk</option>
              <option value="frontdoor">Front Door / Visitor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('adminStartDate') || 'Start Date'}
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('adminEndDate') || 'End Date'}
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={fetchChatHistory}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            {t('adminApplyFilters') || 'Apply Filters'}
          </button>
        </div>
      </div>

      {/* Chat History Table */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      ) : chatHistory.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('adminNoChatHistory') || 'No chat history found'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('adminTimestamp') || 'Timestamp'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('adminSender') || 'Sender'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('adminHousehold') || 'Household'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('adminReceiver') || 'Receiver'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('adminFormat') || 'Format'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('adminMessage') || 'Message'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chatHistory.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>{formatDate(entry.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <div>
                          <div className="font-medium">{entry.sender.name || entry.sender.email}</div>
                          {entry.sender.name && (
                            <div className="text-xs text-gray-500">{entry.sender.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.household ? (
                        <div>
                          <div className="font-medium">{entry.household.name}</div>
                          {entry.household.apartmentNo && (
                            <div className="text-xs text-gray-500">{entry.household.apartmentNo}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        {entry.receiverType === 'frontdesk' && <BuildingOfficeIcon className="h-4 w-4 mr-2 text-blue-400" />}
                        {entry.receiverType === 'frontdoor' && <BuildingOfficeIcon className="h-4 w-4 mr-2 text-green-400" />}
                        {entry.receiverType === 'household' && <UserGroupIcon className="h-4 w-4 mr-2 text-purple-400" />}
                        <span>{formatReceiver(entry)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                        {entry.format || entry.messageType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-md truncate" title={entry.content}>
                        {entry.content}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} entries
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })}
                disabled={pagination.offset === 0}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('adminPrevious') || 'Previous'}
              </button>
              <button
                onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
                disabled={!pagination.hasMore}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('adminNext') || 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/components/LanguageProvider'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  HomeIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Facility {
  id: string
  name: string
  description?: string
  type?: string
  floorNumber?: number
  capacity?: number
  isActive: boolean
  building?: {
    id: string
    name: string
  }
  operatingHours?: Array<{
    dayOfWeek: number
    openTime: string
    closeTime: string
    isClosed: boolean
  }>
}

interface Reservation {
  id: string
  facilityId: string
  householdId: string
  startTime: string
  endTime: string
  purpose?: string
  numberOfPeople?: number
  status: string
  household: {
    id: string
    name: string
    apartmentNo?: string
  }
  facility: {
    id: string
    name: string
  }
}

interface UsageStats {
  totalReservations: number
  upcomingReservations: number
  completedReservations: number
  cancelledReservations: number
  averageUsagePerWeek: number
  peakHours: Array<{ hour: number; count: number }>
}

export default function ContextFacilitiesPage() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const context = params.context as string // 'building' or 'community'
  const id = params.id as string

  // Get householdId from URL params
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const householdId = searchParams?.get('householdId')
  const tabParam = searchParams?.get('tab')

  const [facilities, setFacilities] = useState<Facility[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [contextInfo, setContextInfo] = useState<{ name: string; type: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'facilities' | 'reservations' | 'calendar' | 'usage'>(
    (tabParam as any) || 'facilities'
  )
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [commentModal, setCommentModal] = useState<{ open: boolean; reservationId: string | null; action: 'approve' | 'reject' | null }>({
    open: false,
    reservationId: null,
    action: null,
  })
  const [comment, setComment] = useState('')

  useEffect(() => {
    fetchContextInfo()
    fetchFacilities()
    fetchReservations()
    fetchUsageStats()
  }, [context, id, householdId])

  const fetchContextInfo = async () => {
    try {
      if (context === 'building') {
        const response = await fetch(`/api/admin/buildings`)
        if (response.ok) {
          const data = await response.json()
          const building = data.buildings?.find((b: any) => b.id === id)
          if (building) {
            setContextInfo({ name: building.name, type: 'Building' })
          }
        }
      } else if (context === 'community') {
        const response = await fetch(`/api/admin/communities`)
        if (response.ok) {
          const data = await response.json()
          const community = data.communities?.find((c: any) => c.id === id)
          if (community) {
            setContextInfo({ name: community.name, type: 'Community' })
          }
        }
      }
    } catch (error) {
      console.error('Error fetching context info:', error)
    }
  }

  const fetchFacilities = async () => {
    setLoading(true)
    setError(null)
    try {
      if (context === 'building') {
        const response = await fetch(`/api/building/${id}/facility`)
        if (!response.ok) {
          throw new Error('Failed to fetch facilities')
        }
        const data = await response.json()
        setFacilities(data.data || [])
      } else if (context === 'community') {
        // Fetch facilities from all buildings in the community
        const buildingsResponse = await fetch(`/api/admin/buildings?communityId=${id}`)
        if (buildingsResponse.ok) {
          const buildingsData = await buildingsResponse.json()
          const buildings = buildingsData.buildings || []
          
          // Fetch facilities from each building
          const facilityPromises = buildings.map((building: any) =>
            fetch(`/api/building/${building.id}/facility`).then(r => r.json())
          )
          const facilityResults = await Promise.all(facilityPromises)
          const allFacilities = facilityResults.flatMap((result: any) => result.data || [])
          setFacilities(allFacilities)
        }
      }
    } catch (error: any) {
      console.error('Error fetching facilities:', error)
      setError(error.message || 'Failed to load facilities')
      toast.error('Failed to load facilities')
    } finally {
      setLoading(false)
    }
  }

  const fetchReservations = async () => {
    try {
      // Fetch reservations for facilities in this context
      const facilityIds = facilities.map(f => f.id)
      if (facilityIds.length === 0) {
        setReservations([])
        return
      }

      // Fetch reservations for each facility - include pending for admin view
      const reservationPromises = facilityIds.map(facilityId =>
        fetch(`/api/facility/${facilityId}/reservations?includePending=true`).then(r => r.json())
      )
      const reservationResults = await Promise.all(reservationPromises)
      let allReservations = reservationResults.flatMap((result: any) => result.data || [])

      // Filter by householdId if provided
      if (householdId) {
        allReservations = allReservations.filter((r: any) => r.householdId === householdId)
      }

      setReservations(allReservations)
    } catch (error: any) {
      console.error('Error fetching reservations:', error)
    }
  }

  const fetchUsageStats = async () => {
    try {
      // Calculate usage statistics from reservations
      const stats: UsageStats = {
        totalReservations: reservations.length,
        upcomingReservations: reservations.filter(r => new Date(r.startTime) > new Date()).length,
        completedReservations: reservations.filter(r => r.status === 'COMPLETED').length,
        cancelledReservations: reservations.filter(r => r.status === 'CANCELLED').length,
        averageUsagePerWeek: 0,
        peakHours: []
      }

      // Calculate average usage per week (last 4 weeks)
      const fourWeeksAgo = new Date()
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
      const recentReservations = reservations.filter(r => new Date(r.startTime) >= fourWeeksAgo)
      stats.averageUsagePerWeek = recentReservations.length / 4

      // Calculate peak hours
      const hourCounts: Record<number, number> = {}
      reservations.forEach(r => {
        const hour = new Date(r.startTime).getHours()
        hourCounts[hour] = (hourCounts[hour] || 0) + 1
      })
      stats.peakHours = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setUsageStats(stats)
    } catch (error) {
      console.error('Error calculating usage stats:', error)
    }
  }

  useEffect(() => {
    if (facilities.length > 0) {
      fetchReservations()
    }
  }, [facilities])

  useEffect(() => {
    if (reservations.length > 0) {
      fetchUsageStats()
    }
  }, [reservations])

  const [commentModal, setCommentModal] = useState<{ open: boolean; reservationId: string | null; action: 'approve' | 'reject' | null }>({
    open: false,
    reservationId: null,
    action: null,
  })
  const [comment, setComment] = useState('')

  const handleApproveReservation = async (reservationId: string, adminComment?: string) => {
    try {
      const response = await fetch(`/api/facility/reservation/${reservationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: adminComment || undefined }),
      })

      if (!response.ok) {
        throw new Error('Failed to approve reservation')
      }

      toast.success('Reservation approved')
      setCommentModal({ open: false, reservationId: null, action: null })
      setComment('')
      fetchReservations()
    } catch (error: any) {
      console.error('Error approving reservation:', error)
      toast.error(error.message || 'Failed to approve reservation')
    }
  }

  const handleRejectReservation = async (reservationId: string, reason?: string) => {
    try {
      const response = await fetch(`/api/facility/reservation/${reservationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || undefined }),
      })

      if (!response.ok) {
        throw new Error('Failed to reject reservation')
      }

      toast.success('Reservation rejected')
      setCommentModal({ open: false, reservationId: null, action: null })
      setComment('')
      fetchReservations()
    } catch (error: any) {
      console.error('Error rejecting reservation:', error)
      toast.error(error.message || 'Failed to reject reservation')
    }
  }

  const openCommentModal = (reservationId: string, action: 'approve' | 'reject') => {
    setCommentModal({ open: true, reservationId, action })
    setComment('')
  }

  const submitWithComment = () => {
    if (!commentModal.reservationId || !commentModal.action) return
    
    if (commentModal.action === 'approve') {
      handleApproveReservation(commentModal.reservationId, comment)
    } else {
      handleRejectReservation(commentModal.reservationId, comment)
    }
  }

  const getBackUrl = () => {
    if (context === 'building') {
      return `/admin/buildings`
    } else if (context === 'community') {
      return `/admin/communities`
    }
    return '/admin'
  }

  if (loading && facilities.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href={getBackUrl()}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Public Facilities - {contextInfo?.name || (context === 'building' ? 'Building' : 'Community')}
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage facilities and review reservation requests for {contextInfo?.type.toLowerCase() || context}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                href={getBackUrl()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to {context === 'building' ? 'Buildings' : 'Communities'}
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Admin Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Layout: Vertical Sidebar + Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Vertical Sidebar - Scrollable */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              <nav className="space-y-1">
                {([
                  { id: 'facilities', name: t('facilities') || 'Facilities', icon: BuildingOfficeIcon },
                  { id: 'reservations', name: t('facilityReservations') || 'Reservations', icon: ClockIcon },
                  { id: 'calendar', name: t('calendar') || 'Calendar', icon: CalendarIcon },
                  { id: 'usage', name: t('usage') || 'Usage', icon: ChartBarIcon },
                ] as const).map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-600 border-primary-500'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                      } w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md border-l-2 transition-colors capitalize`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate">{tab.name}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <XCircleIcon className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'facilities' && (
          <div>
            {facilities.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Facilities Found</h3>
                <p className="text-gray-500">
                  No facilities have been created for this {context === 'building' ? 'building' : 'community'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {facilities.map((facility) => (
                  <button
                    key={facility.id}
                    onClick={() => {
                      // Navigate to facility detail page
                      router.push(`/admin/facilities/${context}/${id}/facility/${facility.id}`)
                    }}
                    className="bg-white shadow rounded-lg p-6 text-left hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{facility.name}</h3>
                        {facility.description && (
                          <p className="text-sm text-gray-500 mt-1">{facility.description}</p>
                        )}
                        <div className="mt-4 space-y-2">
                          {facility.floorNumber && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Floor:</span> {facility.floorNumber}
                            </p>
                          )}
                          {facility.capacity && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Capacity:</span> {facility.capacity} people
                            </p>
                          )}
                          {facility.building && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Building:</span> {facility.building.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          facility.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {facility.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Reservation Requests</h2>
            </div>
            {reservations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p>No reservations found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {reservations.map((reservation) => (
                  <div key={reservation.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {reservation.facility.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {reservation.household.name} {reservation.household.apartmentNo && `(${reservation.household.apartmentNo})`}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(reservation.startTime).toLocaleString()} - {new Date(reservation.endTime).toLocaleString()}
                        </p>
                        {reservation.purpose && (
                          <p className="text-sm text-gray-600 mt-1">{reservation.purpose}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            reservation.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : reservation.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {reservation.status}
                        </span>
                        {reservation.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => openCommentModal(reservation.id, 'approve')}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              {t('approve') || 'Approve'}
                            </button>
                            <button
                              onClick={() => openCommentModal(reservation.id, 'reject')}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                            >
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              {t('reject') || 'Reject'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Facility Calendar</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-center">
                Calendar view will show facility bookings for the selected date range
              </p>
              {/* TODO: Implement calendar component */}
            </div>
          </div>
        )}

        {activeTab === 'usage' && usageStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Reservations</p>
                    <p className="text-2xl font-bold text-gray-900">{usageStats.totalReservations}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Upcoming</p>
                    <p className="text-2xl font-bold text-gray-900">{usageStats.upcomingReservations}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{usageStats.completedReservations}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <XCircleIcon className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Cancelled</p>
                    <p className="text-2xl font-bold text-gray-900">{usageStats.cancelledReservations}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Statistics</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Average Usage Per Week</p>
                  <p className="text-2xl font-bold text-gray-900">{usageStats.averageUsagePerWeek.toFixed(1)}</p>
                </div>
                {usageStats.peakHours.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Peak Hours</p>
                    <div className="space-y-2">
                      {usageStats.peakHours.map((peak, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{peak.hour}:00 - {peak.hour + 1}:00</span>
                          <span className="text-sm font-medium text-gray-900">{peak.count} reservations</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {commentModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {commentModal.action === 'approve' 
                  ? (t('approveReservation') || 'Approve Reservation')
                  : (t('rejectReservation') || 'Reject Reservation')}
              </h3>
              <button
                onClick={() => {
                  setCommentModal({ open: false, reservationId: null, action: null })
                  setComment('')
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {commentModal.action === 'approve'
                ? (t('approveReservationComment') || 'Add a comment or suggestion for the household (optional):')
                : (t('rejectReservationReason') || 'Provide a reason for rejection (optional):')}
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white mb-4"
              placeholder={commentModal.action === 'approve'
                ? (t('commentPlaceholder') || 'e.g., Time slot OK but too many people. Consider reducing number of people.')
                : (t('reasonPlaceholder') || 'e.g., Time slot already occupied by another reservation')}
            />
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setCommentModal({ open: false, reservationId: null, action: null })
                  setComment('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                onClick={submitWithComment}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  commentModal.action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {commentModal.action === 'approve'
                  ? (t('approve') || 'Approve')
                  : (t('reject') || 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

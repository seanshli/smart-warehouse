'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChartBarIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/components/LanguageProvider'
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
}

export default function FacilityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useLanguage()
  const { data: session } = useSession()
  const context = params.context as string
  const id = params.id as string
  const facilityId = params.facilityId as string

  const [facility, setFacility] = useState<Facility | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'reservations' | 'usage'>('overview')

  useEffect(() => {
    if (facilityId) {
      fetchFacility()
      fetchReservations()
    }
  }, [facilityId])

  const fetchFacility = async () => {
    try {
      setLoading(true)
      // Find facility from building or community
      if (context === 'building') {
        const response = await fetch(`/api/building/${id}/facility`)
        if (!response.ok) throw new Error('Failed to fetch facilities')
        const data = await response.json()
        const found = data.data?.find((f: Facility) => f.id === facilityId)
        if (found) {
          setFacility(found)
        } else {
          setError('Facility not found')
        }
      } else {
        // Community context - search all buildings
        const buildingsResponse = await fetch(`/api/admin/buildings?communityId=${id}`)
        if (buildingsResponse.ok) {
          const buildingsData = await buildingsResponse.json()
          const buildings = buildingsData.buildings || []
          
          for (const building of buildings) {
            const facilityResponse = await fetch(`/api/building/${building.id}/facility`)
            if (facilityResponse.ok) {
              const facilityData = await facilityResponse.json()
              const found = facilityData.data?.find((f: Facility) => f.id === facilityId)
              if (found) {
                setFacility(found)
                break
              }
            }
          }
          
          if (!facility) {
            setError('Facility not found')
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching facility:', error)
      setError(error.message || 'Failed to load facility')
    } finally {
      setLoading(false)
    }
  }

  const fetchReservations = async () => {
    try {
      const response = await fetch(`/api/facility/${facilityId}/reservations?includePending=true`)
      if (!response.ok) throw new Error('Failed to fetch reservations')
      const data = await response.json()
      setReservations(data.data || [])
    } catch (error: any) {
      console.error('Error fetching reservations:', error)
    }
  }

  const handleApproveReservation = async (reservationId: string) => {
    try {
      const response = await fetch(`/api/facility/reservation/${reservationId}/approve`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to approve reservation')
      toast.success('Reservation approved')
      fetchReservations()
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve reservation')
    }
  }

  const handleRejectReservation = async (reservationId: string) => {
    try {
      const response = await fetch(`/api/facility/reservation/${reservationId}/reject`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to reject reservation')
      toast.success('Reservation rejected')
      fetchReservations()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject reservation')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !facility) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Facility not found'}</p>
          <Link
            href={`/admin/facilities/${context}/${id}`}
            className="mt-4 inline-block text-blue-600 hover:text-blue-700"
          >
            Back to Facilities
          </Link>
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
                href={`/admin/facilities/${context}/${id}`}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{facility.name}</h1>
                <p className="text-gray-600 mt-1">{facility.description || 'Facility details'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-4 border-b border-gray-200">
            {[
              { id: 'overview', name: 'Overview', icon: CalendarIcon },
              { id: 'calendar', name: 'Calendar', icon: CalendarIcon },
              { id: 'reservations', name: 'Reservations', icon: ClockIcon },
              { id: 'usage', name: 'Usage', icon: ChartBarIcon },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Facility Information</h3>
              <button
                onClick={() => {
                  // TODO: Open edit modal
                  alert('Edit functionality coming soon')
                }}
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{facility.name}</dd>
                  </div>
                  {facility.description && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="mt-1 text-sm text-gray-900">{facility.description}</dd>
                    </div>
                  )}
                  {facility.floorNumber && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Floor</dt>
                      <dd className="mt-1 text-sm text-gray-900">{facility.floorNumber}</dd>
                    </div>
                  )}
                  {facility.capacity && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Capacity</dt>
                      <dd className="mt-1 text-sm text-gray-900">{facility.capacity} people</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          facility.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {facility.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Operating Hours</h3>
                {facility.operatingHours && facility.operatingHours.length > 0 ? (
                  <dl className="space-y-2">
                    {facility.operatingHours.map((hours) => (
                      <div key={hours.dayOfWeek} className="flex justify-between">
                        <dt className="text-sm text-gray-500">
                          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][hours.dayOfWeek]}
                        </dt>
                        <dd className="text-sm text-gray-900">
                          {hours.isClosed ? 'Closed' : `${hours.openTime} - ${hours.closeTime}`}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-sm text-gray-500">No operating hours set</p>
                )}
              </div>
            </div>
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
                        <p className="text-sm text-gray-500">
                          {reservation.household.name} {reservation.household.apartmentNo && `(${reservation.household.apartmentNo})`}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(reservation.startTime).toLocaleString()} - {new Date(reservation.endTime).toLocaleString()}
                        </p>
                        {reservation.purpose && (
                          <p className="text-sm text-gray-600 mt-1">Purpose: {reservation.purpose}</p>
                        )}
                        {reservation.numberOfPeople && (
                          <p className="text-sm text-gray-600">People: {reservation.numberOfPeople}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            reservation.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : reservation.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {reservation.status.toUpperCase()}
                        </span>
                        {reservation.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveReservation(reservation.id)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectReservation(reservation.id)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                            >
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              Reject
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
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reservation Calendar</h3>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-700 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }, (_, i) => {
                const date = new Date()
                date.setDate(date.getDate() - date.getDay() + i)
                const dateStr = date.toISOString().split('T')[0]
                const dayReservations = reservations.filter(
                  (r) => r.status === 'approved' && r.startTime.startsWith(dateStr)
                )
                const isToday = dateStr === new Date().toISOString().split('T')[0]
                
                return (
                  <div
                    key={i}
                    className={`min-h-[80px] border rounded p-2 ${
                      isToday ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                    }`}
                  >
                    <div className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayReservations.slice(0, 2).map((res) => (
                        <div
                          key={res.id}
                          className="text-xs bg-green-100 text-green-800 rounded px-1 py-0.5 truncate"
                          title={`${res.household.name} ${new Date(res.startTime).toLocaleTimeString()}`}
                        >
                          {new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ))}
                      {dayReservations.length > 2 && (
                        <div className="text-xs text-gray-500">+{dayReservations.length - 2} more</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
                <span>Approved Reservations</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded mr-2"></div>
                <span>Today</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">{reservations.length}</div>
                <div className="text-sm text-gray-600">Total Reservations</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {reservations.filter((r) => r.status === 'approved').length}
                </div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {reservations.filter((r) => r.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {reservations.filter((r) => new Date(r.startTime) > new Date()).length}
                </div>
                <div className="text-sm text-gray-600">Upcoming</div>
              </div>
            </div>
            
            {/* Peak Hours */}
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Peak Hours</h4>
              <div className="space-y-2">
                {(() => {
                  const hourCounts: Record<number, number> = {}
                  reservations.forEach((r) => {
                    const hour = new Date(r.startTime).getHours()
                    hourCounts[hour] = (hourCounts[hour] || 0) + 1
                  })
                  const peakHours = Object.entries(hourCounts)
                    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                  
                  return peakHours.length > 0 ? (
                    peakHours.map(({ hour, count }) => (
                      <div key={hour} className="flex items-center">
                        <div className="w-20 text-sm text-gray-600">
                          {String(hour).padStart(2, '0')}:00
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 mr-2">
                          <div
                            className="bg-blue-600 h-4 rounded-full"
                            style={{ width: `${(count / Math.max(...peakHours.map(h => h.count))) * 100}%` }}
                          ></div>
                        </div>
                        <div className="w-12 text-sm text-gray-900 text-right">{count}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No reservation data available</p>
                  )
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

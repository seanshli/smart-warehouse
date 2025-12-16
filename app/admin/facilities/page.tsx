'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/components/LanguageProvider'
import Link from 'next/link'
import {
  HomeIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  BellIcon,
  CogIcon,
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
  building: {
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

export default function AdminFacilitiesPage() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'facilities' | 'reservations' | 'calendar'>('facilities')
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all')
  const [buildings, setBuildings] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    fetchBuildings()
  }, [])

  useEffect(() => {
    if (activeTab === 'facilities') {
      fetchFacilities()
    } else if (activeTab === 'reservations') {
      fetchReservations()
    }
  }, [activeTab, selectedBuilding])

  const fetchBuildings = async () => {
    try {
      const response = await fetch('/api/admin/buildings')
      if (response.ok) {
        const data = await response.json()
        setBuildings(data.buildings || [])
      }
    } catch (error) {
      console.error('Error fetching buildings:', error)
    }
  }

  const fetchFacilities = async () => {
    setLoading(true)
    setError(null)
    try {
      if (selectedBuilding === 'all') {
        // Fetch facilities from all buildings (would need a new API endpoint)
        setFacilities([])
        setError('Please select a building to view facilities')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/building/${selectedBuilding}/facility`)
      if (!response.ok) {
        throw new Error('Failed to fetch facilities')
      }

      const data = await response.json()
      setFacilities(data.data || [])
    } catch (error: any) {
      console.error('Error fetching facilities:', error)
      setError(error.message || 'Failed to load facilities')
      toast.error('Failed to load facilities')
    } finally {
      setLoading(false)
    }
  }

  const fetchReservations = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch all reservations (would need a new API endpoint)
      // For now, show message
      setReservations([])
      setError('Reservation API endpoint needs to be implemented')
    } catch (error: any) {
      console.error('Error fetching reservations:', error)
      setError(error.message || 'Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveReservation = async (reservationId: string) => {
    try {
      const response = await fetch(`/api/facility/reservation/${reservationId}/approve`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to approve reservation')
      }

      toast.success('Reservation approved')
      fetchReservations()
    } catch (error: any) {
      console.error('Error approving reservation:', error)
      toast.error(error.message || 'Failed to approve reservation')
    }
  }

  const handleRejectReservation = async (reservationId: string) => {
    try {
      const response = await fetch(`/api/facility/reservation/${reservationId}/reject`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to reject reservation')
      }

      toast.success('Reservation rejected')
      fetchReservations()
    } catch (error: any) {
      console.error('Error rejecting reservation:', error)
      toast.error(error.message || 'Failed to reject reservation')
    }
  }

  if (loading && facilities.length === 0 && reservations.length === 0) {
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Public Facility Management</h1>
              <p className="text-gray-600 mt-1">Manage facilities and review reservation requests</p>
            </div>
            <div className="flex space-x-3">
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

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('facilities')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'facilities'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CogIcon className="h-5 w-5 inline mr-2" />
              Facilities
            </button>
            <button
              onClick={() => setActiveTab('reservations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reservations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BellIcon className="h-5 w-5 inline mr-2" />
              Reservations
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'calendar'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CalendarIcon className="h-5 w-5 inline mr-2" />
              Calendar
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            {/* Building Filter */}
            <div className="mb-6">
              <label htmlFor="building-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Select Building
              </label>
              <select
                id="building-filter"
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">All Buildings</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Facilities List */}
            {facilities.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Facilities Found</h3>
                <p className="text-gray-500">
                  {selectedBuilding === 'all' 
                    ? 'Please select a building to view facilities'
                    : 'No facilities have been created for this building'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {facilities.map((facility) => (
                  <div key={facility.id} className="bg-white shadow rounded-lg p-6">
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
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Building:</span> {facility.building.name}
                          </p>
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reservations' && (
          <div>
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Reservation Requests</h2>
              </div>
              <div className="p-6 text-center text-gray-500">
                <p>Reservation management will be implemented here</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div>
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Facility Calendar</h2>
              </div>
              <div className="p-6 text-center text-gray-500">
                <p>Calendar view will be implemented here</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

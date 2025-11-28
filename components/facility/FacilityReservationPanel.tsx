'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import { ClockIcon, CalendarIcon, CheckCircleIcon, XCircleIcon, PencilIcon } from '@heroicons/react/24/outline'

interface Facility {
  id: string
  name: string
  description: string | null
  type: string | null
  floorNumber: number | null
  capacity: number | null
  operatingHours: Array<{
    dayOfWeek: number
    openTime: string
    closeTime: string
    isClosed: boolean | null
  }>
}

interface Reservation {
  id: string
  facilityId: string
  householdId: string
  startTime: string
  endTime: string
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  purpose: string | null
  notes: string | null
  accessCode: string | null
  facility: {
    id: string
    name: string
  }
  household: {
    id: string
    name: string
    apartmentNo: string | null
  }
}

interface FacilityReservationPanelProps {
  householdId: string
}

export default function FacilityReservationPanel({ householdId }: FacilityReservationPanelProps) {
  const { t } = useLanguage()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [purpose, setPurpose] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchFacilities()
    fetchReservations()
  }, [householdId])

  const fetchFacilities = async () => {
    try {
      const response = await fetch(`/api/household/${householdId}/facilities`)
      const data = await response.json()
      if (data.success) {
        setFacilities(data.data)
      }
    } catch (error) {
      console.error('Error fetching facilities:', error)
    }
  }

  const fetchReservations = async () => {
    try {
      // Fetch all reservations for all facilities
      const allReservations: Reservation[] = []
      for (const facility of facilities) {
        const response = await fetch(`/api/facility/${facility.id}/reservations?includePending=true`)
        const data = await response.json()
        if (data.success) {
          // Filter to only this household's reservations
          const householdReservations = data.data.filter(
            (r: Reservation) => r.householdId === householdId
          )
          allReservations.push(...householdReservations)
        }
      }
      setReservations(allReservations.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ))
    } catch (error) {
      console.error('Error fetching reservations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReservation = async () => {
    if (!selectedFacility) return

    setSubmitting(true)
    try {
      const startDateTime = new Date(`${selectedDate}T${startTime}`)
      const endDateTime = new Date(`${selectedDate}T${endTime}`)

      const response = await fetch(`/api/facility/${selectedFacility.id}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          purpose: purpose || null,
          notes: notes || null,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setShowReservationModal(false)
        setSelectedFacility(null)
        setPurpose('')
        setNotes('')
        fetchReservations()
        alert(t('reservationCreated') || 'Reservation request created successfully')
      } else {
        alert(data.error || 'Failed to create reservation')
      }
    } catch (error) {
      console.error('Error creating reservation:', error)
      alert('Failed to create reservation')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5" />
      case 'rejected':
        return <XCircleIcon className="h-5 w-5" />
      default:
        return <ClockIcon className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('facilityReservations') || 'Facility Reservations'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('reserveBuildingFacilities') || 'Reserve building facilities like gym, meeting rooms, etc.'}
          </p>
        </div>
        {facilities.length > 0 && (
          <button
            onClick={() => setShowReservationModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <CalendarIcon className="h-5 w-5 mr-2" />
            {t('newReservation') || 'New Reservation'}
          </button>
        )}
      </div>

      {/* Facilities List */}
      {facilities.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {t('noFacilitiesAvailable') || 'No Facilities Available'}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('householdNotInBuilding') || 'This household does not belong to a building with facilities.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facilities.map((facility) => (
            <div
              key={facility.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedFacility(facility)
                setShowReservationModal(true)
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {facility.name}
                  </h3>
                  {facility.floorNumber && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('floor') || 'Floor'} {facility.floorNumber}
                    </p>
                  )}
                  {facility.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {facility.description}
                    </p>
                  )}
                </div>
                <PencilIcon className="h-5 w-5 text-gray-400" />
              </div>
              {facility.capacity && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {t('capacity') || 'Capacity'}: {facility.capacity}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reservations List */}
      {reservations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('myReservations') || 'My Reservations'}
          </h3>
          <div className="space-y-3">
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {reservation.facility.name}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                        {getStatusIcon(reservation.status)}
                        <span className="ml-1">{reservation.status}</span>
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {new Date(reservation.startTime).toLocaleString()} - {new Date(reservation.endTime).toLocaleTimeString()}
                    </p>
                    {reservation.purpose && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {t('purpose') || 'Purpose'}: {reservation.purpose}
                      </p>
                    )}
                    {reservation.accessCode && (
                      <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-1">
                        {t('accessCode') || 'Access Code'}: {reservation.accessCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      {showReservationModal && selectedFacility && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('newReservation') || 'New Reservation'} - {selectedFacility.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('date') || 'Date'}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('startTime') || 'Start Time'}
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('endTime') || 'End Time'}
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('purpose') || 'Purpose'} ({t('optional') || 'Optional'})
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder={t('purposePlaceholder') || 'e.g., Team meeting, Workout session'}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('notes') || 'Notes'} ({t('optional') || 'Optional'})
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder={t('notesPlaceholder') || 'Additional notes...'}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReservationModal(false)
                  setSelectedFacility(null)
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleCreateReservation}
                disabled={submitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? (t('submitting') || 'Submitting...') : (t('createReservation') || 'Create Reservation')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


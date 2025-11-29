'use client'

import { useState, useEffect } from 'react'
import { CubeIcon, PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from '@/components/LanguageProvider'

interface PackageLocker {
  id: string
  lockerNumber: number
  location?: string
  isOccupied: boolean
  packages: Array<{
    id: string
    packageNumber?: string
    description?: string
    checkedInAt?: string
    status: string
    household: {
      id: string
      name: string
      apartmentNo?: string
    }
  }>
}

interface Household {
  id: string
  name: string
  apartmentNo?: string
  floorNumber?: number
  unit?: string
}

interface PackageManagerProps {
  buildingId: string
}

export default function PackageManager({ buildingId }: PackageManagerProps) {
  const { t } = useLanguage()
  const [lockers, setLockers] = useState<PackageLocker[]>([])
  const [households, setHouseholds] = useState<Household[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedLocker, setSelectedLocker] = useState<PackageLocker | null>(null)
  const [formData, setFormData] = useState({
    lockerId: '',
    householdId: '',
    packageNumber: '',
    description: '',
  })

  useEffect(() => {
    fetchData()
  }, [buildingId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [lockersRes, householdsRes] = await Promise.all([
        fetch(`/api/building/${buildingId}/package-locker`),
        fetch(`/api/building/${buildingId}/households`),
      ])

      if (!lockersRes.ok || !householdsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const lockersData = await lockersRes.json()
      const householdsData = await householdsRes.json()

      setLockers(lockersData.data || [])
      setHouseholds(householdsData.households || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load package lockers')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePackage = async () => {
    try {
      if (!formData.lockerId || !formData.householdId) {
        toast.error(t('pleaseFillAllFields') || 'Please fill in all required fields')
        return
      }

      const response = await fetch(`/api/building/${buildingId}/package`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lockerId: formData.lockerId,
          householdId: formData.householdId,
          packageNumber: formData.packageNumber || undefined,
          description: formData.description || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create package')
      }

      const data = await response.json()
      toast.success(
        t('packageCreated') || `Package created. ${data.notificationsSent} notifications sent.`
      )
      
      setShowCreateModal(false)
      setFormData({ lockerId: '', householdId: '', packageNumber: '', description: '' })
      fetchData()
    } catch (error) {
      console.error('Error creating package:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create package')
    }
  }

  const handleLockerClick = (locker: PackageLocker) => {
    if (!locker.isOccupied) {
      setSelectedLocker(locker)
      setFormData(prev => ({ ...prev, lockerId: locker.id }))
      setShowCreateModal(true)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t('commonLoading') || 'Loading...'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {t('packageLockers') || 'Package Lockers'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('packageLockerDescription') || 'Click on an empty locker to assign a package to a household'}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {t('refresh') || 'Refresh'}
        </button>
      </div>

      {lockers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{t('noPackageLockers') || 'No package lockers configured'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {lockers.map((locker) => {
            const currentPackage = locker.packages[0]
            return (
              <div
                key={locker.id}
                onClick={() => handleLockerClick(locker)}
                className={`relative p-4 border-2 rounded-lg transition-all cursor-pointer ${
                  locker.isOccupied
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    #{locker.lockerNumber}
                  </span>
                  {locker.isOccupied ? (
                    <CheckIcon className="h-5 w-5 text-orange-500" />
                  ) : (
                    <CubeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                {locker.isOccupied && currentPackage ? (
                  <div className="text-xs space-y-1">
                    <div className="text-gray-600 dark:text-gray-400">
                      <strong>{t('household') || 'Household'}:</strong> {currentPackage.household.name}
                    </div>
                    {currentPackage.packageNumber && (
                      <div className="text-gray-600 dark:text-gray-400">
                        <strong>{t('tracking') || 'Tracking'}:</strong> {currentPackage.packageNumber}
                      </div>
                    )}
                    {currentPackage.description && (
                      <div className="text-gray-600 dark:text-gray-400 truncate">
                        {currentPackage.description}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t('empty') || 'Empty'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Package Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('assignPackage') || 'Assign Package'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setFormData({ lockerId: '', householdId: '', packageNumber: '', description: '' })
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('locker') || 'Locker'}
                </label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100">
                  #{selectedLocker?.lockerNumber}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('household') || 'Household'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.householdId}
                  onChange={(e) => setFormData(prev => ({ ...prev, householdId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                >
                  <option value="">{t('selectHousehold') || 'Select household'}</option>
                  {households.map((household) => (
                    <option key={household.id} value={household.id}>
                      {household.name} {household.apartmentNo ? `(${household.apartmentNo})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('packageNumber') || 'Tracking Number'} ({t('optional') || 'Optional'})
                </label>
                <input
                  type="text"
                  value={formData.packageNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, packageNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder={t('enterTrackingNumber') || 'Enter tracking number'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('description') || 'Description'} ({t('optional') || 'Optional'})
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder={t('enterDescription') || 'Enter package description'}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setFormData({ lockerId: '', householdId: '', packageNumber: '', description: '' })
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleCreatePackage}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                {t('assign') || 'Assign Package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


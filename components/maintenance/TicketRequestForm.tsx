'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, PaperClipIcon, CameraIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/components/LanguageProvider'
import { useHousehold } from '@/components/HouseholdProvider'
import toast from 'react-hot-toast'

interface TicketRequestFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function TicketRequestForm({
  isOpen,
  onClose,
  onSuccess,
}: TicketRequestFormProps) {
  const { t, currentLanguage } = useLanguage()
  const { household } = useHousehold()
  const [loading, setLoading] = useState(false)
  const [rooms, setRooms] = useState<Array<{ id: string; name: string }>>([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [photos, setPhotos] = useState<string[]>([]) // Array of base64 image strings
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'NORMAL',
    location: '', // Will store room ID
  })

  // Get translated categories and priorities using translation system
  const CATEGORIES = [
    { value: 'BUILDING_MAINTENANCE', label: t('buildingMaintenance') || 'Building Maintenance' },
    { value: 'HOUSE_CLEANING', label: t('houseCleaning') || 'House Cleaning' },
    { value: 'FOOD_ORDER', label: t('foodOrder') || 'Food Order' },
    { value: 'CAR_SERVICE', label: t('carService') || 'Car Service' },
    { value: 'APPLIANCE_REPAIR', label: t('applianceRepair') || 'Appliance Repair' },
    { value: 'WATER_FILTER', label: t('waterFilter') || 'Water Filter' },
    { value: 'SMART_HOME', label: t('smartHome') || 'Smart Home' },
    { value: 'OTHER', label: t('other') || 'Other' },
  ]

  const PRIORITIES = [
    { value: 'LOW', label: t('low') || 'Low' },
    { value: 'NORMAL', label: t('normal') || 'Normal' },
    { value: 'HIGH', label: t('high') || 'High' },
    { value: 'URGENT', label: t('urgent') || 'Urgent' },
  ]

  // Fetch rooms when form opens
  useEffect(() => {
    if (isOpen && household?.id) {
      fetchRooms()
    }
  }, [isOpen, household?.id])

  const fetchRooms = async () => {
    if (!household?.id) return
    
    setLoadingRooms(true)
    try {
      // Pass current language to get translated room names
      const response = await fetch(`/api/warehouse/rooms?householdId=${household.id}&language=${currentLanguage}`)
      if (response.ok) {
        const data = await response.json()
        setRooms(data.rooms || [])
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoadingRooms(false)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string
          setPhotos(prev => [...prev, base64])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!household?.id) {
      toast.error('No household selected')
      return
    }

    if (!formData.title || !formData.category) {
      toast.error('Title and category are required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/maintenance/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId: household.id,
          ...formData,
          photos: photos, // Include photos in request
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create ticket')
      }

      const { ticket } = await response.json()
      toast.success(`Ticket ${ticket.ticketNumber} created successfully`)
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'NORMAL',
        location: '',
      })
      setPhotos([])

      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (error: any) {
      console.error('Error creating ticket:', error)
      toast.error(error.message || 'Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('requestMaintenance')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('title')} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              required
              placeholder={t('ticketTitlePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('category')} *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">{t('selectCategory') || 'Select Category'}</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('priority')}
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('location')}
            </label>
            <select
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">{t('selectRoom') || 'Select Room'}</option>
              {loadingRooms ? (
                <option disabled>Loading rooms...</option>
              ) : rooms.length === 0 ? (
                <option disabled>{t('noRooms') || 'No rooms available'}</option>
              ) : (
                rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('photos') || 'Photos'} ({photos.length})
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
                    <CameraIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('addPhoto') || 'Add Photo'}
                    </span>
                  </div>
                </label>
              </div>
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder={t('descriptionPlaceholder')}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('submitting') : t('submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

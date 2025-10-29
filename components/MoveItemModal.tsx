'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from './LanguageProvider'
import { useHousehold } from './HouseholdProvider'

interface Item {
  id: string
  name: string
  description?: string
  quantity: number
  minQuantity: number
  imageUrl?: string
  category?: {
    id?: string
    name: string
    parent?: {
      name: string
    }
  }
  room?: {
    id?: string
    name: string
  }
  cabinet?: {
    id?: string
    name: string
  }
}

interface Category {
  id: string
  name: string
  level: number
  parent?: {
    id: string
    name: string
  }
  children?: Category[]
}

interface MoveItemModalProps {
  item: Item
  onClose: () => void
  onSuccess: () => void
}

export default function MoveItemModal({ item, onClose, onSuccess }: MoveItemModalProps) {
  const { t } = useLanguage()
  const { activeHouseholdId } = useHousehold()
  const [selectedRoom, setSelectedRoom] = useState(item.room?.id || '')
  const [selectedCabinet, setSelectedCabinet] = useState(item.cabinet?.id || '')
  const [selectedCategory, setSelectedCategory] = useState(item.category?.id || '')
  const [moveQuantity, setMoveQuantity] = useState(1)
  const [rooms, setRooms] = useState<Array<{id: string, name: string}>>([])
  const [cabinets, setCabinets] = useState<Array<{id: string, name: string}>>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchRooms()
    fetchCategories()
  }, [activeHouseholdId])

  useEffect(() => {
    if (selectedRoom) {
      fetchCabinets(selectedRoom)
    } else {
      setCabinets([])
      setSelectedCabinet('')
    }
  }, [selectedRoom])

  const fetchRooms = async () => {
    if (!activeHouseholdId) return

    try {
      const response = await fetch(`/api/rooms?householdId=${activeHouseholdId}`, { credentials: 'include' })
      if (response.ok) {
        const roomsData = await response.json()
        console.log('MoveItemModal - Rooms API response:', roomsData)
        
        // Handle different response formats
        const roomsArray = Array.isArray(roomsData) ? roomsData : 
                          roomsData.rooms || 
                          (roomsData.data ? roomsData.data : [])
        
        setRooms(roomsArray)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
      toast.error('Failed to load rooms.')
    }
  }

  const fetchCabinets = async (roomId: string) => {
    try {
      const response = await fetch(`/api/cabinets?roomId=${roomId}`, { credentials: 'include' })
      if (response.ok) {
        const cabinetsData = await response.json()
        console.log('MoveItemModal - Cabinets API response:', cabinetsData)
        
        // Handle different response formats
        const cabinetsArray = Array.isArray(cabinetsData) ? cabinetsData : 
                             cabinetsData.cabinets || 
                             (cabinetsData.data ? cabinetsData.data : [])
        
        setCabinets(cabinetsArray)
      }
    } catch (error) {
      console.error('Error fetching cabinets:', error)
      toast.error('Failed to load cabinets.')
    }
  }

  const fetchCategories = async () => {
    if (!activeHouseholdId) return

    try {
      const response = await fetch(`/api/categories?householdId=${activeHouseholdId}`, { credentials: 'include' })
      if (response.ok) {
        const categoriesData = await response.json()
        console.log('MoveItemModal - Categories API response:', categoriesData)
        
        // Handle different response formats
        const categoriesArray = Array.isArray(categoriesData) ? categoriesData : 
                               categoriesData.categories || 
                               (categoriesData.data ? categoriesData.data : [])
        
        setCategories(categoriesArray)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedRoom) {
      toast.error('Please select a room')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/items/${item.id}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          roomId: selectedRoom,
          cabinetId: selectedCabinet || null,
          categoryId: selectedCategory || null,
          quantity: moveQuantity
        })
      })

      if (response.ok) {
        toast.success('Item moved successfully!')
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to move item')
      }
    } catch (error) {
      console.error('Error moving item:', error)
      toast.error('Failed to move item')
    } finally {
      setIsLoading(false)
    }
  }

  const currentLocation = item.room?.name && item.cabinet?.name 
    ? `${item.room.name} → ${item.cabinet.name}`
    : item.room?.name || 'No location set'

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {t('moveItem')}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{item?.name || 'Unknown Item'}</h4>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Current location:</span> {currentLocation}
                </p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {t('qty')}: {item?.quantity || 0}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="room" className="block text-sm font-medium text-gray-700">
                {t('moveToRoom')} *
              </label>
              <select
                id="room"
                value={selectedRoom}
                onChange={(e) => {
                  setSelectedRoom(e.target.value)
                  setSelectedCabinet('')
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select Room</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cabinet" className="block text-sm font-medium text-gray-700">
                {t('cabinet')}
              </label>
              <select
                id="cabinet"
                value={selectedCabinet}
                onChange={(e) => setSelectedCabinet(e.target.value)}
                disabled={!selectedRoom}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Cabinet</option>
                {cabinets.map(cabinet => (
                  <option key={cabinet.id} value={cabinet.id}>{cabinet.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Keep Current Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {'  '.repeat(category.level - 1)}{category.name} (Level {category.level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="moveQuantity" className="block text-sm font-medium text-gray-700">
                {t('moveQuantity') || 'Quantity to Move'} *
              </label>
              <input
                type="number"
                id="moveQuantity"
                min="1"
                max={item.quantity}
                value={moveQuantity}
                onChange={(e) => setMoveQuantity(Math.max(1, Math.min(item.quantity, parseInt(e.target.value) || 1)))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Available: {item.quantity} | Moving: {moveQuantity}
              </p>
            </div>

            {selectedRoom && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-center">
                  <ArrowRightIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-800">
                    {t('moveConfirmation')}: {rooms.find(r => r.id === selectedRoom)?.name}
                    {selectedCabinet && ` → ${cabinets.find(c => c.id === selectedCabinet)?.name}`}
                    {selectedCategory && ` → ${categories.find(c => c.id === selectedCategory)?.name}`}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={isLoading}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                disabled={isLoading || !selectedRoom}
              >
                {isLoading ? t('moving') : t('move')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

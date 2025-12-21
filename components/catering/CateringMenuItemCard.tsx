'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShoppingCartIcon, ClockIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface CateringMenuItem {
  id: string
  name: string
  description?: string
  imageUrl?: string
  cost: number | string
  quantityAvailable: number
  isActive: boolean
  availableAllDay: boolean
  category?: {
    id: string
    name: string
  }
  timeSlots?: Array<{
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
  }>
}

interface CateringMenuItemCardProps {
  item: CateringMenuItem
  onAddToCart: (itemId: string, quantity: number) => Promise<void>
}

export default function CateringMenuItemCard({ item, onAddToCart }: CateringMenuItemCardProps) {
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    if (quantity <= 0) {
      toast.error('Please select a valid quantity')
      return
    }

    if (quantity > item.quantityAvailable) {
      toast.error(`Only ${item.quantityAvailable} available`)
      return
    }

    setIsAdding(true)
    try {
      await onAddToCart(item.id, quantity)
      toast.success(`Added ${quantity} ${item.name} to cart`)
      setQuantity(1)
    } catch (error) {
      toast.error('Failed to add to cart')
    } finally {
      setIsAdding(false)
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getAvailabilityText = () => {
    if (item.availableAllDay) {
      return 'Available all day'
    }
    if (item.timeSlots && item.timeSlots.length > 0) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const slot = item.timeSlots[0]
      if (slot.dayOfWeek === -1) {
        return `Available ${formatTime(slot.startTime)} - ${formatTime(slot.endTime)} daily`
      }
      return `Available ${formatTime(slot.startTime)} - ${formatTime(slot.endTime)} on ${days[slot.dayOfWeek]}`
    }
    return 'Check availability'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {item.imageUrl && (
        <div className="relative h-48 w-full">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {item.name}
          </h3>
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
            ${typeof item.cost === 'string' ? parseFloat(item.cost).toFixed(2) : item.cost.toFixed(2)}
          </span>
        </div>

        {item.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-4 mb-3 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <ClockIcon className="h-4 w-4" />
            <span>{getAvailabilityText()}</span>
          </div>
          {item.quantityAvailable > 0 ? (
            <span className="text-green-600 dark:text-green-400">
              {item.quantityAvailable} available
            </span>
          ) : (
            <span className="text-red-600 dark:text-red-400">
              Out of stock
            </span>
          )}
        </div>

        {item.quantityAvailable > 0 && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max={item.quantityAvailable}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(item.quantityAvailable, parseInt(e.target.value) || 1)))}
              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={handleAddToCart}
              disabled={isAdding || item.quantityAvailable === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ShoppingCartIcon className="h-5 w-5" />
              {isAdding ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

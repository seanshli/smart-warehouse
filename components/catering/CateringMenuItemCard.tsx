'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ShoppingCartIcon, ClockIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from '@/components/LanguageProvider'
import { useTranslation } from '@/lib/useTranslation'

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
  onAddToCart: (itemId: string, quantity: number, isVegetarian: boolean, spiceLevel: string) => Promise<void>
}

export default function CateringMenuItemCard({ item, onAddToCart }: CateringMenuItemCardProps) {
  const { currentLanguage } = useLanguage()
  const { translateText } = useTranslation()
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [isVegetarian, setIsVegetarian] = useState(false)
  const [spiceLevel, setSpiceLevel] = useState('no')
  const [translatedName, setTranslatedName] = useState(item.name)
  const [translatedDescription, setTranslatedDescription] = useState(item.description || '')

  // Translate item name and description when language changes
  useEffect(() => {
    const translateItem = async () => {
      if (item.name) {
        const translated = await translateText(item.name, currentLanguage)
        setTranslatedName(translated)
      }
      if (item.description) {
        const translated = await translateText(item.description, currentLanguage)
        setTranslatedDescription(translated)
      }
    }
    
    translateItem()
  }, [item.name, item.description, currentLanguage, translateText])

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
      await onAddToCart(item.id, quantity, isVegetarian, spiceLevel)
      toast.success(`Added ${quantity} ${translatedName} to cart`)
      setQuantity(1)
      setIsVegetarian(false)
      setSpiceLevel('no')
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
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={item.imageUrl}
            alt={translatedName}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {translatedName}
          </h3>
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
            ${typeof item.cost === 'string' ? parseFloat(item.cost).toFixed(2) : item.cost.toFixed(2)}
          </span>
        </div>

        {translatedDescription && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {translatedDescription}
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
          <div className="space-y-3">
            {/* Selection Options */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vegetarian:
                </label>
                <select
                  value={isVegetarian ? 'yes' : 'no'}
                  onChange={(e) => setIsVegetarian(e.target.value === 'yes')}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Spice Level:
                </label>
                <select
                  value={spiceLevel}
                  onChange={(e) => setSpiceLevel(e.target.value)}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="no">No</option>
                  <option value="1x pepper">1x Pepper</option>
                  <option value="2x pepper">2x Pepper</option>
                  <option value="3x pepper">3x Pepper</option>
                </select>
              </div>
            </div>

            {/* Quantity and Add Button */}
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
          </div>
        )}
      </div>
    </div>
  )
}

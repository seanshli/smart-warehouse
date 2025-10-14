'use client'

import { useState } from 'react'
import { PhotoIcon, CubeIcon } from '@heroicons/react/24/outline'
import { useLanguage } from './LanguageProvider'
import { translateCategoryName } from '@/lib/translations'

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
    name: string
  }
}

interface ItemCardProps {
  item: Item
  showCategory?: boolean
  showLocation?: boolean
  onEdit?: (item: Item) => void
  onMove?: (item: Item) => void
  onCheckout?: (item: Item) => void
  onHistory?: (item: Item) => void
  className?: string
}

export default function ItemCard({
  item,
  showCategory = false,
  showLocation = false,
  onEdit,
  onMove,
  onCheckout,
  onHistory,
  className = ''
}: ItemCardProps) {
  // Handle null or invalid items
  if (!item || !item.id || !item.name) {
    console.warn('ItemCard received invalid item:', item)
    return null
  }
  const { t, currentLanguage } = useLanguage()
  const [imageError, setImageError] = useState(false)

  // Debug logging for image URL
  console.log('ItemCard - Image URL:', item.imageUrl ? `${item.imageUrl.substring(0, 50)}...` : 'No image URL')

  // Function to translate room and cabinet names
  const translateLocationName = (name: string) => {
    const translations: Record<string, string> = {
      'Master Bedroom': t('masterBedroom'),
      '主臥室': t('masterBedroom'),
      'Default Cabinet': t('defaultCabinet'),
      '主櫃': t('defaultCabinet'),
      'Kitchen': t('kitchen'),
      '廚房': t('kitchen'),
      'Living Room': t('mainLivingArea'),
      '客廳': t('mainLivingArea'),
      'Garage': t('garage'),
      '車庫': t('garage'),
      '側櫥櫃': t('sideCabinet'),
      'Side Cabinet': t('sideCabinet'),
    }
    return translations[name] || name
  }

  const handleImageError = () => {
    console.log('Image failed to load:', item.imageUrl)
    setImageError(true)
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-start space-x-2 sm:space-x-3">
        {/* Item Photo */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            {item.imageUrl && !imageError ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={handleImageError}
                onLoad={() => setImageError(false)}
              />
            ) : (
              <PhotoIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
            )}
          </div>
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm truncate">
            {item.name}
          </h4>
          
          {item.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Quantity Badge */}
          <div className="flex items-center mt-2 space-x-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {t('qty')}: {item.quantity}
            </span>
            
            {/* Low Stock Warning */}
            {item.minQuantity > 0 && item.quantity <= item.minQuantity && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                {t('lowStock')}
              </span>
            )}
          </div>

          {/* Category and Location Info */}
          {(showCategory || showLocation) && (
            <div className="mt-2 space-y-1">
              {showCategory && item.category && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium">{t('category')}:</span>{' '}
                  {item.category.parent 
                    ? (item.category.parent as any).parent
                      ? `${translateCategoryName((item.category.parent as any).parent.name, currentLanguage)} > ${translateCategoryName(item.category.parent.name, currentLanguage)} > ${translateCategoryName(item.category.name, currentLanguage)}`
                      : `${translateCategoryName(item.category.parent.name, currentLanguage)} > ${translateCategoryName(item.category.name, currentLanguage)}`
                    : translateCategoryName(item.category.name, currentLanguage)
                  }
                </div>
              )}
              
              {showLocation && (item.room || item.cabinet) && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium">{t('whereIsThisItemStored')}:</span>{' '}
                  {item.room?.name ? translateLocationName(item.room.name) : ''}
                  {item.cabinet && ` → ${translateLocationName(item.cabinet.name)}`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {(onEdit || onMove || onCheckout || onHistory) && (
          <div className="flex flex-col space-y-2 bg-gray-50 p-2 rounded-lg">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Edit button clicked for item:', item)
                  console.log('Item name:', item?.name)
                  console.log('onEdit function:', onEdit)
                  if (item && onEdit) {
                    onEdit(item)
                  } else {
                    console.error('Item or onEdit is null/undefined')
                  }
                }}
                className="p-3 sm:p-2 text-blue-600 bg-blue-100 hover:text-blue-800 hover:bg-blue-200 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md"
                title={t('edit')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            
            {onMove && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Move button clicked for item:', item.name)
                  onMove(item)
                }}
                className="p-3 sm:p-2 text-green-600 bg-green-100 hover:text-green-800 hover:bg-green-200 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md"
                title={t('move')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            )}
            
            {onCheckout && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Checkout button clicked for item:', item.name)
                  onCheckout(item)
                }}
                className="p-3 sm:p-2 text-purple-600 bg-purple-100 hover:text-purple-800 hover:bg-purple-200 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md"
                title={t('checkout')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9.5M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
                </svg>
              </button>
            )}
            
            {onHistory && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('History button clicked for item:', item.name)
                  onHistory(item)
                }}
                className="p-3 sm:p-2 text-yellow-600 bg-yellow-100 hover:text-yellow-800 hover:bg-yellow-200 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md"
                title={t('history')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { PhotoIcon, CubeIcon } from '@heroicons/react/24/outline'
import { useLanguage } from './LanguageProvider'

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
  const { t } = useLanguage()
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-start space-x-3">
        {/* Item Photo */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            {item.imageUrl && !imageError ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={handleImageError}
                onLoad={() => setImageError(false)}
              />
            ) : (
              <PhotoIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
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
                    ? `${item.category.parent.name} > ${item.category.name}`
                    : item.category.name
                  }
                </div>
              )}
              
              {showLocation && (item.room || item.cabinet) && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium">{t('whereIsThisItemStored')}:</span>{' '}
                  {item.room?.name}
                  {item.cabinet && ` → ${item.cabinet.name}`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {(onEdit || onMove || onCheckout || onHistory) && (
          <div className="flex flex-col space-y-1">
            {onEdit && (
              <button
                onClick={() => onEdit(item)}
                className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title={t('edit')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            
            {onMove && (
              <button
                onClick={() => onMove(item)}
                className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                title={t('move')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            )}
            
            {onCheckout && (
              <button
                onClick={() => onCheckout(item)}
                className="p-1 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                title={t('checkout')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9.5M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
                </svg>
              </button>
            )}
            
            {onHistory && (
              <button
                onClick={() => onHistory(item)}
                className="p-1 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
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

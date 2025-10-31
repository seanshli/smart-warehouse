'use client'

import { useState, useEffect } from 'react'
import { PhotoIcon, CubeIcon } from '@heroicons/react/24/outline'
import { useLanguage } from './LanguageProvider'
import { translateCategoryName } from '@/lib/translations'
import { useTranslation } from '@/lib/useTranslation'

interface Item {
  id: string
  name: string
  description?: string
  quantity: number
  minQuantity: number
  imageUrl?: string
  category?: {
    id: string
    name: string
    parent?: {
      name: string
    }
  }
  room?: {
    id: string
    name: string
  }
  cabinet?: {
    id: string
    name: string
  }
  // Grouped item fields
  locations?: Array<{
    id: string
    quantity: number
    room: { id: string; name: string } | null
    cabinet: { id: string; name: string } | null
  }>
  totalQuantity?: number
  isLowStock?: boolean
  itemIds?: string[]
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
  const { translateText } = useTranslation()
  const [imageError, setImageError] = useState(false)
  const [translatedName, setTranslatedName] = useState(item.name)
  const [translatedDescription, setTranslatedDescription] = useState(item.description || '')

  // Debug logging for language context
  console.log('ItemCard - Current language:', currentLanguage)
  console.log('ItemCard - Translation for qty:', t('qty'))
  console.log('ItemCard - Translation for category:', t('category'))
  console.log('ItemCard - Translation for whereIsThisItemStored:', t('whereIsThisItemStored'))

  // Translate item content when language changes
  useEffect(() => {
    const translateContent = async () => {
      if (item.name) {
        const translated = await translateText(item.name, currentLanguage)
        setTranslatedName(translated)
      }
      if (item.description) {
        const translated = await translateText(item.description, currentLanguage)
        setTranslatedDescription(translated)
      }
    }
    
    translateContent()
  }, [item.name, item.description, currentLanguage, translateText])

  // Function to translate item names and descriptions dynamically
  const translateItemContent = (content: string) => {
    if (!content) return content
    
    // Return the already translated content
    if (content === item.name) return translatedName
    if (content === item.description) return translatedDescription
    
    return content
  }

  // Fallback translations in case the translation system fails
  const getFallbackTranslation = (key: string): string => {
    const fallbacks: Record<string, Record<string, string>> = {
      'en': {
        'qty': 'Qty',
        'category': 'Category',
        'whereIsThisItemStored': 'Where is this item stored?'
      },
      'tw': {
        'qty': '數量',
        'category': '分類',
        'whereIsThisItemStored': '此物品存放在哪裡？'
      },
      'ch': {
        'qty': '数量',
        'category': '分类',
        'whereIsThisItemStored': '此物品存放在哪里？'
      },
      'jp': {
        'qty': '数量',
        'category': 'カテゴリ',
        'whereIsThisItemStored': 'このアイテムはどこに保管されていますか？'
      }
    }
    
    const languageKey = currentLanguage === 'zh-TW' ? 'tw' : 
                       currentLanguage === 'zh' ? 'ch' : 
                       currentLanguage === 'ja' ? 'jp' : 'en'
    
    return fallbacks[languageKey]?.[key] || fallbacks['en'][key] || key
  }

  // Debug logging for image URL
  console.log('ItemCard - Image URL:', item.imageUrl ? `${item.imageUrl.substring(0, 50)}...` : 'No image URL')

  // Function to translate room and cabinet names dynamically
  const translateLocationName = (name: string) => {
    const translations: Record<string, Record<string, string>> = {
      'Master Bedroom': {
        'en': 'Master Bedroom',
        'tw': '主臥室',
        'ch': '主卧室',
        'jp': 'マスターベッドルーム'
      },
      '主臥室': {
        'en': 'Master Bedroom',
        'tw': '主臥室',
        'ch': '主卧室',
        'jp': 'マスターベッドルーム'
      },
      'Kitchen': {
        'en': 'Kitchen',
        'tw': '廚房',
        'ch': '厨房',
        'jp': 'キッチン'
      },
      '廚房': {
        'en': 'Kitchen',
        'tw': '廚房',
        'ch': '厨房',
        'jp': 'キッチン'
      },
      'Living Room': {
        'en': 'Living Room',
        'tw': '客廳',
        'ch': '客厅',
        'jp': 'リビングルーム'
      },
      '客廳': {
        'en': 'Living Room',
        'tw': '客廳',
        'ch': '客厅',
        'jp': 'リビングルーム'
      },
      'Garage': {
        'en': 'Garage',
        'tw': '車庫',
        'ch': '车库',
        'jp': 'ガレージ'
      },
      '車庫': {
        'en': 'Garage',
        'tw': '車庫',
        'ch': '车库',
        'jp': 'ガレージ'
      },
      'Kids Room': {
        'en': 'Kids Room',
        'tw': '兒童房',
        'ch': '儿童房',
        'jp': '子供部屋'
      },
      'Main Cabinet': {
        'en': 'Main Cabinet',
        'tw': '主櫥櫃',
        'ch': '主橱柜',
        'jp': 'メインキャビネット'
      },
      '主櫥櫃': {
        'en': 'Main Cabinet',
        'tw': '主櫥櫃',
        'ch': '主橱柜',
        'jp': 'メインキャビネット'
      },
      'Side Cabinet': {
        'en': 'Side Cabinet',
        'tw': '側櫥櫃',
        'ch': '侧橱柜',
        'jp': 'サイドキャビネット'
      },
      '側櫥櫃': {
        'en': 'Side Cabinet',
        'tw': '側櫥櫃',
        'ch': '侧橱柜',
        'jp': 'サイドキャビネット'
      },
      'Right Cabinet': {
        'en': 'Right Cabinet',
        'tw': '右櫥櫃',
        'ch': '右橱柜',
        'jp': '右キャビネット'
      },
      '右櫥櫃': {
        'en': 'Right Cabinet',
        'tw': '右櫥櫃',
        'ch': '右橱柜',
        'jp': '右キャビネット'
      },
      'Left Cabinet': {
        'en': 'Left Cabinet',
        'tw': '左櫥櫃',
        'ch': '左橱柜',
        'jp': '左キャビネット'
      },
      '左櫥櫃': {
        'en': 'Left Cabinet',
        'tw': '左櫥櫃',
        'ch': '左橱柜',
        'jp': '左キャビネット'
      }
    }
    
    const languageKey = currentLanguage === 'zh-TW' ? 'tw' : 
                       currentLanguage === 'zh' ? 'ch' : 
                       currentLanguage === 'ja' ? 'jp' : 'en'
    
    return translations[name]?.[languageKey] || name
  }

  const handleImageError = () => {
    console.log('Image failed to load:', item.imageUrl)
    setImageError(true)
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3 hover:shadow-md transition-shadow flex flex-col ${className}`}>
      <div className="flex items-start space-x-2 sm:space-x-3 flex-1">
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
            {translateItemContent(item.name)}
          </h4>
          
          {item.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {translateItemContent(item.description)}
            </p>
          )}

          {/* Quantity Badge */}
          <div className="flex items-center mt-2 space-x-2 flex-wrap">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {getFallbackTranslation('qty')}: {item.totalQuantity !== undefined ? item.totalQuantity : item.quantity}
            </span>
            
            {/* Low Stock Warning - use isLowStock flag if available, otherwise calculate */}
            {(item.isLowStock !== undefined 
              ? item.isLowStock 
              : (item.minQuantity > 0 && (item.totalQuantity !== undefined ? item.totalQuantity : item.quantity) <= item.minQuantity)
            ) && (
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
                  <span className="font-medium">{getFallbackTranslation('category')}:</span>{' '}
                  {item.category.parent 
                    ? (item.category.parent as any).parent
                      ? `${translateCategoryName((item.category.parent as any).parent.name, currentLanguage)} > ${translateCategoryName(item.category.parent.name, currentLanguage)} > ${translateCategoryName(item.category.name, currentLanguage)}`
                      : `${translateCategoryName(item.category.parent.name, currentLanguage)} > ${translateCategoryName(item.category.name, currentLanguage)}`
                    : translateCategoryName(item.category.name, currentLanguage)
                  }
                </div>
              )}
              
              {showLocation && (
                item.locations && item.locations.length > 0 ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <span className="font-medium">{getFallbackTranslation('whereIsThisItemStored')}:</span>
                    {item.locations.map((location, idx) => (
                      <div key={location.id} className="ml-2">
                        {location.room?.name ? translateLocationName(location.room.name) : ''}
                        {location.cabinet && ` → ${translateLocationName(location.cabinet.name)}`}
                        <span className="ml-1 text-gray-400">({location.quantity})</span>
                      </div>
                    ))}
                  </div>
                ) : (item.room || item.cabinet) && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium">{getFallbackTranslation('whereIsThisItemStored')}:</span>{' '}
                    {item.room?.name ? translateLocationName(item.room.name) : ''}
                    {item.cabinet && ` → ${translateLocationName(item.cabinet.name)}`}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Horizontal Layout at Bottom */}
      {(onEdit || onMove || onCheckout || onHistory) && (
        <div className="flex space-x-1 bg-gray-50 p-1 rounded-lg mt-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Edit button clicked for item:', item)
                  console.log('Item name:', item?.name)
                  console.log('onEdit function:', onEdit)
                  console.log('Button click event:', e)
                  if (item && onEdit) {
                    console.log('Calling onEdit with item:', item)
                    onEdit(item)
                  } else {
                    console.error('Item or onEdit is null/undefined')
                    console.error('Item:', item)
                    console.error('onEdit:', onEdit)
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
  )
}

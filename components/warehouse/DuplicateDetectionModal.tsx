'use client'

import { useState } from 'react'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '../LanguageProvider'

interface SimilarItem {
  id: string
  name: string
  description?: string
  quantity: number
  category?: {
    name: string
  }
  room?: {
    name: string
  }
  cabinet?: {
    name: string
  }
  similarity: number
}

interface DuplicateDetectionModalProps {
  newItemName: string
  newItemDescription?: string
  similarItems: SimilarItem[]
  onUseExisting: (item: SimilarItem) => void
  onCreateNew: () => void
  onClose: () => void
}

export default function DuplicateDetectionModal({
  newItemName,
  newItemDescription,
  similarItems,
  onUseExisting,
  onCreateNew,
  onClose
}: DuplicateDetectionModalProps) {
  const { t } = useLanguage()
  const [selectedItem, setSelectedItem] = useState<SimilarItem | null>(null)

  const handleUseExisting = () => {
    if (selectedItem) {
      onUseExisting(selectedItem)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh]">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-600" />
              {t('potentialDuplicate')}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">
                {t('newItem')}: {newItemName}
              </h4>
              {newItemDescription && (
                <p className="text-sm text-yellow-700">{newItemDescription}</p>
              )}
              <p className="text-sm text-yellow-700 mt-2">
                {t('similarItemsFound')}: {similarItems.length}
              </p>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto mb-6">
            <h4 className="font-medium text-gray-900 mb-3">{t('similarItems')}</h4>
            <div className="space-y-3">
              {similarItems.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedItem?.id === item.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{item.name}</h5>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{t('qty')}: {item.quantity}</span>
                        {item.category && (
                          <span>{t('category')}: {item.category.name}</span>
                        )}
                        {item.room && (
                          <span>{t('location')}: {item.room.name}
                            {item.cabinet && ` → ${item.cabinet.name}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {Math.round(item.similarity * 100)}% {t('similar')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={onCreateNew}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {t('createNewItem')}
            </button>
            {selectedItem && (
              <button
                onClick={handleUseExisting}
                className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {t('useExistingItem')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

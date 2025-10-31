'use client'

import { useState } from 'react'
import { XMarkIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from './LanguageProvider'

interface Item {
  id: string
  name: string
  quantity: number
  minQuantity?: number
}

interface QuantityAdjustModalProps {
  item: Item
  onClose: () => void
  onSuccess: () => void
}

export default function QuantityAdjustModal({ item, onClose, onSuccess }: QuantityAdjustModalProps) {
  const { t } = useLanguage()
  const [adjustment, setAdjustment] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (adjustment === 0) {
      toast.error(t('noQuantityChange') || 'No quantity change specified')
      return
    }

    const newQuantity = item.quantity + adjustment
    
    if (newQuantity < 0) {
      toast.error(t('invalidQuantity') || 'Quantity cannot be negative')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: newQuantity
        }),
      })

      if (response.ok) {
        toast.success(t('quantityUpdated') || 'Quantity updated successfully')
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || t('failedToUpdateQuantity') || 'Failed to update quantity')
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast.error(t('failedToUpdateQuantity') || 'Failed to update quantity')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {t('adjustQuantity') || 'Adjust Quantity'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span className="font-medium">{t('item')}:</span> {item.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">{t('currentQuantity')}:</span> {item.quantity}
            </p>
            {adjustment !== 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                <span className="font-medium">{t('newQuantity')}:</span>{' '}
                <span className={adjustment > 0 ? 'text-green-600' : 'text-red-600'}>
                  {item.quantity + adjustment}
                </span>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('adjustment') || 'Adjustment'}
              </label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setAdjustment(Math.max(adjustment - 1, -item.quantity))}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={adjustment <= -item.quantity}
                >
                  <MinusIcon className="h-5 w-5" />
                </button>
                
                <input
                  type="number"
                  value={adjustment}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    setAdjustment(Math.max(-item.quantity, value))
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-center text-lg font-medium"
                  min={-item.quantity}
                />
                
                <button
                  type="button"
                  onClick={() => setAdjustment(adjustment + 1)}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {adjustment > 0 ? `+${adjustment}` : adjustment}
                {adjustment !== 0 && ` = ${item.quantity + adjustment} total`}
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                disabled={isLoading}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
                disabled={isLoading || adjustment === 0}
              >
                {isLoading ? t('updating') : t('updateQuantity') || 'Update Quantity'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


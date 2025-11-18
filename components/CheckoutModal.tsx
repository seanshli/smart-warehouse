'use client'
// 取出物品模態框組件
// 用於從倉庫中取出物品（減少庫存），支援指定取出數量和原因說明

import { useState } from 'react'
import { XMarkIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from './LanguageProvider'

// 物品介面定義
interface Item {
  id: string // 物品 ID
  name: string // 物品名稱
  description?: string // 物品描述（可選）
  quantity: number // 當前數量
  minQuantity: number // 最小數量
  imageUrl?: string // 圖片 URL（可選）
  category?: {
    id?: string // 分類 ID（可選）
    name: string // 分類名稱
    parent?: {
      name: string // 父分類名稱
    }
  }
  room?: {
    id?: string // 房間 ID（可選）
    name: string // 房間名稱
  }
  cabinet?: {
    name: string // 櫃子名稱
  }
}

// 取出物品模態框屬性介面
interface CheckoutModalProps {
  item: Item // 要取出的物品
  onClose: () => void // 關閉回調
  onSuccess: () => void // 成功回調
}

export default function CheckoutModal({ item, onClose, onSuccess }: CheckoutModalProps) {
  const { t } = useLanguage() // 語言設定
  const [checkoutQuantity, setCheckoutQuantity] = useState(1) // 取出數量
  const [reason, setReason] = useState('') // 取出原因
  const [isLoading, setIsLoading] = useState(false) // 載入狀態

  // 處理提交取出請求
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 驗證取出數量
    if (checkoutQuantity <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }

    // 驗證取出數量不超過可用數量
    if (checkoutQuantity > item.quantity) {
      toast.error('Cannot checkout more items than available')
      return
    }

    setIsLoading(true)

    try {
      // 呼叫取出物品 API
      const response = await fetch(`/api/items/${item.id}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          quantity: checkoutQuantity, // 取出數量
          reason: reason.trim() || 'Checked out' // 取出原因
        })
      })

      if (response.ok) {
        toast.success(`Successfully checked out ${checkoutQuantity} ${checkoutQuantity === 1 ? 'item' : 'items'}!`)
        onSuccess() // 觸發成功回調
        onClose() // 關閉模態框
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to checkout item')
      }
    } catch (error) {
      console.error('Error checking out item:', error)
      toast.error('Failed to checkout item')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ShoppingCartIcon className="h-5 w-5 mr-2 text-primary-600" />
              {t('checkoutItem')}
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
              <p className="text-sm text-gray-600">
                <span className="font-medium">Available quantity:</span> {item.quantity}
              </p>
              {item.description && (
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                {t('checkoutQuantity')} *
              </label>
              <input
                type="number"
                id="quantity"
                min="1"
                max={item.quantity}
                value={checkoutQuantity}
                onChange={(e) => setCheckoutQuantity(parseInt(e.target.value) || 1)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Maximum: {item.quantity} {item.quantity === 1 ? 'item' : 'items'}
              </p>
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                {t('reason')}
              </label>
              <input
                type="text"
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Used, Gifted, Donated"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {checkoutQuantity > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">After checkout:</span> {item.quantity - checkoutQuantity} {item.quantity - checkoutQuantity === 1 ? 'item' : 'items'} remaining
                </p>
                {item.minQuantity > 0 && (item.quantity - checkoutQuantity) <= item.minQuantity && (
                  <p className="text-sm text-red-800 mt-1">
                    ⚠️ This will bring the item to or below minimum quantity ({item.minQuantity})
                  </p>
                )}
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
                disabled={isLoading || checkoutQuantity <= 0}
              >
                {isLoading ? t('checkingOut') : t('checkout')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
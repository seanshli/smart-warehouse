'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  item: {
    id: string
    name: string
    quantity: number
    room?: { name: string }
    cabinet?: { name: string }
  } | null
  onCheckoutSuccess?: () => void
}

export default function CheckoutModal({ isOpen, onClose, item, onCheckoutSuccess }: CheckoutModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item || quantity <= 0 || quantity > item.quantity) {
      toast.error('Invalid quantity')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/items/${item.id}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: quantity,
          reason: reason || null
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Successfully checked out ${quantity} ${item.name}`)
        
        // Reset form
        setQuantity(1)
        setReason('')
        
        // Close modal and refresh data
        onClose()
        if (onCheckoutSuccess) {
          onCheckoutSuccess()
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to checkout item')
      }
    } catch (error) {
      console.error('Error checking out item:', error)
      toast.error('An error occurred while checking out the item')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Checkout Item</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900">{item.name}</h4>
          <p className="text-sm text-gray-600">
            Available: {item.quantity} units
          </p>
          {item.room && (
            <p className="text-sm text-gray-600">
              Location: {item.room.name}
              {item.cabinet && ` • ${item.cabinet.name}`}
            </p>
          )}
        </div>

        <form onSubmit={handleCheckout} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quantity to Checkout
            </label>
            <input
              type="number"
              min="1"
              max={item.quantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Maximum: {item.quantity} units
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Used for project, Given to team member, etc."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || quantity <= 0 || quantity > item.quantity}
              className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Checkout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

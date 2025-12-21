'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useHousehold } from '../HouseholdProvider'

interface CartItem {
  menuItemId: string
  name: string
  imageUrl?: string
  quantity: number
  unitPrice: number
  subtotal: number
}

interface Cart {
  items: CartItem[]
  total: number
}

export default function CateringCheckout() {
  const router = useRouter()
  const { activeHouseholdId } = useHousehold()
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deliveryType, setDeliveryType] = useState<'immediate' | 'scheduled'>('immediate')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    try {
      const response = await fetch('/api/catering/cart')
      const data = await response.json()
      setCart(data)

      if (data.items.length === 0) {
        toast.error('Your cart is empty')
        router.push('/catering')
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMinDateTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 1) // Minimum 1 hour from now
    return now.toISOString().slice(0, 16)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!activeHouseholdId) {
      toast.error('Please select a household')
      return
    }

    if (deliveryType === 'scheduled') {
      if (!scheduledDate || !scheduledTime) {
        toast.error('Please select a delivery date and time')
        return
      }

      const scheduled = new Date(`${scheduledDate}T${scheduledTime}`)
      if (scheduled < new Date()) {
        toast.error('Scheduled time cannot be in the past')
        return
      }
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/catering/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId: activeHouseholdId,
          deliveryType,
          scheduledTime: deliveryType === 'scheduled' 
            ? `${scheduledDate}T${scheduledTime}:00`
            : null,
          notes: notes.trim() || null,
        }),
      })

      if (response.ok) {
        const order = await response.json()
        toast.success(`Order placed successfully! Order #${order.orderNumber}`)
        router.push(`/catering/orders/${order.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to place order')
      }
    } catch (error) {
      console.error('Error placing order:', error)
      toast.error('Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h2>

      {/* Order Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
        <div className="space-y-2">
          {cart.items.map((item) => (
            <div key={item.menuItemId} className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {item.name} × {item.quantity}
              </span>
              <span className="font-medium">${item.subtotal.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
            ${cart.total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Delivery Options */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Delivery Options</h3>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="deliveryType"
              value="immediate"
              checked={deliveryType === 'immediate'}
              onChange={(e) => setDeliveryType(e.target.value as 'immediate')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="font-medium">Immediate Delivery</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Order will be prepared and delivered as soon as possible
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="deliveryType"
              value="scheduled"
              checked={deliveryType === 'scheduled'}
              onChange={(e) => setDeliveryType(e.target.value as 'scheduled')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="font-medium">Schedule Delivery (預約)</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select a specific date and time for delivery
              </p>
            </div>
          </label>
        </div>

        {deliveryType === 'scheduled' && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <CalendarIcon className="inline h-4 w-4 mr-1" />
                Delivery Date & Time
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required={deliveryType === 'scheduled'}
                />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required={deliveryType === 'scheduled'}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Special Instructions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Special Instructions (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Any special requests or instructions..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Back to Cart
        </button>
        <button
          type="submit"
          disabled={submitting || cart.items.length === 0}
          className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </form>
  )
}

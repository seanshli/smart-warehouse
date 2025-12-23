'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCartIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useHousehold } from '@/components/HouseholdProvider'

interface CartItem {
  menuItemId: string
  name: string
  imageUrl?: string
  quantity: number
  unitPrice: number
  subtotal: number
  isVegetarian?: boolean
  spiceLevel?: string
}

interface Cart {
  items: CartItem[]
  total: number
}

export default function CateringCart() {
  const router = useRouter()
  const { household } = useHousehold()
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deliveryType, setDeliveryType] = useState<'immediate' | 'scheduled'>('immediate')
  const [scheduledTime, setScheduledTime] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    console.log('[CateringCart] Component mounted, loading cart...')
    loadCart()
    
    // Also reload cart when component becomes visible (handles navigation)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[CateringCart] Page became visible, reloading cart...')
        loadCart()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Reload cart when window gains focus (handles tab switching)
    const handleFocus = () => {
      console.log('[CateringCart] Window gained focus, reloading cart...')
      loadCart()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const loadCart = async () => {
    try {
      const response = await fetch('/api/catering/cart', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        console.log('[CateringCart] Loaded cart data:', data)
        console.log('[CateringCart] Cart items count:', data.items?.length || 0)
        console.log('[CateringCart] Cart total:', data.total || 0)
        
        // Ensure cart has items array and total
        if (data && typeof data === 'object') {
          const items = Array.isArray(data.items) ? data.items : []
          const total = typeof data.total === 'number' ? data.total : items.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0)
          
          console.log('[CateringCart] Setting cart state with', items.length, 'items')
          setCart({
            items,
            total,
          })
          
          // Log if cart is empty but we expected items
          if (items.length === 0 && data.items && data.items.length > 0) {
            console.error('[CateringCart] WARNING: Cart items array exists but is empty after processing!', data.items)
          }
        } else {
          console.warn('[CateringCart] Invalid cart data format:', data)
          setCart({ items: [], total: 0 })
        }
      } else {
        console.error('[CateringCart] Failed to load cart:', response.status, response.statusText)
        const errorText = await response.text().catch(() => '')
        console.error('[CateringCart] Error response:', errorText)
        setCart({ items: [], total: 0 })
      }
    } catch (error) {
      console.error('[CateringCart] Error loading cart:', error)
      setCart({ items: [], total: 0 })
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeItem(menuItemId)
      return
    }

    // Find the item to preserve its selection options
    const cartItem = cart.items.find(item => item.menuItemId === menuItemId)
    if (!cartItem) {
      toast.error('Item not found in cart')
      return
    }

    try {
      const response = await fetch(`/api/catering/cart/${menuItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          quantity: newQuantity,
          isVegetarian: cartItem.isVegetarian,
          spiceLevel: cartItem.spiceLevel,
        }),
      })

      if (response.ok) {
        const updatedCart = await response.json()
        setCart(updatedCart)
        toast.success('Cart updated')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update cart')
      }
    } catch (error) {
      console.error('Error updating cart:', error)
      toast.error('Failed to update cart')
    }
  }

  const removeItem = async (menuItemId: string, isVegetarian?: boolean, spiceLevel?: string) => {
    // Find the item to get its options for proper deletion
    const cartItem = cart.items.find(item => item.menuItemId === menuItemId)
    if (!cartItem) {
      toast.error('Item not found in cart')
      return
    }

    try {
      // For DELETE, we'll use the first matching item (API limitation)
      // In the future, we could enhance the API to accept options
      const response = await fetch(`/api/catering/cart/${menuItemId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        const updatedCart = await response.json()
        setCart(updatedCart)
        toast.success('Item removed from cart')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to remove item')
      }
    } catch (error) {
      console.error('Error removing item:', error)
      toast.error('Failed to remove item')
    }
  }

  const handleSubmitOrder = async () => {
    if (!household?.id) {
      toast.error('Please select a household')
      return
    }

    if (cart.items.length === 0) {
      toast.error('Cart is empty')
      return
    }

    if (deliveryType === 'scheduled' && !scheduledTime) {
      toast.error('Please select a scheduled delivery time')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/catering/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          householdId: household.id,
          deliveryType,
          scheduledTime: deliveryType === 'scheduled' ? scheduledTime : undefined,
          notes: notes.trim() || undefined,
        }),
      })

      if (response.ok) {
        const order = await response.json()
        toast.success(`Order ${order.orderNumber} submitted successfully!`)
        setCart({ items: [], total: 0 })
        // Use replace instead of push to avoid back button issues
        // Clear cart after successful submission
        try {
          await fetch('/api/catering/cart', {
            method: 'DELETE',
            credentials: 'include',
          })
        } catch (error) {
          console.error('Error clearing cart:', error)
        }
        
        // Navigate to order detail page
        setTimeout(() => {
          router.replace(`/catering/orders/${order.id}`)
        }, 100)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Order submission error:', errorData)
        toast.error(errorData.error || errorData.details || 'Failed to submit order')
      }
    } catch (error: any) {
      console.error('Error submitting order:', error)
      const errorMessage = error?.message || 'Failed to submit order. Please check your connection and try again.'
      toast.error(errorMessage)
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

  if (cart.items.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">Your cart is empty</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Add items from the menu to get started
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Shopping Cart</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Cart Items */}
      <div className="space-y-4">
        {cart.items.map((item, index) => (
          <div
            key={`${item.menuItemId}-${item.isVegetarian}-${item.spiceLevel}-${index}`}
            className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-20 w-20 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ${parseFloat(item.unitPrice?.toString() || '0').toFixed(2)} each
              </p>
              {(item.isVegetarian || (item.spiceLevel && item.spiceLevel !== 'no')) && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                  {item.isVegetarian && (
                    <div>Vegetarian: Yes</div>
                  )}
                  {item.spiceLevel && item.spiceLevel !== 'no' && (
                    <div>Spice Level: {item.spiceLevel}</div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  -
                </button>
                <span className="w-12 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  +
                </button>
              </div>
              <span className="w-24 text-right font-semibold text-gray-900 dark:text-white">
                ${parseFloat(item.subtotal?.toString() || '0').toFixed(2)}
              </span>
              <button
                onClick={() => removeItem(item.menuItemId, item.isVegetarian, item.spiceLevel)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Options */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delivery Options</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="deliveryType"
              value="immediate"
              checked={deliveryType === 'immediate'}
              onChange={(e) => setDeliveryType(e.target.value as 'immediate')}
              className="mr-3"
            />
            <span className="text-gray-900 dark:text-white">立即送達 (Immediate)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="deliveryType"
              value="scheduled"
              checked={deliveryType === 'scheduled'}
              onChange={(e) => setDeliveryType(e.target.value as 'scheduled')}
              className="mr-3"
            />
            <span className="text-gray-900 dark:text-white">預約送達 (Scheduled)</span>
          </label>
        </div>
        {deliveryType === 'scheduled' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Scheduled Delivery Time
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Special Instructions (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any special requests or instructions..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            ${parseFloat(cart.total?.toString() || '0').toFixed(2)}
          </span>
        </div>
        <button
          onClick={handleSubmitOrder}
          disabled={submitting || !household?.id}
          className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Submitting Order...' : 'Submit Order'}
        </button>
        {!household?.id && (
          <p className="mt-2 text-sm text-red-600 text-center">
            Please select a household to place an order
          </p>
        )}
      </div>
    </div>
  )
}

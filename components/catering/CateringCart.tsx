'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { TrashIcon, MinusIcon, PlusIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

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

export default function CateringCart() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    try {
      const response = await fetch('/api/catering/cart')
      const data = await response.json()
      setCart(data)
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return

    setUpdating(itemId)
    try {
      const response = await fetch(`/api/catering/cart/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      })

      if (response.ok) {
        const updatedCart = await response.json()
        setCart(updatedCart)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update cart')
      }
    } catch (error) {
      toast.error('Failed to update cart')
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (itemId: string) => {
    setUpdating(itemId)
    try {
      const response = await fetch(`/api/catering/cart/${itemId}`, {
        method: 'DELETE',
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
      toast.error('Failed to remove item')
    } finally {
      setUpdating(null)
    }
  }

  const clearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return

    try {
      const response = await fetch('/api/catering/cart', {
        method: 'DELETE',
      })

      if (response.ok) {
        setCart({ items: [], total: 0 })
        toast.success('Cart cleared')
      }
    } catch (error) {
      toast.error('Failed to clear cart')
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
        <ShoppingBagIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">Your cart is empty</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
        >
          Continue Shopping
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Shopping Cart</h2>
        <button
          onClick={clearCart}
          className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
        >
          Clear Cart
        </button>
      </div>

      <div className="space-y-4">
        {cart.items.map((item) => (
          <div
            key={item.menuItemId}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex gap-4"
          >
            {item.imageUrl && (
              <div className="relative h-24 w-24 flex-shrink-0">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover rounded"
                />
              </div>
            )}

            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {item.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                ${item.unitPrice.toFixed(2)} each
              </p>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                    disabled={updating === item.menuItemId || item.quantity <= 1}
                    className="p-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                    disabled={updating === item.menuItemId}
                    className="p-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>

                <span className="font-semibold text-gray-900 dark:text-white">
                  ${item.subtotal.toFixed(2)}
                </span>

                <button
                  onClick={() => removeItem(item.menuItemId)}
                  disabled={updating === item.menuItemId}
                  className="ml-auto p-2 text-red-600 hover:text-red-700 dark:text-red-400 disabled:opacity-50"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            ${cart.total.toFixed(2)}
          </span>
        </div>
        <button
          onClick={() => router.push('/catering/checkout')}
          className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium transition-colors"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  )
}

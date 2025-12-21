'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHousehold } from '@/components/HouseholdProvider'
import CateringOrderHistory from '@/components/catering/CateringOrderHistory'

export const dynamic = 'force-dynamic'

export default function CateringOrdersPage() {
  const router = useRouter()
  const { household } = useHousehold()
  const [orderId, setOrderId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Get orderId from URL search params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('orderId')
      if (id) {
        setOrderId(id)
        // Redirect to order detail page
        router.replace(`/catering/orders/${id}`)
        return
      }
    }
  }, [router])

  if (!mounted) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (orderId) {
    // Will redirect, show loading
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!household?.id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Please select a household to view orders</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CateringOrderHistory householdId={household.id} />
    </div>
  )
}

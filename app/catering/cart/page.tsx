'use client'

import { useEffect } from 'react'
import CateringCart from '@/components/catering/CateringCart'

export default function CateringCartPage() {
  useEffect(() => {
    // Force reload cart when page loads to ensure we have latest data
    console.log('[CateringCartPage] Page mounted, cart should load')
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <CateringCart />
    </div>
  )
}

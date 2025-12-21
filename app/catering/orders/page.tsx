'use client'

import { useHousehold } from '@/components/HouseholdProvider'
import CateringOrderHistory from '@/components/catering/CateringOrderHistory'

export default function CateringOrdersPage() {
  const { activeHouseholdId } = useHousehold()

  if (!activeHouseholdId) {
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
      <CateringOrderHistory householdId={activeHouseholdId} />
    </div>
  )
}

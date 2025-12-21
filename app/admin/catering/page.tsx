'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface CateringService {
  id: string
  buildingId?: string
  communityId?: string
  isActive: boolean
  building?: { id: string; name: string }
  community?: { id: string; name: string }
}

interface CateringCategory {
  id: string
  name: string
  description?: string
  displayOrder: number
  isActive: boolean
}

interface CateringMenuItem {
  id: string
  name: string
  description?: string
  imageUrl?: string
  cost: number | string
  quantityAvailable: number
  isActive: boolean
  category?: { id: string; name: string }
}

export default function AdminCateringPage() {
  const { data: session } = useSession()
  const [services, setServices] = useState<CateringService[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      // Fetch all buildings and communities to show which ones have services
      const [buildingsRes, communitiesRes] = await Promise.all([
        fetch('/api/admin/buildings'),
        fetch('/api/admin/communities'),
      ])

      const buildings = await buildingsRes.json()
      const communities = await communitiesRes.json()

      // For now, just show a message - in a real implementation, you'd fetch services
      setServices([])
    } catch (error) {
      console.error('Error loading services:', error)
    } finally {
      setLoading(false)
    }
  }

  const enableService = async (buildingId?: string, communityId?: string) => {
    try {
      const response = await fetch('/api/catering/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildingId, communityId, isActive: true }),
      })

      if (response.ok) {
        toast.success('Catering service enabled')
        loadServices()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to enable service')
      }
    } catch (error) {
      toast.error('Failed to enable service')
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Catering Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage catering services, menu items, and orders
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Service Management</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Enable catering service for buildings or communities. Once enabled, you can add menu items and categories.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
          To enable a service, use the API or create it directly in the database. The service will be available once created.
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> To enable catering service, you can:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>Use the API: POST /api/catering/service with buildingId or communityId</li>
            <li>Or create it directly in Supabase: INSERT INTO catering_services (building_id, is_active) VALUES (...)</li>
          </ul>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/catering"
            className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <h3 className="font-medium text-gray-900 dark:text-white">View Menu (Client View)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              See how the menu appears to users
            </p>
          </a>
          <a
            href="/catering/orders?admin=true"
            className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <h3 className="font-medium text-gray-900 dark:text-white">View All Orders</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage and track all orders
            </p>
          </a>
        </div>
      </div>
    </div>
  )
}

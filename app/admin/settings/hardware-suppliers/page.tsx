'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/components/LanguageProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  HomeIcon,
  CogIcon,
  ArrowLeftIcon,
  TruckIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Supplier {
  id: string
  name: string
  description?: string
  serviceTypes: string[]
  contactName?: string
  contactPhone?: string
  contactEmail?: string
}

export default function HardwareSuppliersPage() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const router = useRouter()
  const [hardwareTypes, setHardwareTypes] = useState<string[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [mappings, setMappings] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  useEffect(() => {
    fetchMappings()
  }, [])

  const fetchMappings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/hardware-suppliers')
      if (!response.ok) throw new Error('Failed to fetch mappings')

      const data = await response.json()
      setHardwareTypes(data.hardwareTypes || [])
      setSuppliers(data.suppliers || [])
      
      // Convert mappings array to object for easier manipulation
      const mappingsObj: Record<string, string[]> = {}
      data.mappings?.forEach((m: any) => {
        mappingsObj[m.supplierId] = m.hardwareTypes || []
      })
      setMappings(mappingsObj)
    } catch (error: any) {
      console.error('Error fetching mappings:', error)
      toast.error('Failed to load hardware-supplier mappings')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleMapping = (supplierId: string, hardwareType: string) => {
    setMappings(prev => {
      const currentTypes = prev[supplierId] || []
      const newTypes = currentTypes.includes(hardwareType)
        ? currentTypes.filter(t => t !== hardwareType)
        : [...currentTypes, hardwareType]
      
      return {
        ...prev,
        [supplierId]: newTypes
      }
    })
  }

  const handleSave = async (supplierId: string) => {
    setSaving(supplierId)
    try {
      const hardwareTypes = mappings[supplierId] || []
      
      const response = await fetch('/api/admin/hardware-suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, hardwareTypes })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save mapping')
      }

      toast.success('Hardware-supplier mapping saved successfully')
    } catch (error: any) {
      console.error('Error saving mapping:', error)
      toast.error(error.message || 'Failed to save mapping')
    } finally {
      setSaving(null)
    }
  }

  const getHardwareTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      APPLIANCE_REPAIR: 'Appliance Repair',
      WATER_FILTER: 'Water Filter',
      SMART_HOME: 'Smart Home',
      CAR_SERVICE: 'Car Service',
      AIR_CONDITIONING: 'Air Conditioning',
      ELEVATOR: 'Elevator',
      PLUMBING: 'Plumbing',
      ELECTRICAL: 'Electrical',
      HVAC: 'HVAC',
      SECURITY_SYSTEM: 'Security System',
      NETWORK_INFRASTRUCTURE: 'Network Infrastructure'
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/settings"
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Hardware-Supplier Mapping</h1>
                <p className="text-gray-600 mt-1">Configure which suppliers handle which hardware types</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/admin/settings"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <CogIcon className="h-4 w-4 mr-2" />
                Settings
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Admin Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {suppliers.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Suppliers Found</h3>
            <p className="text-gray-500 mb-4">Create suppliers first before mapping hardware types</p>
            <Link
              href="/admin/settings"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Go to Settings
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">{supplier.name}</h2>
                      {supplier.description && (
                        <p className="text-sm text-gray-500 mt-1">{supplier.description}</p>
                      )}
                      {supplier.contactName && (
                        <p className="text-xs text-gray-400 mt-1">
                          Contact: {supplier.contactName} {supplier.contactPhone && `(${supplier.contactPhone})`}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleSave(supplier.id)}
                      disabled={saving === supplier.id}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving === supplier.id ? 'Saving...' : 'Save Mapping'}
                    </button>
                  </div>
                </div>

                <div className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-700 mb-4">
                    Select hardware types this supplier can handle:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {hardwareTypes.map((hardwareType) => {
                      const isSelected = (mappings[supplier.id] || []).includes(hardwareType)
                      return (
                        <button
                          key={hardwareType}
                          onClick={() => handleToggleMapping(supplier.id, hardwareType)}
                          className={`flex items-center justify-between p-3 border-2 rounded-lg transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {getHardwareTypeLabel(hardwareType)}
                          </span>
                          {isSelected ? (
                            <CheckIcon className="h-5 w-5 text-blue-600" />
                          ) : (
                            <XMarkIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <TruckIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">How Hardware-Supplier Mapping Works</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  When a maintenance ticket is created with a category that routes to "External Supplier",
                  the system will automatically assign it to a supplier based on the hardware type mapping.
                  Multiple suppliers can handle the same hardware type.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

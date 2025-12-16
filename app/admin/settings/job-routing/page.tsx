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
  BuildingOfficeIcon,
  UserGroupIcon,
  TruckIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface JobRoutingConfig {
  [key: string]: 'INTERNAL_BUILDING' | 'INTERNAL_COMMUNITY' | 'EXTERNAL_SUPPLIER'
}

interface Supplier {
  id: string
  name: string
  serviceTypes: string[]
}

export default function JobRoutingPage() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const router = useRouter()
  const [jobCategories, setJobCategories] = useState<string[]>([])
  const [routingConfig, setRoutingConfig] = useState<JobRoutingConfig>({})
  const [supplierAssignments, setSupplierAssignments] = useState<Record<string, string>>({})
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchRoutingConfig()
  }, [])

  const fetchRoutingConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/job-routing')
      if (!response.ok) throw new Error('Failed to fetch routing configuration')

      const data = await response.json()
      setJobCategories(data.jobCategories || [])
      setRoutingConfig(data.routingConfig || {})
      setSupplierAssignments(data.supplierAssignments || {})
      setSuppliers(data.suppliers || [])
    } catch (error: any) {
      console.error('Error fetching routing config:', error)
      toast.error('Failed to load routing configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleRoutingChange = (category: string, routingType: string) => {
    setRoutingConfig(prev => ({
      ...prev,
      [category]: routingType as 'INTERNAL_BUILDING' | 'INTERNAL_COMMUNITY' | 'EXTERNAL_SUPPLIER'
    }))
    
    // Clear supplier assignment if routing type changes away from EXTERNAL_SUPPLIER
    if (routingType !== 'EXTERNAL_SUPPLIER') {
      setSupplierAssignments(prev => {
        const updated = { ...prev }
        delete updated[category]
        return updated
      })
    }
  }

  const handleSupplierChange = (category: string, supplierId: string) => {
    setSupplierAssignments(prev => ({
      ...prev,
      [category]: supplierId
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/job-routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          routingConfig,
          supplierAssignments 
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save configuration')
      }

      toast.success('Job routing configuration saved successfully')
    } catch (error: any) {
      console.error('Error saving routing config:', error)
      toast.error(error.message || 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const getRoutingTypeLabel = (type: string) => {
    switch (type) {
      case 'INTERNAL_BUILDING':
        return 'Building Level'
      case 'INTERNAL_COMMUNITY':
        return 'Community Level'
      case 'EXTERNAL_SUPPLIER':
        return 'External Supplier'
      default:
        return type
    }
  }

  const getRoutingTypeIcon = (type: string) => {
    switch (type) {
      case 'INTERNAL_BUILDING':
        return <BuildingOfficeIcon className="h-5 w-5" />
      case 'INTERNAL_COMMUNITY':
        return <UserGroupIcon className="h-5 w-5" />
      case 'EXTERNAL_SUPPLIER':
        return <TruckIcon className="h-5 w-5" />
      default:
        return null
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      BUILDING_MAINTENANCE: 'Building Maintenance',
      HOUSE_CLEANING: 'House Cleaning',
      FOOD_ORDER: 'Food Order',
      CAR_SERVICE: 'Car Service',
      APPLIANCE_REPAIR: 'Appliance Repair',
      WATER_FILTER: 'Water Filter',
      SMART_HOME: 'Smart Home',
      OTHER: 'Other'
    }
    return labels[category] || category
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
                <h1 className="text-3xl font-bold text-gray-900">Job Routing Configuration</h1>
                <p className="text-gray-600 mt-1">Configure how maintenance tickets are routed</p>
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
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Job Category Routing</h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure which level handles each maintenance ticket category
            </p>
          </div>

          <div className="px-6 py-4">
            <div className="space-y-4">
              {jobCategories.map((category) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {getCategoryLabel(category)}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {category}
                    </p>
                  </div>

                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-4">
                      {(['INTERNAL_BUILDING', 'INTERNAL_COMMUNITY', 'EXTERNAL_SUPPLIER'] as const).map((routingType) => (
                        <label
                          key={routingType}
                          className={`flex items-center space-x-2 cursor-pointer p-3 border-2 rounded-lg transition-colors ${
                            routingConfig[category] === routingType
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`routing-${category}`}
                            value={routingType}
                            checked={routingConfig[category] === routingType}
                            onChange={(e) => handleRoutingChange(category, e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex items-center space-x-2">
                            {getRoutingTypeIcon(routingType)}
                            <span className="text-sm font-medium text-gray-700">
                              {getRoutingTypeLabel(routingType)}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                    
                    {/* Supplier Selection for EXTERNAL_SUPPLIER */}
                    {routingConfig[category] === 'EXTERNAL_SUPPLIER' && (
                      <div className="ml-4 mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assign to Supplier:
                        </label>
                        <select
                          value={supplierAssignments[category] || ''}
                          onChange={(e) => handleSupplierChange(category, e.target.value)}
                          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select a supplier...</option>
                          {suppliers
                            .filter(supplier => 
                              !supplier.serviceTypes || 
                              supplier.serviceTypes.length === 0 ||
                              supplier.serviceTypes.includes(category)
                            )
                            .map((supplier) => (
                              <option key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </option>
                            ))}
                        </select>
                        {supplierAssignments[category] && (
                          <p className="mt-1 text-xs text-gray-500">
                            Selected supplier will be auto-assigned to tickets of this category
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CogIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">How Routing Works</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Building Level:</strong> Tickets are handled by building-specific working crews</li>
                  <li><strong>Community Level:</strong> Tickets are handled by community-wide working crews</li>
                  <li><strong>External Supplier:</strong> Tickets are routed to external suppliers based on hardware type</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from './LanguageProvider'
import { useHousehold } from './HouseholdProvider'
import LocationSelector from './LocationSelector'
import { 
  HomeIcon, 
  MapPinIcon, 
  UserGroupIcon, 
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface HouseholdData {
  id: string
  name: string
  description: string | null
  country: string | null
  city: string | null
  district: string | null
  community: string | null
  apartmentNo: string | null
  latitude: number | null
  longitude: number | null
  address: string | null
  telephone: string | null
  members: Array<{
    id: string
    role: string
    user: {
      id: string
      name: string | null
      email: string
    }
  }>
}

export default function HouseholdSettings() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const { activeHouseholdId } = useHousehold()
  const [household, setHousehold] = useState<HouseholdData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Home Assistant configuration
  const [haConfig, setHaConfig] = useState<{
    baseUrl: string
    accessToken: string
  } | null>(null)
  const [haLoading, setHaLoading] = useState(false)
  const [haSaving, setHaSaving] = useState(false)
  const [haError, setHaError] = useState<string | null>(null)
  const [haSuccess, setHaSuccess] = useState<string | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    country: '',
    city: '',
    district: '',
    community: '',
    apartmentNo: '',
    address: '',
    streetAddress: '',
    telephone: '',
    latitude: null as number | null,
    longitude: null as number | null
  })

  // Fetch household data
  const fetchHousehold = async () => {
    if (!activeHouseholdId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/user/household/${activeHouseholdId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch household data')
      }

      const data = await response.json()
      setHousehold(data)
      
      // Populate form data
      setFormData({
        name: data.name || '',
        description: data.description || '',
        country: data.country || '',
        city: data.city || '',
        district: data.district || '',
        community: data.community || '',
        apartmentNo: data.apartmentNo || '',
        address: data.address || '',
        streetAddress: data.streetAddress || '',
        telephone: data.telephone || '',
        latitude: data.latitude,
        longitude: data.longitude
      })
    } catch (err) {
      console.error('Error fetching household:', err)
      setError('Failed to load household information')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHousehold()
    fetchHAConfig()
  }, [activeHouseholdId])
  
  // Fetch Home Assistant configuration
  const fetchHAConfig = async () => {
    if (!activeHouseholdId) return
    
    try {
      setHaLoading(true)
      const response = await fetch(`/api/household/${activeHouseholdId}/homeassistant`)
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setHaConfig({
            baseUrl: data.config.baseUrl || '',
            accessToken: '', // Don't load token for security
          })
        } else {
          setHaConfig(null)
        }
      }
    } catch (err) {
      console.error('Error fetching HA config:', err)
    } finally {
      setHaLoading(false)
    }
  }
  
  // Save Home Assistant configuration
  const handleSaveHAConfig = async () => {
    if (!activeHouseholdId || !haConfig) return
    
    if (!haConfig.baseUrl || !haConfig.accessToken) {
      setHaError('Base URL and Access Token are required')
      return
    }
    
    try {
      setHaSaving(true)
      setHaError(null)
      setHaSuccess(null)
      
      const response = await fetch(`/api/household/${activeHouseholdId}/homeassistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseUrl: haConfig.baseUrl.trim(),
          accessToken: haConfig.accessToken.trim(),
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save Home Assistant configuration')
      }
      
      setHaSuccess('Home Assistant configuration saved successfully!')
      setTimeout(() => setHaSuccess(null), 3000)
    } catch (err) {
      console.error('Error saving HA config:', err)
      setHaError(err instanceof Error ? err.message : 'Failed to save Home Assistant configuration')
    } finally {
      setHaSaving(false)
    }
  }
  
  // Delete Home Assistant configuration
  const handleDeleteHAConfig = async () => {
    if (!activeHouseholdId || !confirm('Are you sure you want to remove Home Assistant configuration?')) return
    
    try {
      setHaSaving(true)
      setHaError(null)
      
      const response = await fetch(`/api/household/${activeHouseholdId}/homeassistant`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete Home Assistant configuration')
      }
      
      setHaConfig(null)
      setHaSuccess('Home Assistant configuration removed successfully!')
      setTimeout(() => setHaSuccess(null), 3000)
    } catch (err) {
      console.error('Error deleting HA config:', err)
      setHaError(err instanceof Error ? err.message : 'Failed to delete Home Assistant configuration')
    } finally {
      setHaSaving(false)
    }
  }

  // Handle form submission
  const handleSave = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    if (!activeHouseholdId) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/user/household/${activeHouseholdId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update household')
      }

      const updatedHousehold = await response.json()
      setHousehold(updatedHousehold)
      setEditing(false)
      setSuccess('Household information updated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error updating household:', err)
      setError(err instanceof Error ? err.message : 'Failed to update household')
    } finally {
      setSaving(false)
    }
  }

  // Handle location selection
  const handleLocationSelect = (location: {
    country: string
    city: string
    district: string
    community: string
    apartmentNo: string
    latitude?: number
    longitude?: number
    address?: string
  }) => {
    setFormData(prev => ({
      ...prev,
      ...location,
      latitude: location.latitude || null,
      longitude: location.longitude || null,
      address: location.address || ''
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading household information...</span>
      </div>
    )
  }

  if (!household) {
    return (
      <div className="text-center p-8">
        <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No household found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Please select a household to view its settings.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <HomeIcon className="h-6 w-6 text-primary-600 mr-3" />
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {t('householdSettings')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage your household information and location
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setEditing(false)
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                    ) : (
                      <CheckIcon className="h-4 w-4 mr-1" />
                    )}
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setEditing(true)
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Basic Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Household Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Enter household name"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {household.name || 'Not set'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  {editing ? (
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Enter household description"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {household.description || 'No description'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Location Information
              </h3>
              
              {editing ? (
                <LocationSelector
                  value={{
                    country: formData.country,
                    city: formData.city,
                    district: formData.district,
                    community: formData.community,
                    apartmentNo: formData.apartmentNo,
                    latitude: formData.latitude || undefined,
                    longitude: formData.longitude || undefined,
                    address: formData.address,
                    streetAddress: formData.streetAddress,
                    telephone: formData.telephone
                  }}
                  onChange={handleLocationSelect}
                />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600 dark:text-gray-400">Address:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {household.address || 'Not set'}
                    </span>
                  </div>
                  
                  {household.country && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Country:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">{household.country}</span>
                    </div>
                  )}
                  
                  {household.city && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">City:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">{household.city}</span>
                    </div>
                  )}
                  
                  {household.district && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">District:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">{household.district}</span>
                    </div>
                  )}
                  
                  {household.community && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Community:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">{household.community}</span>
                    </div>
                  )}
                  
                  {household.apartmentNo && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Apartment:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">{household.apartmentNo}</span>
                    </div>
                  )}
                  
                  {household.telephone && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Telephone:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">{household.telephone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Members Section */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Household Members
            </h3>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {household.members.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                        <UserGroupIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {member.user.name || member.user.email}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {member.role.toLowerCase()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Home Assistant Configuration */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Home Assistant Configuration
            </h3>
            
            {haSuccess && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-200">{haSuccess}</p>
              </div>
            )}
            
            {haError && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-200">{haError}</p>
              </div>
            )}
            
            {haLoading ? (
              <div className="text-center py-4 text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Base URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={haConfig?.baseUrl || ''}
                    onChange={(e) => setHaConfig(prev => ({
                      baseUrl: e.target.value,
                      accessToken: prev?.accessToken || '',
                    }))}
                    placeholder="https://your-home-assistant-instance.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Your Home Assistant server URL (e.g., https://demoha.smtengo.com/)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Access Token <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={haConfig?.accessToken || ''}
                    onChange={(e) => setHaConfig(prev => ({
                      baseUrl: prev?.baseUrl || '',
                      accessToken: e.target.value,
                    }))}
                    placeholder="Enter your Long-Lived Access Token"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Long-Lived Access Token from Home Assistant Settings → People → Long-Lived Access Tokens
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveHAConfig}
                    disabled={haSaving || !haConfig?.baseUrl || !haConfig?.accessToken}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {haSaving ? 'Saving...' : haConfig?.baseUrl ? 'Update Configuration' : 'Save Configuration'}
                  </button>
                  {haConfig?.baseUrl && (
                    <button
                      onClick={handleDeleteHAConfig}
                      disabled={haSaving}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Remove Configuration
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


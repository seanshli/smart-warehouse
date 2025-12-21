'use client'

import { useState, useEffect } from 'react'
import { ShoppingBagIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from '@/components/LanguageProvider'

interface CateringService {
  id: string
  isActive: boolean
}

interface CateringToggleProps {
  buildingId?: string
  communityId?: string
  onEnabled?: () => void
}

export default function CateringToggle({ buildingId, communityId, onEnabled }: CateringToggleProps) {
  const { t } = useLanguage()
  const [service, setService] = useState<CateringService | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    loadService()
  }, [buildingId, communityId])

  const loadService = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (buildingId) params.append('buildingId', buildingId)
      if (communityId) params.append('communityId', communityId)

      const response = await fetch(`/api/catering/service?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setService(data.service)
      }
    } catch (error) {
      console.error('Error loading service:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleService = async () => {
    try {
      setToggling(true)

      if (service) {
        // Update existing service
        const response = await fetch('/api/catering/service', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: service.id,
            buildingId,
            communityId,
            isActive: !service.isActive,
          }),
        })

        if (response.ok) {
          const updated = await response.json()
          setService(updated)
          toast.success(updated.isActive ? t('cateringServiceEnabled') || 'Catering service enabled' : t('cateringServiceDisabled') || 'Catering service disabled')
          
          if (updated.isActive && onEnabled) {
            onEnabled()
          }
        } else {
          const error = await response.json()
          toast.error(error.error || t('cateringUpdateFailed') || 'Failed to update service')
        }
      } else {
        // Create new service
        const response = await fetch('/api/catering/service', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buildingId,
            communityId,
            isActive: true,
          }),
        })

        if (response.ok) {
          const newService = await response.json()
          setService(newService)
          toast.success(t('cateringServiceEnabled') || 'Catering service enabled')
          
          if (onEnabled) {
            onEnabled()
          }
        } else {
          const error = await response.json()
          toast.error(error.error || t('cateringEnableFailed') || 'Failed to enable service')
        }
      }
    } catch (error) {
      console.error('Error toggling service:', error)
      toast.error('Failed to toggle service')
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <div className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-500 bg-gray-50">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 mr-2"></div>
        Loading...
      </div>
    )
  }

  const isEnabled = service?.isActive || false

  return (
    <button
      onClick={toggleService}
      disabled={toggling}
      className={`inline-flex items-center px-3 py-1 border rounded-md text-xs font-medium transition-colors ${
        isEnabled
          ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
          : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
      } ${toggling ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <ShoppingBagIcon className={`h-3 w-3 mr-1 ${isEnabled ? 'text-green-600' : 'text-gray-500'}`} />
      {toggling ? (
        <span>{t('processing') || 'Processing...'}</span>
      ) : isEnabled ? (
        <span>{t('cateringServiceEnabled') || t('catering') + ' ' + 'Enabled'}</span>
      ) : (
        <span>{t('enableCatering') || 'Enable ' + t('catering')}</span>
      )}
    </button>
  )
}

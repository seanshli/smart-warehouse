'use client'

import { useState } from 'react'
import { useHousehold } from './HouseholdProvider'
import { useLanguage } from './LanguageProvider'
import { XMarkIcon, BuildingOfficeIcon, UserGroupIcon, MapPinIcon } from '@heroicons/react/24/outline'
import JoinRequestModal from './community/JoinRequestModal'
import toast from 'react-hot-toast'

interface CreateHouseholdModalProps {
  onClose: () => void
}

interface ExistingSuggestion {
  hasExisting: boolean
  building: {
    id: string
    name: string
    invitationCode: string
  } | null
  community: {
    id: string
    name: string
    invitationCode: string
  } | null
  message: string
}

export default function CreateHouseholdModal({ onClose }: CreateHouseholdModalProps) {
  const { refetch } = useHousehold()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: null as number | null,
    longitude: null as number | null,
  })
  const [suggestion, setSuggestion] = useState<ExistingSuggestion | null>(null)
  const [showJoinRequestModal, setShowJoinRequestModal] = useState(false)
  const [joinRequestTarget, setJoinRequestTarget] = useState<{
    type: 'community' | 'building'
    id: string
    name: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuggestion(null)

    try {
      const response = await fetch('/api/household/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create household')
      }

      // 如果返回建议信息，显示给用户
      // If suggestion is returned, show it to user
      if (data.suggestion && data.suggestion.hasExisting) {
        setSuggestion(data.suggestion)
        setLoading(false)
        return
      }

      // 成功创建
      // Successfully created
      toast.success('家庭创建成功')
      
      // Refresh household data to include the new household
      await refetch()
      
      // Close modal
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create household')
    } finally {
      setLoading(false)
    }
  }

  const handleSendJoinRequest = (type: 'community' | 'building', id: string, name: string) => {
    setJoinRequestTarget({ type, id, name })
    setShowJoinRequestModal(true)
  }

  const handleJoinRequestSuccess = () => {
    setShowJoinRequestModal(false)
    setJoinRequestTarget(null)
    setSuggestion(null)
    toast.success('加入请求已发送，等待管理员审核')
    onClose()
  }

  const handleCreateAnyway = async () => {
    // 用户选择无论如何都要创建
    // User chooses to create anyway
    setSuggestion(null)
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/household/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // 不包含位置信息，强制创建新的
          // Don't include location info, force create new
          latitude: null,
          longitude: null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create household')
      }

      toast.success('家庭创建成功')
      await refetch()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create household')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {t('createNewHousehold') || 'Create New Household'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Household Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder={t('enterHouseholdName') || 'Enter household name'}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('description') || 'Description'}
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder={t('enterDescription') || 'Enter description (optional)'}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              {t('cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></span>
                  {t('creating') || 'Creating...'}
                </>
              ) : (
                t('create') || 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

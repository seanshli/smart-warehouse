'use client'

import { useState } from 'react'
import { useLanguage } from '../LanguageProvider'
import {
  XMarkIcon,
  InformationCircleIcon,
  BuildingOfficeIcon,
  HomeIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface CreateAnnouncementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  source: 'SYSTEM' | 'COMMUNITY' | 'BUILDING'
  sourceId?: string | null
  sourceName?: string
  targetType?: 'ALL_HOUSEHOLDS' | 'COMMUNITY' | 'BUILDING' | 'SPECIFIC_HOUSEHOLD'
  targetId?: string | null
}

export default function CreateAnnouncementModal({
  isOpen,
  onClose,
  onSuccess,
  source,
  sourceId,
  sourceName,
  targetType = 'ALL_HOUSEHOLDS',
  targetId
}: CreateAnnouncementModalProps) {
  const { t } = useLanguage()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [selectedTargetType, setSelectedTargetType] = useState<'ALL_HOUSEHOLDS' | 'COMMUNITY' | 'BUILDING' | 'SPECIFIC_HOUSEHOLD'>(targetType || 'ALL_HOUSEHOLDS')
  const [selectedTargetId, setSelectedTargetId] = useState(targetId || '')
  const [expiresAt, setExpiresAt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !message.trim()) {
      toast.error(t('pleaseFillAllFields') || 'Please fill all required fields')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          sourceId: sourceId || null,
          title: title.trim(),
          message: message.trim(),
          targetType: selectedTargetType,
          targetId: selectedTargetType === 'ALL_HOUSEHOLDS' ? null : selectedTargetId || null,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create announcement')
      }

      toast.success(t('announcementCreated') || 'Announcement created successfully')
      setTitle('')
      setMessage('')
      setExpiresAt('')
      setSelectedTargetType(targetType)
      setSelectedTargetId(targetId || '')
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error creating announcement:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to create announcement')
    } finally {
      setSubmitting(false)
    }
  }

  const getSourceIcon = () => {
    switch (source) {
      case 'SYSTEM':
        return <InformationCircleIcon className="h-6 w-6 text-blue-600" />
      case 'COMMUNITY':
        return <HomeIcon className="h-6 w-6 text-green-600" />
      case 'BUILDING':
        return <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
    }
  }

  const getSourceColor = () => {
    switch (source) {
      case 'SYSTEM':
        return 'border-blue-200 bg-blue-50'
      case 'COMMUNITY':
        return 'border-green-200 bg-green-50'
      case 'BUILDING':
        return 'border-purple-200 bg-purple-50'
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className={`px-6 py-4 border-b ${getSourceColor()}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getSourceIcon()}
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('createAnnouncement') || 'Create Announcement'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            {sourceName && (
              <p className="mt-1 text-sm text-gray-600">
                {t('source') || 'Source'}: {sourceName}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('title') || 'Title'} *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  required
                  maxLength={200}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('message') || 'Message'} *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  required
                  maxLength={2000}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {message.length}/2000 {t('characters') || 'characters'}
                </p>
              </div>

              {/* Target Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('targetAudience') || 'Target Audience'}
                </label>
                <select
                  value={selectedTargetType}
                  onChange={(e) => {
                    setSelectedTargetType(e.target.value as any)
                    if (e.target.value === 'ALL_HOUSEHOLDS') {
                      setSelectedTargetId('')
                    }
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="ALL_HOUSEHOLDS">
                    {t('allHouseholds') || 'All Households'}
                  </option>
                  {source === 'SYSTEM' && (
                    <>
                      <option value="COMMUNITY">
                        {t('specificCommunity') || 'Specific Community'}
                      </option>
                      <option value="BUILDING">
                        {t('specificBuilding') || 'Specific Building'}
                      </option>
                    </>
                  )}
                  {source === 'COMMUNITY' && (
                    <option value="BUILDING">
                      {t('specificBuilding') || 'Specific Building'}
                    </option>
                  )}
                  <option value="SPECIFIC_HOUSEHOLD">
                    {t('specificHousehold') || 'Specific Household'}
                  </option>
                </select>
              </div>

              {/* Target ID (if needed) */}
              {(selectedTargetType === 'COMMUNITY' || 
                selectedTargetType === 'BUILDING' || 
                selectedTargetType === 'SPECIFIC_HOUSEHOLD') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {selectedTargetType === 'COMMUNITY' && (t('communityId') || 'Community ID')}
                    {selectedTargetType === 'BUILDING' && (t('buildingId') || 'Building ID')}
                    {selectedTargetType === 'SPECIFIC_HOUSEHOLD' && (t('householdId') || 'Household ID')}
                  </label>
                  <input
                    type="text"
                    value={selectedTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    required={(selectedTargetType as string) !== 'ALL_HOUSEHOLDS'}
                    placeholder={
                      selectedTargetType === 'COMMUNITY' ? (t('enterCommunityId') || 'Enter community ID') :
                      selectedTargetType === 'BUILDING' ? (t('enterBuildingId') || 'Enter building ID') :
                      (t('enterHouseholdId') || 'Enter household ID')
                    }
                  />
                </div>
              )}

              {/* Expiration Date (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('expirationDate') || 'Expiration Date'} ({t('optional') || 'Optional'})
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? (t('sending') || 'Sending...') : (t('sendAnnouncement') || 'Send Announcement')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}



'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, BellIcon, EnvelopeIcon, CubeIcon } from '@heroicons/react/24/outline'
import { useLanguage } from './LanguageProvider'
import { useHousehold } from './HouseholdProvider'

interface Announcement {
  id: string
  title: string
  message: string
  source: 'SYSTEM' | 'COMMUNITY' | 'BUILDING'
  sourceId?: string | null
  createdAt: string
  isRead?: boolean
}

interface ReceptionAnnouncementDialogProps {
  announcement: Announcement | null
  onClose: () => void
  onMarkAsRead?: (announcementId: string) => void
}

export default function ReceptionAnnouncementDialog({
  announcement,
  onClose,
  onMarkAsRead
}: ReceptionAnnouncementDialogProps) {
  const { t } = useLanguage()
  const { household } = useHousehold()
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (announcement && !announcement.isRead && onMarkAsRead) {
      // Auto-mark as read when dialog is shown
      onMarkAsRead(announcement.id)
    }
  }, [announcement, onMarkAsRead])

  if (!announcement) return null

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200)
  }

  // Determine icon and color based on announcement title/message
  const getAnnouncementType = () => {
    const title = announcement.title.toLowerCase()
    const message = announcement.message.toLowerCase()
    
    if (title.includes('visitor') || title.includes('訪客') || message.includes('doorbell') || message.includes('門鈴')) {
      return {
        icon: BellIcon,
        color: 'bg-purple-50 border-purple-200',
        iconColor: 'text-purple-600',
        badgeColor: 'bg-purple-100 text-purple-800'
      }
    }
    if (title.includes('mail') || title.includes('郵件') || message.includes('mailbox') || message.includes('郵箱')) {
      return {
        icon: EnvelopeIcon,
        color: 'bg-blue-50 border-blue-200',
        iconColor: 'text-blue-600',
        badgeColor: 'bg-blue-100 text-blue-800'
      }
    }
    if (title.includes('package') || title.includes('包裹') || message.includes('locker') || message.includes('儲物櫃')) {
      return {
        icon: CubeIcon,
        color: 'bg-green-50 border-green-200',
        iconColor: 'text-green-600',
        badgeColor: 'bg-green-100 text-green-800'
      }
    }
    
    return {
      icon: BellIcon,
      color: 'bg-gray-50 border-gray-200',
      iconColor: 'text-gray-600',
      badgeColor: 'bg-gray-100 text-gray-800'
    }
  }

  const announcementType = getAnnouncementType()
  const Icon = announcementType.icon

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto transition-opacity ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
          onClick={handleClose}
        />

        {/* Dialog */}
        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${isClosing ? 'scale-95' : 'scale-100'}`}>
          {/* Header */}
          <div className={`px-6 py-4 border-b ${announcementType.color}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Icon className={`h-6 w-6 ${announcementType.iconColor}`} />
                <h3 className="text-lg font-semibold text-gray-900">
                  {announcement.title}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <div className="mb-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {announcement.message}
              </p>
            </div>

            {/* Metadata */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {new Date(announcement.createdAt).toLocaleString(
                    t('locale') === 'zh-TW' ? 'zh-TW' : 
                    t('locale') === 'zh' ? 'zh-CN' : 
                    t('locale') === 'ja' ? 'ja-JP' : 'en-US',
                    {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }
                  )}
                </span>
                {announcement.source === 'BUILDING' && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${announcementType.badgeColor}`}>
                    {t('building') || 'Building'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
            >
              {t('close') || 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


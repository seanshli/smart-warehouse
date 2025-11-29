'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from './LanguageProvider'
import { useHousehold } from './HouseholdProvider'
import {
  XMarkIcon,
  InformationCircleIcon,
  BuildingOfficeIcon,
  HomeIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Announcement {
  id: string
  source: 'SYSTEM' | 'COMMUNITY' | 'BUILDING'
  sourceId: string | null
  title: string
  message: string
  targetType: string
  targetId: string | null
  createdAt: string
  expiresAt: string | null
  creator: {
    id: string
    name: string | null
    email: string
  }
  isRead: boolean
}

interface AnnouncementBannerProps {
  householdId: string
}

export default function AnnouncementBanner({ householdId }: AnnouncementBannerProps) {
  const { t } = useLanguage()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [grouped, setGrouped] = useState<{
    SYSTEM: Announcement[]
    COMMUNITY: Announcement[]
    BUILDING: Announcement[]
  }>({ SYSTEM: [], COMMUNITY: [], BUILDING: [] })
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'SYSTEM' | 'COMMUNITY' | 'BUILDING'>('all')
  const [expanded, setExpanded] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (householdId) {
      fetchAnnouncements()
    }
  }, [householdId])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/announcements?householdId=${householdId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements || [])
        setGrouped(data.grouped || { SYSTEM: [], COMMUNITY: [], BUILDING: [] })
        setUnreadCount(data.unreadCount || 0)
      } else {
        console.error('Failed to fetch announcements:', response.status, response.statusText)
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (announcementId: string) => {
    try {
      const response = await fetch(`/api/announcements/${announcementId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdId })
      })

      if (response.ok) {
        // Update local state
        setAnnouncements(prev =>
          prev.map(a => a.id === announcementId ? { ...a, isRead: true } : a)
        )
        setGrouped(prev => ({
          SYSTEM: prev.SYSTEM.map(a => a.id === announcementId ? { ...a, isRead: true } : a),
          COMMUNITY: prev.COMMUNITY.map(a => a.id === announcementId ? { ...a, isRead: true } : a),
          BUILDING: prev.BUILDING.map(a => a.id === announcementId ? { ...a, isRead: true } : a)
        }))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Failed to mark announcement as read:', err)
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'SYSTEM':
        return <InformationCircleIcon className="h-5 w-5" />
      case 'COMMUNITY':
        return <HomeIcon className="h-5 w-5" />
      case 'BUILDING':
        return <BuildingOfficeIcon className="h-5 w-5" />
      default:
        return <InformationCircleIcon className="h-5 w-5" />
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'SYSTEM':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
      case 'COMMUNITY':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
      case 'BUILDING':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300'
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const displayedAnnouncements = activeTab === 'all'
    ? announcements.filter(a => !dismissedIds.has(a.id))
    : grouped[activeTab]?.filter(a => !dismissedIds.has(a.id)) || []

  if (loading) {
    return (
      <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">{t('commonLoading') || 'Loading announcements...'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-4">
      {/* Compact Banner View */}
      {!expanded && (
        <div
          className={`border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow ${
            unreadCount > 0 
              ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
          }`}
          onClick={() => setExpanded(true)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {t('announcements') || 'Announcements'}
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold text-white bg-blue-600 dark:bg-blue-500 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {announcements.length === 0
                  ? (t('noAnnouncements') || 'No announcements yet')
                  : (t('clickToView') || 'Click to view')}
              </span>
              <ClockIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>
      )}

      {/* Expanded View */}
      {expanded && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('announcements') || 'Announcements'}
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-1 text-xs font-semibold text-white bg-blue-600 dark:bg-blue-500 rounded-full">
                  {unreadCount} {t('unread') || 'unread'}
                </span>
              )}
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'all'
                  ? 'border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t('all') || 'All'} ({announcements.length})
            </button>
            <button
              onClick={() => setActiveTab('SYSTEM')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'SYSTEM'
                  ? 'border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t('system') || 'System'} ({grouped.SYSTEM?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('COMMUNITY')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'COMMUNITY'
                  ? 'border-b-2 border-green-600 dark:border-green-400 text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t('community') || 'Community'} ({grouped.COMMUNITY?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('BUILDING')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'BUILDING'
                  ? 'border-b-2 border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t('building') || 'Building'} ({grouped.BUILDING?.length || 0})
            </button>
          </div>

          {/* Announcements List */}
          <div className="max-h-96 overflow-y-auto">
            {displayedAnnouncements.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {t('noAnnouncements') || 'No announcements'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {displayedAnnouncements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      !announcement.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => {
                      if (!announcement.isRead) {
                        markAsRead(announcement.id)
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Source Icon */}
                      <div className={`flex-shrink-0 p-2 rounded-lg ${getSourceColor(announcement.source)}`}>
                        {getSourceIcon(announcement.source)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {announcement.title}
                              </h4>
                              {!announcement.isRead && (
                                <span className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
                              )}
                              {announcement.isRead && (
                                <CheckCircleIcon className="h-4 w-4 text-green-500 dark:text-green-400" />
                              )}
                            </div>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                              {announcement.message}
                            </p>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center space-x-1">
                                <ClockIcon className="h-3 w-3" />
                                <span>{formatDate(announcement.createdAt)}</span>
                              </div>
                              {announcement.creator && (
                                <span>
                                  {t('from') || 'From'}: {announcement.creator.name || announcement.creator.email}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDismissedIds(prev => new Set([...Array.from(prev), announcement.id]))
                            }}
                            className="flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}



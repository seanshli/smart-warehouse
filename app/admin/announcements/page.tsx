'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/components/LanguageProvider'
import { isSuperAdmin } from '@/lib/middleware/community-permissions'
import CreateAnnouncementModal from '@/components/admin/CreateAnnouncementModal'
import {
  PlusIcon,
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
  isActive: boolean
  creator: {
    id: string
    name: string | null
    email: string
  }
}

export default function AdminAnnouncementsPage() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'SYSTEM' | 'COMMUNITY' | 'BUILDING'>('all')

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      // For admin, we'll need a different endpoint that returns all announcements
      // For now, we'll use a placeholder - you'll need to create /api/admin/announcements
      const response = await fetch('/api/admin/announcements')
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements || [])
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err)
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'SYSTEM':
        return <InformationCircleIcon className="h-5 w-5 text-blue-600" />
      case 'COMMUNITY':
        return <HomeIcon className="h-5 w-5 text-green-600" />
      case 'BUILDING':
        return <BuildingOfficeIcon className="h-5 w-5 text-purple-600" />
      default:
        return <InformationCircleIcon className="h-5 w-5" />
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'SYSTEM':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'COMMUNITY':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'BUILDING':
        return 'bg-purple-50 border-purple-200 text-purple-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const filteredAnnouncements = filter === 'all'
    ? announcements
    : announcements.filter(a => a.source === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('announcements') || 'Announcements'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('manageAnnouncements') || 'Create and manage system announcements'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {t('createAnnouncement') || 'Create Announcement'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium ${
            filter === 'all'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('all') || 'All'} ({announcements.length})
        </button>
        <button
          onClick={() => setFilter('SYSTEM')}
          className={`px-4 py-2 text-sm font-medium ${
            filter === 'SYSTEM'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('system') || 'System'} ({announcements.filter(a => a.source === 'SYSTEM').length})
        </button>
        <button
          onClick={() => setFilter('COMMUNITY')}
          className={`px-4 py-2 text-sm font-medium ${
            filter === 'COMMUNITY'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('community') || 'Community'} ({announcements.filter(a => a.source === 'COMMUNITY').length})
        </button>
        <button
          onClick={() => setFilter('BUILDING')}
          className={`px-4 py-2 text-sm font-medium ${
            filter === 'BUILDING'
              ? 'border-b-2 border-purple-600 text-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('building') || 'Building'} ({announcements.filter(a => a.source === 'BUILDING').length})
        </button>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {t('noAnnouncements') || 'No announcements found'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 p-2 rounded-lg ${getSourceColor(announcement.source)}`}>
                  {getSourceIcon(announcement.source)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {announcement.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                        {announcement.message}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="h-3 w-3" />
                          <span>{formatDate(announcement.createdAt)}</span>
                        </div>
                        {announcement.creator && (
                          <span>
                            {t('from') || 'From'}: {announcement.creator.name || announcement.creator.email}
                          </span>
                        )}
                        {announcement.expiresAt && (
                          <span>
                            {t('expires') || 'Expires'}: {formatDate(announcement.expiresAt)}
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full ${
                          announcement.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {announcement.isActive ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateAnnouncementModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchAnnouncements()
          setShowCreateModal(false)
        }}
        source="SYSTEM"
      />
    </div>
  )
}



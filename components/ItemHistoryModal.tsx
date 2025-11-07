'use client'

import { useState, useEffect, useRef } from 'react'
import { XMarkIcon, ClockIcon, PlusIcon, PencilIcon, ArrowsRightLeftIcon, ShoppingCartIcon, ArrowDownTrayIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from './LanguageProvider'

// Voice Comment Player Component
function VoiceCommentPlayer({ audioUrl }: { audioUrl: string }) {
  const { t } = useLanguage()
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const togglePlayback = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl)
      audioRef.current.onended = () => {
        setIsPlaying(false)
      }
      audioRef.current.onpause = () => {
        setIsPlaying(false)
      }
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  return (
    <button
      type="button"
      onClick={togglePlayback}
      className="flex items-center space-x-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-md hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors text-sm"
      title={isPlaying ? t('pauseRecording') : t('playVoiceComment')}
    >
      {isPlaying ? (
        <>
          <PauseIcon className="h-4 w-4" />
          <span>{t('playingVoiceComment')}</span>
        </>
      ) : (
        <>
          <PlayIcon className="h-4 w-4" />
          <span>{t('playVoiceComment')}</span>
        </>
      )}
    </button>
  )
}

interface Item {
  id: string
  name: string
  description?: string
  quantity: number
  minQuantity: number
  imageUrl?: string
  category?: {
    id?: string
    name: string
    parent?: {
      name: string
    }
  }
  room?: {
    id?: string
    name: string
  }
  cabinet?: {
    name: string
  }
}

interface Activity {
  id: string
  action: string
  description: string
  voiceUrl?: string | null
  voiceTranscript?: string | null
  createdAt: string
  performedBy: string
  performer?: {
    name: string
    email: string
  }
  metadata?: any
}

interface ItemHistoryModalProps {
  item: Item
  onClose: () => void
}

export default function ItemHistoryModal({ item, onClose }: ItemHistoryModalProps) {
  const { t } = useLanguage()
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchItemHistory()
  }, [item.id])

  const fetchItemHistory = async () => {
    try {
      const response = await fetch(`/api/items/${item.id}/history`, { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      } else {
        const errorData = await response.json()
        console.error('History fetch failed:', response.status, errorData)
        toast.error(errorData.error || 'Failed to load item history')
      }
    } catch (error) {
      console.error('Error fetching item history:', error)
      toast.error('Failed to load item history')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
    } else if (diffInHours < 168) { // 7 days
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <PlusIcon className="h-4 w-4" />
      case 'updated':
        return <PencilIcon className="h-4 w-4" />
      case 'moved':
        return <ArrowsRightLeftIcon className="h-4 w-4" />
      case 'checkout':
        return <ShoppingCartIcon className="h-4 w-4" />
      case 'checkin':
        return <ArrowDownTrayIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'created':
        return 'text-green-600 bg-green-100'
      case 'updated':
        return 'text-blue-600 bg-blue-100'
      case 'moved':
        return 'text-purple-600 bg-purple-100'
      case 'checkout':
        return 'text-red-600 bg-red-100'
      case 'checkin':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh]">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-primary-600" />
              {t('itemHistory')}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{item?.name || 'Unknown Item'}</h4>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Current quantity:</span> {item.quantity}
              </p>
              {item.room && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Location:</span> {item.room.name}
                  {item.cabinet && ` → ${item.cabinet.name}`}
                </p>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading history...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No history found</h3>
                <p className="mt-1 text-sm text-gray-500">This item has no recorded activities yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.action)}`}>
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {activity.action?.replace('_', ' ') || 'Unknown Action'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(activity.createdAt)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.description}
                      </p>
                      {activity.voiceUrl && (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center space-x-2">
                            <VoiceCommentPlayer audioUrl={activity.voiceUrl} />
                          </div>
                          {activity.voiceTranscript && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-2">
                              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
                                {t('voiceTranscript') || 'Transcription'}:
                              </p>
                              <p className="text-sm text-blue-900 dark:text-blue-100 italic">
                                "{activity.voiceTranscript}"
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      {activity.performer && (
                        <p className="text-xs text-gray-500 mt-1">
                          by {activity.performer.name || activity.performer.email}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

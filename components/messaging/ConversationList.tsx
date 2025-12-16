'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ChatBubbleLeftRightIcon, EnvelopeIcon, CubeIcon, BellIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/components/LanguageProvider'
import { useHousehold } from '@/components/HouseholdProvider'
import FrontDeskChatButton from '@/components/maintenance/FrontDeskChatButton'

interface Conversation {
  id: string
  householdId: string
  household: {
    id: string
    name: string
    apartmentNo?: string
  }
  building?: {
    id: string
    name: string
  }
  type: string
  status: string
  messages: Array<{
    id: string
    content: string
    sender: {
      name: string
    }
    createdAt: string
  }>
  _count?: {
    messages: number
  }
  updatedAt: string
}

interface ConversationListProps {
  buildingId?: string
  communityId?: string
  onSelectConversation: (conversation: Conversation) => void
}

export default function ConversationList({ buildingId, communityId, onSelectConversation }: ConversationListProps) {
  const { t } = useLanguage()
  const { household } = useHousehold()
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
    // Poll for new conversations every 10 seconds
    const interval = setInterval(fetchConversations, 10000)
    return () => clearInterval(interval)
  }, [buildingId, communityId])

  const fetchConversations = async () => {
    try {
      const params = new URLSearchParams()
      if (buildingId) {
        params.append('buildingId', buildingId)
      }
      if (communityId) {
        params.append('communityId', communityId)
      }

      const response = await fetch(`/api/conversations?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch conversations')
      
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mail':
        return EnvelopeIcon
      case 'package':
        return CubeIcon
      case 'doorbell':
        return BellIcon
      default:
        return ChatBubbleLeftRightIcon
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'mail':
        return t('mail') || 'Mail'
      case 'package':
        return t('package') || 'Package'
      case 'doorbell':
        return t('doorBell') || 'Door Bell'
      case 'meal':
        return t('meal') || 'Meal'
      case 'taxi':
        return t('taxi') || 'Taxi'
      case 'reservation':
        return t('reservation') || 'Reservation'
      default:
        return t('general') || 'General'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {t('loading') || 'Loading conversations...'}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400 space-y-4">
        <p>{t('noConversations') || 'No conversations yet'}</p>
        {(household || buildingId) && (
          <div className="flex justify-center">
            <FrontDeskChatButton buildingId={buildingId} />
          </div>
        )}
      </div>
    )
  }

  return (
      <div className="space-y-2">
      {/* Front Desk Chat Button */}
      {(household || buildingId) && (
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <FrontDeskChatButton 
            buildingId={buildingId}
            className="w-full justify-center" 
          />
        </div>
      )}
      {conversations.map((conversation) => {
        const Icon = getTypeIcon(conversation.type)
        const lastMessage = conversation.messages[0]
        const unreadCount = conversation._count?.messages || 0

        return (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation)}
            className="w-full text-left p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <Icon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {conversation.household.name}
                    {conversation.household.apartmentNo && (
                      <span className="text-gray-500 dark:text-gray-400 ml-1">
                        ({conversation.household.apartmentNo})
                      </span>
                    )}
                  </h4>
                </div>
                {lastMessage && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {lastMessage.sender.name}: {lastMessage.content}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {getTypeLabel(conversation.type)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(conversation.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {unreadCount > 0 && (
                <div className="ml-2 flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-primary-600 rounded-full">
                    {unreadCount}
                  </span>
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}


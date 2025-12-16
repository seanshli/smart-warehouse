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
    _count?: {
      members: number
    }
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
  showAllHouseholds?: boolean // For admin: show all households even without conversations
}

export default function ConversationList({ buildingId, communityId, onSelectConversation, showAllHouseholds = false }: ConversationListProps) {
  const { t } = useLanguage()
  const { household } = useHousehold()
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [allHouseholds, setAllHouseholds] = useState<any[]>([])
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
    if (showAllHouseholds && buildingId) {
      fetchAllHouseholds()
      fetchAdmins()
    }
    // Poll for new conversations every 10 seconds
    const interval = setInterval(() => {
      fetchConversations()
      if (showAllHouseholds && buildingId) {
        fetchAllHouseholds()
        fetchAdmins()
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [buildingId, communityId, showAllHouseholds])

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

  const fetchAllHouseholds = async () => {
    try {
      if (!buildingId) return
      const response = await fetch(`/api/building/${buildingId}/households`)
      if (!response.ok) throw new Error('Failed to fetch households')
      const data = await response.json()
      // API returns { households: [...], floors: [...] }
      const households = data.households || []
      // Add _count for active/inactive status
      const householdsWithCount = households.map((h: any) => ({
        ...h,
        _count: {
          members: h.stats?.members || 0
        }
      }))
      setAllHouseholds(householdsWithCount)
    } catch (error) {
      console.error('Error fetching households:', error)
    }
  }

  const fetchAdmins = async () => {
    try {
      if (!buildingId) return
      const response = await fetch(`/api/building/${buildingId}/admins`)
      if (!response.ok) throw new Error('Failed to fetch admins')
      const data = await response.json()
      setAdmins(data.admins || [])
    } catch (error) {
      console.error('Error fetching admins:', error)
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

  // For admin view: show all households even without conversations
  const householdsWithConversations = new Set(conversations.map(c => c.householdId))
  const householdsWithoutConversations = showAllHouseholds 
    ? allHouseholds.filter(h => !householdsWithConversations.has(h.id))
    : []

  if (conversations.length === 0 && householdsWithoutConversations.length === 0) {
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
      {/* Front Desk Chat Buttons */}
      {communityId && (
        <div className="mb-2">
          <FrontDeskChatButton 
            communityId={communityId}
            className="w-full justify-center" 
          />
        </div>
      )}
      {buildingId && (
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <FrontDeskChatButton 
            buildingId={buildingId}
            className="w-full justify-center" 
          />
        </div>
      )}
      {!buildingId && !communityId && household && (
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <FrontDeskChatButton 
            className="w-full justify-center" 
          />
        </div>
      )}
      {/* Households with conversations */}
      {conversations.map((conversation) => {
        const Icon = getTypeIcon(conversation.type)
        const lastMessage = conversation.messages[0]
        const unreadCount = conversation._count?.messages || 0
        const isActive = (conversation.household as any)?._count?.members > 0

        return (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation)}
            className={`w-full text-left p-4 border rounded-lg transition-colors ${
              isActive
                ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <Icon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <h4 className={`font-semibold truncate ${
                      isActive 
                        ? 'text-gray-900 dark:text-gray-100' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {conversation.household.name}
                      {conversation.household.apartmentNo && (
                        <span className="text-gray-500 dark:text-gray-400 ml-1">
                          ({conversation.household.apartmentNo})
                        </span>
                      )}
                    </h4>
                    {isActive ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" title={t('active') || 'Active'} />
                    ) : (
                      <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0" title={t('inactive') || 'Inactive'} />
                    )}
                  </div>
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
      
      {/* Households without conversations (admin view) */}
      {showAllHouseholds && householdsWithoutConversations.length > 0 && (
        <>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('allHouseholds') || 'All Households'}
            </h3>
          </div>
          {householdsWithoutConversations.map((household) => {
            const isActive = (household._count?.members || 0) > 0
            return (
              <button
                key={household.id}
                onClick={async () => {
                  // Create conversation for this household
                  try {
                    const response = await fetch('/api/maintenance/front-desk-chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        householdId: household.id,
                        buildingId: buildingId,
                        initialMessage: 'Hello, I need assistance'
                      }),
                    })
                    if (response.ok) {
                      const { conversation } = await response.json()
                      onSelectConversation(conversation)
                    }
                  } catch (error) {
                    console.error('Error creating conversation:', error)
                  }
                }}
                className={`w-full text-left p-4 border rounded-lg transition-colors ${
                  isActive
                    ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <h4 className={`font-semibold truncate ${
                      isActive 
                        ? 'text-gray-900 dark:text-gray-100' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {household.name}
                      {household.apartmentNo && (
                        <span className="text-gray-500 dark:text-gray-400 ml-1">
                          ({household.apartmentNo})
                        </span>
                      )}
                    </h4>
                    {isActive ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" title={t('active') || 'Active'} />
                    ) : (
                      <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0" title={t('inactive') || 'Inactive'} />
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('startChat') || 'Start Chat'}
                  </span>
                </div>
              </button>
            )
          })}
        </>
      )}
      
      {/* Admin-to-Admin Messaging */}
      {showAllHouseholds && admins.length > 0 && (
        <>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('adminToAdmin') || 'Admin to Admin'}
            </h3>
          </div>
          {admins.map((admin) => {
            // Filter out current user
            const currentUserId = (session?.user as any)?.id
            if (admin.userId === currentUserId) return null
            
            return (
              <button
                key={admin.userId}
                onClick={async () => {
                  // Create admin-to-admin conversation using front-desk-chat API
                  // This will create a conversation that both admins can access
                  try {
                    const response = await fetch('/api/maintenance/front-desk-chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        buildingId: admin.type === 'building' ? admin.buildingId : buildingId,
                        communityId: admin.type === 'community' ? admin.communityId : communityId,
                        initialMessage: `Admin message to ${admin.name}`,
                      }),
                    })
                    if (response.ok) {
                      const { conversation } = await response.json()
                      onSelectConversation(conversation)
                    } else {
                      const errorData = await response.json()
                      console.error('Error creating admin conversation:', errorData)
                      alert(errorData.error || 'Failed to start chat')
                    }
                  } catch (error) {
                    console.error('Error creating admin conversation:', error)
                    alert('Failed to start chat')
                  }
                }}
                className="w-full text-left p-4 border rounded-lg transition-colors bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800"
              >
                <div className="flex items-center space-x-2">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 truncate">
                      {admin.name}
                    </h4>
                    <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                      {admin.type === 'building' 
                        ? `${admin.buildingName || 'Building'} ${admin.role}`
                        : admin.type === 'community'
                        ? `Community ${admin.role}`
                        : admin.role}
                    </p>
                  </div>
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {t('startChat') || 'Start Chat'}
                  </span>
                </div>
              </button>
            )
          })}
        </>
      )}
    </div>
  )
}


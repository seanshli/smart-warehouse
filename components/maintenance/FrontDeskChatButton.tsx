'use client'

import { useState } from 'react'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/components/LanguageProvider'
import { useHousehold } from '@/components/HouseholdProvider'
import { useSession } from 'next-auth/react'
import ChatInterface from '@/components/messaging/ChatInterface'
import toast from 'react-hot-toast'

interface FrontDeskChatButtonProps {
  ticketId?: string // Optional: if provided, links chat to maintenance ticket
  buildingId?: string // Optional: explicit building ID (for building-level front desk)
  communityId?: string // Optional: explicit community ID (for community-level front desk)
  className?: string
}

export default function FrontDeskChatButton({ ticketId, buildingId: propBuildingId, communityId, className = '' }: FrontDeskChatButtonProps) {
  const { t } = useLanguage()
  const { household } = useHousehold()
  const { data: session } = useSession()
  const [showChat, setShowChat] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRequestChat = async () => {
    // Use prop buildingId if provided, otherwise fall back to household's buildingId
    const effectiveBuildingId = propBuildingId || household?.buildingId

    if (!household?.id && !effectiveBuildingId && !communityId) {
      toast.error('No household or building context available')
      return
    }

    // For building/community admin context, we might not have a household
    // In that case, we need to handle it differently
    if (!household?.id && !effectiveBuildingId && !communityId) {
      toast.error('Cannot create front desk chat without household or building context')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/maintenance/front-desk-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId: household?.id || null, // May be null for admin context
          buildingId: effectiveBuildingId || null,
          communityId: communityId || null,
          ticketId: ticketId || null,
          initialMessage: ticketId 
            ? `I would like to discuss maintenance ticket ${ticketId}`
            : effectiveBuildingId 
              ? 'Hello, I need assistance from the building front desk'
              : communityId
              ? 'Hello, I need assistance from the community front desk'
              : 'Hello, I need assistance from the front desk'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create chat' }))
        const errorMessage = errorData.error || errorData.details || 'Failed to create chat'
        console.error('Front desk chat creation error:', errorData)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      if (!data.conversation || !data.conversation.id) {
        throw new Error('No conversation returned from server')
      }
      
      setConversationId(data.conversation.id)
      setShowChat(true)
      toast.success(t('chatStarted') || 'Chat started successfully')
    } catch (error: any) {
      console.error('Error creating front desk chat:', error)
      toast.error(error.message || t('chatError') || 'Failed to start chat')
    } finally {
      setLoading(false)
    }
  }

  // For admin context, we might not have a household but still need to show chat
  const effectiveHouseholdId: string | null | undefined = household?.id || null

  if (showChat && conversationId) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50">
        <ChatInterface
          conversationId={conversationId}
          householdId={effectiveHouseholdId}
          householdName="Front Desk"
          onClose={() => {
            setShowChat(false)
            setConversationId(null)
          }}
          showCallButtons={true}
        />
      </div>
    )
  }

  return (
    <button
      onClick={handleRequestChat}
      disabled={loading}
      className={`inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={t('chatWithFrontDesk')}
    >
      <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
      {loading ? t('connecting') : t('frontDesk')}
    </button>
  )
}

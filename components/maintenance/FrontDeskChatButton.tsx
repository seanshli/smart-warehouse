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
  className?: string
}

export default function FrontDeskChatButton({ ticketId, className = '' }: FrontDeskChatButtonProps) {
  const { t } = useLanguage()
  const { household } = useHousehold()
  const { data: session } = useSession()
  const [showChat, setShowChat] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRequestChat = async () => {
    if (!household?.id) {
      toast.error('No household selected')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/maintenance/front-desk-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId: household.id,
          buildingId: household.buildingId,
          ticketId: ticketId || null,
          initialMessage: ticketId 
            ? `I would like to discuss maintenance ticket ${ticketId}`
            : 'Hello, I need assistance from the front desk'
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create chat')
      }

      const { conversation } = await response.json()
      setConversationId(conversation.id)
      setShowChat(true)
    } catch (error: any) {
      console.error('Error creating front desk chat:', error)
      toast.error(error.message || 'Failed to start chat')
    } finally {
      setLoading(false)
    }
  }

  if (showChat && conversationId && household) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50">
        <ChatInterface
          conversationId={conversationId}
          householdId={household.id}
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
      disabled={loading || !household}
      className={`inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={t('chatWithFrontDesk')}
    >
      <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
      {loading ? t('connecting') : t('frontDesk')}
    </button>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeftIcon, HomeIcon } from '@heroicons/react/24/outline'
import ConversationList from '@/components/messaging/ConversationList'
import ChatInterface from '@/components/messaging/ChatInterface'
import { useLanguage } from '@/components/LanguageProvider'

interface Conversation {
  id: string
  householdId: string
  household: {
    id: string
    name: string
    apartmentNo?: string
  }
  type: string
  status: string
  messages: any[]
  _count?: {
    messages: number
  }
}

export default function BuildingMessagesPage() {
  const params = useParams()
  const router = useRouter()
  const { t, currentLanguage, setLanguage } = useLanguage()
  const { data: session } = useSession()
  const buildingId = params.id as string
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const isAdmin = (session?.user as any)?.isAdmin

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
  }

  const handleInitiateCall = async (callType: 'audio' | 'video') => {
    if (!selectedConversation) return

    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}/calls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callType }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle CALL_OCCUPIED error code
        if (data.errorCode === 'CALL_OCCUPIED') {
          const conflictInfo = data.conflict
          const activeCallInitiator = conflictInfo?.activeCallInitiator || 'another user'
          alert(
            t('callOccupied') || 
            `Call already active. Existing call initiated by ${activeCallInitiator}. Your call has been automatically rejected.`
          )
        } else {
          throw new Error(data.error || 'Failed to initiate call')
        }
        return
      }

      // TODO: Open video/audio call interface
      alert(`Call initiated: ${callType}`)
    } catch (error) {
      console.error('Error initiating call:', error)
      alert(error instanceof Error ? error.message : 'Failed to initiate call')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {t('back') || 'Back'}
              </button>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <HomeIcon className="h-5 w-5 mr-2" />
                  {t('backToAdminHome') || 'Back to Admin Home'}
                </Link>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                {t('commonLanguage') || 'Language'}:
              </label>
              <select
                value={currentLanguage}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="en">English</option>
                <option value="zh-TW">繁體中文</option>
                <option value="zh">简体中文</option>
                <option value="ja">日本語</option>
              </select>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('messages') || 'Messages'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('messagesDescription') || 'Communicate with households'}
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversation List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 h-full overflow-y-auto">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t('conversations') || 'Conversations'}
              </h2>
              <ConversationList
                buildingId={buildingId}
                onSelectConversation={handleSelectConversation}
              />
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="h-full">
                <ChatInterface
                  conversationId={selectedConversation.id}
                  householdId={selectedConversation.householdId}
                  householdName={
                    `${selectedConversation.household.name}${selectedConversation.household.apartmentNo ? ` (${selectedConversation.household.apartmentNo})` : ''}`
                  }
                  onClose={() => setSelectedConversation(null)}
                  onInitiateCall={handleInitiateCall}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-full flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <p className="text-lg mb-2">{t('selectConversation') || 'Select a conversation'}</p>
                  <p className="text-sm">{t('selectConversationHint') || 'Choose a conversation from the list to start messaging'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


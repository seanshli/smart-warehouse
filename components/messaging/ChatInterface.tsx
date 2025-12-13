'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { PaperAirplaneIcon, PhoneIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/components/LanguageProvider'
import { Capacitor } from '@capacitor/core'
import { NativeChat } from '@/lib/native-chat'
import toast from 'react-hot-toast'

interface Message {
  id: string
  content: string
  messageType: string
  senderId: string
  sender: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  readAt?: string | null
}

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
  messages: Message[]
  _count?: {
    messages: number
  }
}

interface ChatInterfaceProps {
  conversationId: string
  householdId: string
  householdName: string
  onClose?: () => void
  onInitiateCall?: (callType: 'audio' | 'video') => void
  showCallButtons?: boolean // Whether to show call initiation buttons
}

export default function ChatInterface({
  conversationId,
  householdId,
  householdName,
  onClose,
  onInitiateCall,
  showCallButtons = true,
}: ChatInterfaceProps) {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userId = (session?.user as any)?.id
  const [useNativeChat, setUseNativeChat] = useState(false)

  // Check if native chat is available and use it on mobile
  useEffect(() => {
    const checkNativeChat = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Try to use native chat on iOS/Android
          await NativeChat.showChat({
            conversationId,
            targetHouseholdId: householdId,
            targetHouseholdName: householdName,
          })
          setUseNativeChat(true)
          // Close web UI since native is showing
          if (onClose) {
            onClose()
          }
        } catch (error) {
          console.log('Native chat not available, using web UI:', error)
          setUseNativeChat(false)
        }
      }
    }
    checkNativeChat()
  }, [conversationId, householdId, householdName, onClose])

  // Don't render web UI if native chat is being used
  if (useNativeChat) {
    return null
  }

  // Set up real-time message updates
  useEffect(() => {
    if (!householdId) return

    const { useRealtime } = require('@/lib/useRealtime')
    // Note: We can't use hooks conditionally, so we'll use polling + realtime broadcast
    fetchMessages()
    
    // Poll for new messages every 2 seconds (reduced since we have realtime)
    const interval = setInterval(fetchMessages, 2000)
    
    // Also listen for real-time updates via EventSource
    const eventSource = new EventSource(`/api/realtime?householdId=${householdId}`, { withCredentials: true })
    
    eventSource.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data)
        if (update.type === 'message' && update.data?.conversationId === conversationId) {
          // New message received via realtime
          const newMessage = update.data.message
          setMessages(prev => {
            // Avoid duplicates
            if (prev.find(m => m.id === newMessage.id)) {
              return prev
            }
            return [...prev, newMessage]
          })
        }
      } catch (error) {
        console.error('Error parsing realtime message:', error)
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      clearInterval(interval)
      eventSource.close()
    }
  }, [conversationId, householdId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!messageText.trim() || sending) return

    try {
      setSending(true)
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageText.trim(),
          messageType: 'text',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      const data = await response.json()
      setMessages(prev => [...prev, data.message])
      setMessageText('')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {householdName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('chat') || 'Chat'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {showCallButtons && onInitiateCall && (
            <>
              <button
                onClick={() => onInitiateCall('audio')}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={t('audioCall') || 'Audio Call'}
              >
                <PhoneIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => onInitiateCall('video')}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={t('videoCall') || 'Video Call'}
              >
                <VideoCameraIcon className="h-5 w-5" />
              </button>
            </>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            {t('loading') || 'Loading messages...'}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            {t('noMessages') || 'No messages yet. Start the conversation!'}
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === userId
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {!isOwnMessage && (
                    <div className="text-xs font-medium mb-1 opacity-75">
                      {message.sender.name}
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Always visible */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 z-10 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('typeMessage') || 'Type a message...'}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={1}
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!messageText.trim() || sending}
            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}


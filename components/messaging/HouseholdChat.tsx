'use client'

/**
 * Household-to-Household Chat Component
 * Enables direct communication between household members
 */

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useHousehold } from '@/components/HouseholdProvider'
import { useLanguage } from '@/components/LanguageProvider'
import { PaperAirplaneIcon, PhoneIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Capacitor } from '@capacitor/core'
import { NativeChat } from '@/lib/native-chat'
import toast from 'react-hot-toast'
import { DoorBellWebRTC } from '@/lib/webrtc'
import { useRealtime } from '@/lib/useRealtime'

interface HouseholdChatProps {
  targetHouseholdId: string
  targetHouseholdName: string
  onClose?: () => void
}

export default function HouseholdChat({
  targetHouseholdId,
  targetHouseholdName,
  onClose,
}: HouseholdChatProps) {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const { household } = useHousehold()
  const [messages, setMessages] = useState<Array<{
    id: string
    content: string
    senderId: string
    senderName: string
    createdAt: string
  }>>([])
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [inCall, setInCall] = useState(false)
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [micEnabled, setMicEnabled] = useState(true)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const webrtcRef = useRef<DoorBellWebRTC | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userId = (session?.user as any)?.id
  const [useNativeChat, setUseNativeChat] = useState(false)

  // Check if native chat is available and use it on mobile
  useEffect(() => {
    const checkNativeChat = async () => {
      if (Capacitor.isNativePlatform() && household?.id) {
        try {
          // Try to use native chat on iOS/Android
          await NativeChat.showChat({
            conversationId: `household-${household.id}-${targetHouseholdId}`,
            targetHouseholdId,
            targetHouseholdName,
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
  }, [household?.id, targetHouseholdId, targetHouseholdName, onClose])

  // Don't render web UI if native chat is being used
  if (useNativeChat) {
    return null
  }

  // Set up real-time message updates
  useRealtime(household?.id || '', (update) => {
    if (update?.type === 'message' && update?.data?.targetHouseholdId === targetHouseholdId) {
      const newMessage = update.data.message
      setMessages(prev => {
        if (prev.find(m => m.id === newMessage.id)) {
          return prev
        }
        return [...prev, newMessage]
      })
    } else if (update?.type === 'webrtc-signaling' && update?.callId && webrtcRef.current) {
      // Handle WebRTC signaling
      console.log('WebRTC signaling received:', update.signalingType)
    } else if (update?.type === 'call' && update?.data?.targetHouseholdId === targetHouseholdId) {
      // Incoming call
      toast.success(`Incoming ${update.data.callType} call from ${targetHouseholdName}`)
    }
  })

  useEffect(() => {
    fetchMessages()
    scrollToBottom()
  }, [targetHouseholdId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      // Use conversation API or create a direct messaging endpoint
      const response = await fetch(`/api/household/${household?.id}/chat/${targetHouseholdId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!messageText.trim() || sending || !household?.id) return

    try {
      setSending(true)
      const response = await fetch(`/api/household/${household.id}/chat/${targetHouseholdId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageText.trim(),
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

  const initiateCall = async (type: 'audio' | 'video') => {
    if (!household?.id) return

    try {
      setCallType(type)
      setCameraEnabled(type === 'video')
      setMicEnabled(true)
      setInCall(true)

      // Create call session
      const callId = `household-${household.id}-${targetHouseholdId}-${Date.now()}`
      
      // Initialize WebRTC
      if (localVideoRef.current && remoteVideoRef.current) {
        webrtcRef.current = new DoorBellWebRTC({
          localVideoElement: localVideoRef.current,
          remoteVideoElement: remoteVideoRef.current,
          callId,
          callType: 'household',
          userId: userId || 'unknown',
          targetHouseholdId,
          onLocalStream: (stream) => {
            console.log('Local stream initialized')
          },
          onRemoteStream: (stream) => {
            console.log('Remote stream received')
          },
          onError: (error) => {
            console.error('WebRTC error:', error)
            toast.error('Call connection error')
          },
        })

        await webrtcRef.current.initializeLocalStream(type === 'video', true)
        await webrtcRef.current.createOffer()
      }

      // Broadcast call to target household
      const response = await fetch(`/api/household/${household.id}/chat/${targetHouseholdId}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callType: type,
          callId,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        // Handle CALL_OCCUPIED error code
        if (data.errorCode === 'CALL_OCCUPIED') {
          const conflictInfo = data.conflict
          const activeCallInitiator = conflictInfo?.activeCallInitiator || 'another user'
          toast.error(
            t('callOccupied') || 
            `Call already active. Existing call initiated by ${activeCallInitiator}. Your call has been automatically rejected.`
          )
        } else {
          throw new Error(data.error || 'Failed to initiate call')
        }
        setInCall(false)
        setCallType(null)
        return
      }
    } catch (error) {
      console.error('Error initiating call:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start call')
      setInCall(false)
      setCallType(null)
    }
  }

  const endCall = () => {
    if (webrtcRef.current) {
      webrtcRef.current.close()
      webrtcRef.current = null
    }
    setInCall(false)
    setCallType(null)
    setCameraEnabled(false)
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
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {targetHouseholdName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('chat') || 'Chat'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {!inCall && (
            <>
              <button
                onClick={() => initiateCall('audio')}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={t('audioCall') || 'Audio Call'}
              >
                <PhoneIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => initiateCall('video')}
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

      {/* Video/Audio Call View */}
      {inCall && (
        <div className="flex-1 relative bg-black">
          <div className="absolute inset-0 flex">
            {/* Remote Video */}
            <div className="flex-1">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            {/* Local Video */}
            {callType === 'video' && (
              <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          {/* Call Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
            <button
              onClick={() => {
                setCameraEnabled(!cameraEnabled)
                if (webrtcRef.current) {
                  webrtcRef.current.initializeLocalStream(!cameraEnabled, micEnabled)
                }
              }}
              className={`p-3 rounded-full ${cameraEnabled ? 'bg-gray-700' : 'bg-red-600'} text-white`}
            >
              <VideoCameraIcon className="h-6 w-6" />
            </button>
            <button
              onClick={() => {
                setMicEnabled(!micEnabled)
                if (webrtcRef.current) {
                  webrtcRef.current.initializeLocalStream(cameraEnabled, !micEnabled)
                }
              }}
              className={`p-3 rounded-full ${micEnabled ? 'bg-gray-700' : 'bg-red-600'} text-white`}
            >
              <PhoneIcon className="h-6 w-6" />
            </button>
            <button
              onClick={endCall}
              className="p-3 rounded-full bg-red-600 text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Messages (when not in call or as overlay) */}
      {!inCall && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.length === 0 ? (
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
                          {message.senderName}
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

          {/* Input - Always visible when not in call */}
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
        </>
      )}
    </div>
  )
}

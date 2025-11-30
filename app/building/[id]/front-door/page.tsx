'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useLanguage } from '@/components/LanguageProvider'
import { 
  HomeIcon, 
  PhoneIcon, 
  VideoCameraIcon,
  MicrophoneIcon,
  LockOpenIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface DoorBell {
  id: string
  doorBellNumber: string
  household: {
    id: string
    name: string
    apartmentNo: string | null
  } | null
  isEnabled: boolean
}

interface Building {
  id: string
  name: string
}

export default function FrontDoorPage() {
  const params = useParams()
  const buildingId = params.id as string
  const { t } = useLanguage()
  const [building, setBuilding] = useState<Building | null>(null)
  const [doorBells, setDoorBells] = useState<DoorBell[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoorBell, setSelectedDoorBell] = useState<DoorBell | null>(null)
  const [ringing, setRinging] = useState(false)
  const [inCall, setInCall] = useState(false)
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended' | null>(null)
  const [messages, setMessages] = useState<Array<{ id: string; text: string; from: 'guest' | 'household'; timestamp: Date }>>([])
  const [messageInput, setMessageInput] = useState('')
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [micEnabled, setMicEnabled] = useState(false)

  useEffect(() => {
    fetchBuildingData()
  }, [buildingId])

  const fetchBuildingData = async () => {
    try {
      setLoading(true)
      // Fetch building info (public endpoint)
      const buildingRes = await fetch(`/api/building/${buildingId}/public`)
      if (buildingRes.ok) {
        const buildingData = await buildingRes.json()
        setBuilding(buildingData.data)
      }

      // Fetch doorbells (public endpoint)
      const doorBellsRes = await fetch(`/api/building/${buildingId}/door-bell/public`)
      if (doorBellsRes.ok) {
        const doorBellsData = await doorBellsRes.json()
        setDoorBells(doorBellsData.data || [])
      }
    } catch (error) {
      console.error('Error fetching building data:', error)
      toast.error('Failed to load building information')
    } finally {
      setLoading(false)
    }
  }

  const handleRingDoorBell = async (doorBell: DoorBell) => {
    if (!doorBell.isEnabled) {
      toast.error('This doorbell is disabled')
      return
    }

    try {
      setRinging(true)
      setSelectedDoorBell(doorBell)
      setCallStatus('ringing')

      const response = await fetch(`/api/building/${buildingId}/door-bell/ring/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doorBellId: doorBell.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to ring doorbell')
      }

      const data = await response.json()
      toast.success('Doorbell rung! Waiting for response...')
      
      // Start polling for call status
      pollCallStatus(doorBell.id)
    } catch (error) {
      console.error('Error ringing doorbell:', error)
      toast.error('Failed to ring doorbell')
      setRinging(false)
      setCallStatus(null)
    }
  }

  const pollCallStatus = async (doorBellId: string) => {
    const maxAttempts = 60 // 60 seconds
    let attempts = 0

    const interval = setInterval(async () => {
      attempts++
      
      try {
        const response = await fetch(`/api/building/${buildingId}/door-bell/${doorBellId}/call-status`)
        if (response.ok) {
          const data = await response.json()
          if (data.status === 'connected') {
            setCallStatus('connected')
            setInCall(true)
            clearInterval(interval)
            startCallSession(doorBellId)
          } else if (data.status === 'ended') {
            setCallStatus('ended')
            setInCall(false)
            clearInterval(interval)
          }
        }
      } catch (error) {
        console.error('Error polling call status:', error)
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval)
        setCallStatus('ended')
        setRinging(false)
        toast.error('No answer from household')
      }
    }, 1000)
  }

  const startCallSession = (doorBellId: string) => {
    // Initialize WebSocket or SSE connection for real-time communication
    // For now, we'll use polling for messages
    const messageInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/building/${buildingId}/door-bell/${doorBellId}/messages`)
        if (response.ok) {
          const data = await response.json()
          if (data.messages) {
            setMessages(data.messages)
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }, 1000)

    // Cleanup on unmount
    return () => clearInterval(messageInterval)
  }

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedDoorBell) return

    try {
      const response = await fetch(`/api/building/${buildingId}/door-bell/${selectedDoorBell.id}/message/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageInput, from: 'guest' }),
      })

      if (response.ok) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: messageInput,
          from: 'guest',
          timestamp: new Date(),
        }])
        setMessageInput('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  const toggleCamera = () => {
    setCameraEnabled(!cameraEnabled)
    // TODO: Implement camera stream
    toast(cameraEnabled ? 'Camera Off' : 'Camera On', { icon: '📷' })
  }

  const toggleMic = () => {
    setMicEnabled(!micEnabled)
    // TODO: Implement microphone stream
    toast(micEnabled ? 'Mic Off' : 'Mic On', { icon: '🎤' })
  }

  const endCall = async () => {
    if (!selectedDoorBell) return

    try {
      await fetch(`/api/building/${buildingId}/door-bell/${selectedDoorBell.id}/end-call/public`, {
        method: 'POST',
      })
      setInCall(false)
      setCallStatus('ended')
      setSelectedDoorBell(null)
      setMessages([])
      setRinging(false)
    } catch (error) {
      console.error('Error ending call:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Welcome Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <HomeIcon className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome
            </h1>
            <p className="text-2xl text-gray-600">
              {building?.name || 'Building'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {!selectedDoorBell ? (
          <>
            {/* Room Buttons Grid */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                Select a Room
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {doorBells
                  .filter(db => db.isEnabled && db.household)
                  .map((doorBell) => (
                    <button
                      key={doorBell.id}
                      onClick={() => handleRingDoorBell(doorBell)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6 px-4 rounded-lg shadow-md transition-all transform hover:scale-105 active:scale-95"
                    >
                      <div className="text-2xl font-bold">{doorBell.doorBellNumber}</div>
                      <div className="text-sm mt-1 opacity-90">
                        {doorBell.household?.apartmentNo || doorBell.household?.name || ''}
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Front Door Agent Button */}
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <button
                onClick={() => {
                  // Ring all doorbells or contact building admin
                  toast('Contacting building administrator...', { icon: '📞' })
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-lg shadow-md transition-all transform hover:scale-105 active:scale-95 inline-flex items-center space-x-2"
              >
                <PhoneIcon className="h-6 w-6" />
                <span>Front Door Agent</span>
              </button>
            </div>
          </>
        ) : (
          /* Call Interface */
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {selectedDoorBell.doorBellNumber}
                </h2>
                <p className="text-gray-600">
                  {selectedDoorBell.household?.apartmentNo || selectedDoorBell.household?.name || ''}
                </p>
              </div>
              <button
                onClick={endCall}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {callStatus === 'ringing' && (
              <div className="text-center py-12">
                <div className="animate-pulse">
                  <PhoneIcon className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
                  <p className="text-xl text-gray-700">Ringing...</p>
                </div>
              </div>
            )}

            {callStatus === 'connected' && inCall && (
              <div className="space-y-4">
                {/* Video/Audio Area */}
                <div className="bg-gray-100 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
                  {cameraEnabled ? (
                    <div className="text-center">
                      <VideoCameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Camera Active</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-white text-3xl font-bold">
                          {selectedDoorBell.doorBellNumber}
                        </span>
                      </div>
                      <p className="text-gray-600">Video Call</p>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={toggleCamera}
                    className={`p-3 rounded-full ${cameraEnabled ? 'bg-green-500' : 'bg-gray-300'} text-white`}
                  >
                    <VideoCameraIcon className="h-6 w-6" />
                  </button>
                  <button
                    onClick={toggleMic}
                    className={`p-3 rounded-full ${micEnabled ? 'bg-green-500' : 'bg-gray-300'} text-white`}
                  >
                    <MicrophoneIcon className="h-6 w-6" />
                  </button>
                  <button
                    onClick={endCall}
                    className="p-3 rounded-full bg-red-500 text-white"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="border-t pt-4 mt-4">
                  <div className="h-48 overflow-y-auto mb-4 space-y-2">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.from === 'guest' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.from === 'guest'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={sendMessage}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}

            {callStatus === 'ended' && (
              <div className="text-center py-12">
                <p className="text-xl text-gray-700">Call Ended</p>
                <button
                  onClick={() => {
                    setSelectedDoorBell(null)
                    setCallStatus(null)
                    setMessages([])
                  }}
                  className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


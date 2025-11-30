'use client'

import { useState, useEffect } from 'react'
import { useHousehold } from '@/components/HouseholdProvider'
import { useLanguage } from '@/components/LanguageProvider'
import { 
  PhoneIcon, 
  VideoCameraIcon,
  MicrophoneIcon,
  LockOpenIcon,
  XMarkIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface DoorBellCall {
  id: string
  doorBellId: string
  doorBellNumber: string
  status: 'ringing' | 'connected' | 'ended'
  startedAt: Date
  messages: Array<{
    id: string
    text: string
    from: 'guest' | 'household'
    timestamp: Date
  }>
}

export default function DoorBellPanel() {
  const { household } = useHousehold()
  const { t } = useLanguage()
  const [activeCalls, setActiveCalls] = useState<DoorBellCall[]>([])
  const [selectedCall, setSelectedCall] = useState<DoorBellCall | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [micEnabled, setMicEnabled] = useState(false)

  useEffect(() => {
    if (!household?.id || !household?.buildingId) return

    // Poll for active doorbell calls
    const interval = setInterval(() => {
      fetchActiveCalls()
    }, 2000)

    fetchActiveCalls()

    return () => clearInterval(interval)
  }, [household?.id, household?.buildingId])

  const fetchActiveCalls = async () => {
    if (!household?.buildingId) return

    try {
      const response = await fetch(`/api/household/${household.id}/doorbell-calls`)
      if (response.ok) {
        const data = await response.json()
        setActiveCalls(data.calls || [])
        
        // Auto-select first ringing call
        const ringingCall = data.calls?.find((c: DoorBellCall) => c.status === 'ringing')
        if (ringingCall && !selectedCall) {
          setSelectedCall(ringingCall)
        }
      }
    } catch (error) {
      console.error('Error fetching active calls:', error)
    }
  }

  const answerCall = async (call: DoorBellCall) => {
    try {
      const response = await fetch(`/api/building/${household?.buildingId}/door-bell/${call.doorBellId}/answer`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Call answered')
        setSelectedCall(call)
        fetchActiveCalls()
      }
    } catch (error) {
      console.error('Error answering call:', error)
      toast.error('Failed to answer call')
    }
  }

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedCall || !household?.buildingId) return

    try {
      const response = await fetch(`/api/building/${household.buildingId}/door-bell/${selectedCall.doorBellId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageInput, from: 'household' }),
      })

      if (response.ok) {
        setMessageInput('')
        fetchActiveCalls()
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  const unlockDoor = async () => {
    if (!selectedCall || !household?.buildingId) return

    try {
      const response = await fetch(`/api/building/${household.buildingId}/door-bell/${selectedCall.doorBellId}/unlock`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Door unlocked')
      }
    } catch (error) {
      console.error('Error unlocking door:', error)
      toast.error('Failed to unlock door')
    }
  }

  const endCall = async () => {
    if (!selectedCall || !household?.buildingId) return

    try {
      const response = await fetch(`/api/building/${household.buildingId}/door-bell/${selectedCall.doorBellId}/end-call`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Call ended')
        setSelectedCall(null)
        fetchActiveCalls()
      }
    } catch (error) {
      console.error('Error ending call:', error)
    }
  }

  if (!household?.buildingId) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <BellIcon className="h-5 w-5 mr-2 text-indigo-600" />
        {t('doorBell') || 'Door Bell'}
      </h3>

      {activeCalls.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No active calls</p>
      ) : (
        <div className="space-y-4">
          {/* Active Calls List */}
          {activeCalls.map((call) => (
            <div
              key={call.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedCall?.id === call.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedCall(call)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{call.doorBellNumber}</p>
                  <p className="text-sm text-gray-500">
                    {call.status === 'ringing' && 'Ringing'}
                    {call.status === 'connected' && 'Connected'}
                  </p>
                </div>
                {call.status === 'ringing' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      answerCall(call)
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <PhoneIcon className="h-4 w-4" />
                    <span>Answer</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Call Interface */}
          {selectedCall && selectedCall.status === 'connected' && (
            <div className="border-t pt-4 mt-4">
              <div className="bg-gray-100 rounded-lg p-4 min-h-[200px] flex items-center justify-center mb-4">
                {cameraEnabled ? (
                  <div className="text-center">
                    <VideoCameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Camera Active</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl font-bold">
                        {selectedCall.doorBellNumber}
                      </span>
                    </div>
                    <p className="text-gray-600">Video Call</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex justify-center space-x-4 mb-4">
                <button
                  onClick={() => setCameraEnabled(!cameraEnabled)}
                  className={`p-3 rounded-full ${cameraEnabled ? 'bg-green-500' : 'bg-gray-300'} text-white`}
                >
                  <VideoCameraIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setMicEnabled(!micEnabled)}
                  className={`p-3 rounded-full ${micEnabled ? 'bg-green-500' : 'bg-gray-300'} text-white`}
                >
                  <MicrophoneIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={unlockDoor}
                  className="p-3 rounded-full bg-blue-500 text-white"
                  title="Unlock Door"
                >
                  <LockOpenIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={endCall}
                  className="p-3 rounded-full bg-red-500 text-white"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="border-t pt-4">
                <div className="h-32 overflow-y-auto mb-2 space-y-2">
                  {selectedCall.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.from === 'household' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          msg.from === 'household'
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


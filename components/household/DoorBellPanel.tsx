'use client'

import { useState, useEffect, useRef } from 'react'
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
import { DoorBellWebRTC } from '@/lib/webrtc'
import { useRealtime } from '@/lib/useRealtime'

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

interface DoorBellPanelProps {
  onActiveCallsChange?: (count: number, ringingCount: number) => void
  onRingingCall?: (call: DoorBellCall) => void
}

export default function DoorBellPanel({ onActiveCallsChange, onRingingCall }: DoorBellPanelProps = {}) {
  const { household } = useHousehold()
  const { t } = useLanguage()
  const [activeCalls, setActiveCalls] = useState<DoorBellCall[]>([])
  const [selectedCall, setSelectedCall] = useState<DoorBellCall | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [micEnabled, setMicEnabled] = useState(false)
  const [buildingId, setBuildingId] = useState<string | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const webrtcRef = useRef<DoorBellWebRTC | null>(null)
  const previousCallsRef = useRef<DoorBellCall[]>([])
  const notificationShownRef = useRef<Set<string>>(new Set())

  // Fetch buildingId if not available in household
  useEffect(() => {
    const fetchBuildingId = async () => {
      if (household?.buildingId) {
        setBuildingId(household.buildingId)
        return
      }

      if (household?.id) {
        try {
          const response = await fetch(`/api/household/${household.id}/property`)
          if (response.ok) {
            const data = await response.json()
            if (data.buildingId) {
              setBuildingId(data.buildingId)
              console.log('Fetched buildingId from property API:', data.buildingId)
            }
          }
        } catch (error) {
          console.error('Error fetching buildingId:', error)
        }
      }
    }

    fetchBuildingId()
  }, [household?.id, household?.buildingId])

  // Set up realtime updates for doorbell events
  useRealtime(household?.id || '', (data) => {
    if (data?.type === 'doorbell' || data?.event) {
      // Refresh calls when doorbell event is received
      console.log('Doorbell event received via realtime:', data)
      fetchActiveCalls()
    }
  })

  useEffect(() => {
    if (!household?.id) {
      if (onActiveCallsChange) {
        onActiveCallsChange(0, 0)
      }
      return
    }

    // Initial fetch and periodic polling as fallback
    const interval = setInterval(() => {
      fetchActiveCalls()
    }, 5000) // Reduced frequency since we have realtime

    fetchActiveCalls()

    return () => clearInterval(interval)
  }, [household?.id, buildingId])

  const fetchActiveCalls = async () => {
    if (!household?.id) {
      console.log('DoorBellPanel: No household ID, skipping fetch')
      return
    }

    if (!household?.buildingId) {
      console.warn('DoorBellPanel: Household missing buildingId', { household })
      // Still try to fetch calls - the API endpoint doesn't require buildingId
    }

    try {
      console.log('Fetching doorbell calls for household:', household.id)
      const response = await fetch(`/api/household/${household.id}/doorbell-calls`)
      if (response.ok) {
        const data = await response.json()
        const newCalls = data.calls || []
        
        // Check for new ringing calls
        const newRingingCalls = newCalls.filter((call: DoorBellCall) => 
          call.status === 'ringing' && 
          !previousCallsRef.current.find(c => c.id === call.id && c.status === 'ringing')
        )
        
        // Show notification for new ringing calls
        newRingingCalls.forEach((call: DoorBellCall) => {
          if (!notificationShownRef.current.has(call.id)) {
            toast.success(`${t('doorBellVisitorArrived')}: ${call.doorBellNumber}`, {
              duration: 5000,
              icon: '🔔',
            })
            notificationShownRef.current.add(call.id)
            
            // Notify parent component about ringing call
            if (onRingingCall) {
              onRingingCall(call)
            }
          }
        })
        
        // Clean up ended calls from notification set
        const endedCallIds = new Set(
          previousCallsRef.current
            .filter(c => c.status === 'ringing' || c.status === 'connected')
            .map(c => c.id)
        )
        newCalls.forEach((call: DoorBellCall) => {
          if (call.status === 'ended') {
            notificationShownRef.current.delete(call.id)
          } else {
            endedCallIds.delete(call.id)
          }
        })
        
        setActiveCalls(newCalls)
        previousCallsRef.current = newCalls
        
        // Update parent component with call counts
        if (onActiveCallsChange) {
          const ringingCount = newCalls.filter((c: DoorBellCall) => c.status === 'ringing').length
          onActiveCallsChange(newCalls.length, ringingCount)
        }
        
        // Auto-select first ringing call
        const ringingCall = newCalls.find((c: DoorBellCall) => c.status === 'ringing')
        if (ringingCall && !selectedCall) {
          setSelectedCall(ringingCall)
        }
        
        // Auto-select first connected call if no ringing call
        if (!ringingCall) {
          const connectedCall = newCalls.find((c: DoorBellCall) => c.status === 'connected')
          if (connectedCall && !selectedCall) {
            setSelectedCall(connectedCall)
            // Initialize WebRTC for connected call
            initializeWebRTC()
          }
        }
      }
    } catch (error) {
      console.error('Error fetching active calls:', error)
    }
  }

  const initializeWebRTC = async () => {
    if (!selectedCall || selectedCall.status !== 'connected') return
    
    try {
      if (!localVideoRef.current || !remoteVideoRef.current) return

      webrtcRef.current = new DoorBellWebRTC({
        localVideoElement: localVideoRef.current,
        remoteVideoElement: remoteVideoRef.current,
        onLocalStream: (stream) => {
          console.log('Local stream initialized')
        },
        onRemoteStream: (stream) => {
          console.log('Remote stream received')
        },
        onError: (error) => {
          console.error('WebRTC error:', error)
          toast.error(t('doorBellMessageError'))
        },
      })

      // Initialize with current camera/mic settings
      await webrtcRef.current.initializeLocalStream(cameraEnabled, micEnabled)
    } catch (error) {
      console.error('Error initializing WebRTC:', error)
      toast.error(t('doorBellMessageError'))
    }
  }

  const answerCall = async (call: DoorBellCall) => {
    const effectiveBuildingId = buildingId || household?.buildingId
    
    if (!effectiveBuildingId) {
      console.error('Cannot answer call: buildingId is missing', { household, buildingId })
      toast.error('Building information not available. Please refresh the page.')
      return
    }

    try {
      console.log('Answering doorbell call:', { 
        doorBellId: call.doorBellId, 
        buildingId: effectiveBuildingId,
        callId: call.id 
      })

      const response = await fetch(`/api/building/${effectiveBuildingId}/door-bell/${call.doorBellId}/answer`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Answer call error:', errorData)
        toast.error(errorData.error || t('doorBellAnswerError'))
        return
      }

      const data = await response.json()
      console.log('Call answered successfully:', data)
      
      toast.success(t('doorBellCallAnswered'))
      setSelectedCall(call)
      fetchActiveCalls()
      
      // Initialize WebRTC after answering
      setTimeout(() => {
        initializeWebRTC()
      }, 500)
    } catch (error) {
      console.error('Error answering call:', error)
      toast.error(t('doorBellAnswerError'))
    }
  }
  
  // Initialize WebRTC when call becomes connected
  useEffect(() => {
    if (selectedCall && selectedCall.status === 'connected') {
      initializeWebRTC()
    }
    
    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.close()
        webrtcRef.current = null
      }
    }
  }, [selectedCall?.status])

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
        toast.success(t('doorBellMessageSent'))
        fetchActiveCalls()
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error(t('doorBellMessageError'))
    }
  }

  const unlockDoor = async () => {
    if (!selectedCall || !household?.buildingId) return

    try {
      const response = await fetch(`/api/building/${household.buildingId}/door-bell/${selectedCall.doorBellId}/unlock`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success(t('doorBellDoorUnlocked'))
      }
    } catch (error) {
      console.error('Error unlocking door:', error)
      toast.error(t('doorBellUnlockError'))
    }
  }

  const endCall = async () => {
    if (!selectedCall || !household?.buildingId) return

    try {
      // Close WebRTC connection
      if (webrtcRef.current) {
        webrtcRef.current.close()
        webrtcRef.current = null
      }
      
      const response = await fetch(`/api/building/${household.buildingId}/door-bell/${selectedCall.doorBellId}/end-call`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success(t('doorBellCallEnded'))
        setSelectedCall(null)
        setCameraEnabled(false)
        setMicEnabled(false)
        fetchActiveCalls()
      }
    } catch (error) {
      console.error('Error ending call:', error)
    }
  }
  
  // Cleanup WebRTC on unmount
  useEffect(() => {
    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.close()
        webrtcRef.current = null
      }
    }
  }, [])

  if (!household?.id) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <BellIcon className="h-5 w-5 mr-2 text-indigo-600" />
          {t('doorBell')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Please select a household to use the doorbell.
        </p>
      </div>
    )
  }

  if (!buildingId && !household?.buildingId) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <BellIcon className="h-5 w-5 mr-2 text-indigo-600" />
          {t('doorBell')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          {t('doorBellOnlyInBuilding')}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
        <BellIcon className="h-5 w-5 mr-2 text-indigo-600" />
        {t('doorBell')}
      </h3>

      {activeCalls.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('doorBellNoActiveCalls')}</p>
      ) : (
        <div className="space-y-4">
          {/* Active Calls List */}
          {activeCalls.map((call) => (
            <div
              key={call.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedCall?.id === call.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedCall(call)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{call.doorBellNumber}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {call.status === 'ringing' && t('doorBellRinging')}
                    {call.status === 'connected' && t('doorBellConnected')}
                    {call.status === 'ended' && t('doorBellEnded')}
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
                    <span>{t('doorBellAnswer')}</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Call Interface */}
          {selectedCall && selectedCall.status === 'connected' && (
            <div className="border-t pt-4 mt-4">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 min-h-[200px] relative mb-4">
                {/* Remote Video (Guest) */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full rounded-lg object-cover"
                  style={{ minHeight: '200px' }}
                />
                
                {/* Local Video (Household) - Picture in Picture */}
                {cameraEnabled && localVideoRef.current && (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute bottom-4 right-4 w-32 h-24 rounded-lg object-cover border-2 border-white shadow-lg"
                  />
                )}
                
                {/* Fallback when camera is off */}
                {!cameraEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-white text-2xl font-bold">
                          {selectedCall.doorBellNumber}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300">{t('doorBellVideoCall')}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex justify-center space-x-4 mb-4">
                <button
                  onClick={async () => {
                    const newState = !cameraEnabled
                    setCameraEnabled(newState)
                    
                    if (webrtcRef.current) {
                      if (newState) {
                        await webrtcRef.current.initializeLocalStream(true, micEnabled)
                      } else {
                        if (webrtcRef.current['localStream']) {
                          webrtcRef.current['localStream'].getVideoTracks().forEach(track => track.stop())
                        }
                      }
                    }
                    
                    toast(newState ? t('doorBellCameraOn') : t('doorBellCameraOff'), { icon: '📷' })
                  }}
                  className={`p-3 rounded-full ${cameraEnabled ? 'bg-green-500' : 'bg-gray-300'} text-white`}
                >
                  <VideoCameraIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={async () => {
                    const newState = !micEnabled
                    setMicEnabled(newState)
                    
                    if (webrtcRef.current) {
                      if (newState) {
                        await webrtcRef.current.initializeLocalStream(cameraEnabled, true)
                      } else {
                        if (webrtcRef.current['localStream']) {
                          webrtcRef.current['localStream'].getAudioTracks().forEach(track => track.stop())
                        }
                      }
                    }
                    
                    toast(newState ? t('doorBellMicOn') : t('doorBellMicOff'), { icon: '🎤' })
                  }}
                  className={`p-3 rounded-full ${micEnabled ? 'bg-green-500' : 'bg-gray-300'} text-white`}
                >
                  <MicrophoneIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={unlockDoor}
                  className="p-3 rounded-full bg-blue-500 text-white"
                  title={t('doorBellUnlockDoor')}
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
                    placeholder={t('doorBellMessagePlaceholder')}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
                  >
                    {t('doorBellSendMessage')}
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


// WebRTC utilities for video/audio communication
// This provides a WebRTC implementation with signaling support for video/audio calls
// Uses native Android/iOS capabilities via Capacitor WebView

import { Capacitor } from '@capacitor/core'
import { Camera } from '@capacitor/camera'

export interface WebRTCConfig {
  localVideoElement?: HTMLVideoElement
  remoteVideoElement?: HTMLVideoElement
  onLocalStream?: (stream: MediaStream) => void
  onRemoteStream?: (stream: MediaStream) => void
  onError?: (error: Error) => void
  callId: string // Call session ID or doorbell call ID
  callType: 'conversation' | 'doorbell' | 'household' // Type of call
  userId: string // Current user ID
  targetUserId?: string // Target user ID (for direct calls)
  targetHouseholdId?: string // Target household ID
  targetBuildingId?: string // Target building ID
  signalingCallback?: (type: 'offer' | 'answer' | 'ice-candidate', data: any) => void // Callback for signaling messages
}

export class DoorBellWebRTC {
  private localStream: MediaStream | null = null
  private peerConnection: RTCPeerConnection | null = null
  private config: WebRTCConfig
  private signalingCheckInterval: NodeJS.Timeout | null = null
  private isInitiator: boolean = false

  constructor(config: WebRTCConfig) {
    this.config = config
  }

  async initializeLocalStream(cameraEnabled: boolean, micEnabled: boolean): Promise<MediaStream | null> {
    try {
      const isNative = Capacitor.isNativePlatform()
      
      // Check permissions on native platforms
      if (isNative) {
        if (cameraEnabled) {
          try {
            const cameraPermission = await Camera.checkPermissions()
            if (cameraPermission.camera !== 'granted') {
              const requestResult = await Camera.requestPermissions({ permissions: ['camera'] })
              if (requestResult.camera !== 'granted') {
                throw new Error('Camera permission denied')
              }
            }
          } catch (error) {
            console.error('Camera permission error:', error)
            if (this.config.onError) {
              this.config.onError(new Error('Camera permission is required for video calls'))
            }
            return null
          }
        }

        // Microphone permissions are handled by the browser/WebView
        // But we can check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Media devices API not available. Please ensure microphone permissions are granted.')
        }
      }

      const constraints: MediaStreamConstraints = {
        video: cameraEnabled ? {
          width: { ideal: isNative ? 640 : 1280 }, // Lower resolution on native for better performance
          height: { ideal: isNative ? 480 : 720 },
          facingMode: 'user',
          // Native-specific constraints
          ...(isNative && {
            frameRate: { ideal: 30 },
          }),
        } : false,
        audio: micEnabled ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Native-specific audio constraints
          ...(isNative && {
            sampleRate: 44100,
            channelCount: 1, // Mono for better performance
          }),
        } : false,
      }

      console.log(`[WebRTC] Requesting media stream (Native: ${isNative}, Camera: ${cameraEnabled}, Mic: ${micEnabled})`)
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints)
      
      console.log(`[WebRTC] Media stream obtained:`, {
        videoTracks: this.localStream.getVideoTracks().length,
        audioTracks: this.localStream.getAudioTracks().length,
        platform: Capacitor.getPlatform(),
      })
      
      if (this.config.localVideoElement && this.localStream) {
        this.config.localVideoElement.srcObject = this.localStream
        // Ensure video plays
        this.config.localVideoElement.play().catch(err => {
          console.error('Error playing local video:', err)
        })
      }

      if (this.config.onLocalStream) {
        this.config.onLocalStream(this.localStream)
      }

      return this.localStream
    } catch (error: any) {
      console.error('[WebRTC] Error accessing media devices:', error)
      const errorMessage = error?.message || 'Failed to access camera/microphone'
      
      // Provide helpful error messages for native platforms
      if (Capacitor.isNativePlatform()) {
        if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
          if (this.config.onError) {
            this.config.onError(new Error('Camera/microphone permission denied. Please grant permissions in device settings.'))
          }
        } else if (errorMessage.includes('not found') || errorMessage.includes('not available')) {
          if (this.config.onError) {
            this.config.onError(new Error('Camera/microphone not available on this device.'))
          }
        } else {
          if (this.config.onError) {
            this.config.onError(new Error(`Failed to access camera/microphone: ${errorMessage}`))
          }
        }
      } else {
        if (this.config.onError) {
          this.config.onError(error as Error)
        }
      }
      return null
    }
  }

  async createPeerConnection(): Promise<RTCPeerConnection> {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    }

    this.peerConnection = new RTCPeerConnection(configuration)

    // Add local stream tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection) {
          this.peerConnection.addTrack(track, this.localStream!)
        }
      })
    }

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      if (this.config.remoteVideoElement && event.streams[0]) {
        this.config.remoteVideoElement.srcObject = event.streams[0]
      }
      if (this.config.onRemoteStream) {
        this.config.onRemoteStream(event.streams[0])
      }
    }

    // Handle ICE candidates
    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        console.log('ICE candidate generated:', event.candidate)
        // Send ICE candidate via signaling server
        await this.sendSignalingMessage('ice-candidate', event.candidate)
      }
    }

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Peer connection state:', this.peerConnection?.connectionState)
      if (this.peerConnection?.connectionState === 'failed') {
        console.error('Peer connection failed, attempting to restart ICE...')
        this.peerConnection.restartIce()
      }
    }

    return this.peerConnection
  }

  // Send signaling message to peer
  private async sendSignalingMessage(type: 'offer' | 'answer' | 'ice-candidate', data: any): Promise<void> {
    try {
      const response = await fetch('/api/webrtc/signaling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId: this.config.callId,
          callType: this.config.callType,
          targetUserId: this.config.targetUserId,
          targetHouseholdId: this.config.targetHouseholdId,
          targetBuildingId: this.config.targetBuildingId,
          type,
          data: type === 'ice-candidate' ? data : data, // ICE candidate is already an object
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to send ${type}: ${response.statusText}`)
      }

      // Call custom callback if provided
      if (this.config.signalingCallback) {
        this.config.signalingCallback(type, data)
      }
    } catch (error) {
      console.error(`Error sending ${type}:`, error)
      if (this.config.onError) {
        this.config.onError(error as Error)
      }
    }
  }

  // Start checking for incoming signaling messages
  startSignalingCheck(): void {
    if (this.signalingCheckInterval) {
      return // Already checking
    }

    this.signalingCheckInterval = setInterval(async () => {
      await this.checkSignalingMessages()
    }, 1000) // Check every second
  }

  // Stop checking for signaling messages
  stopSignalingCheck(): void {
    if (this.signalingCheckInterval) {
      clearInterval(this.signalingCheckInterval)
      this.signalingCheckInterval = null
    }
  }

  // Check for incoming signaling messages
  private async checkSignalingMessages(): Promise<void> {
    try {
      const response = await fetch(`/api/webrtc/signaling?callId=${this.config.callId}`)
      if (!response.ok) return

      const data = await response.json()
      const messages = data.messages || []

      for (const msg of messages) {
        if (msg.fromUserId === this.config.userId) {
          continue // Skip own messages
        }

        await this.handleSignalingMessage(msg.type, msg.data)
      }
    } catch (error) {
      console.error('Error checking signaling messages:', error)
    }
  }

  // Handle incoming signaling message
  private async handleSignalingMessage(type: string, data: any): Promise<void> {
    if (!this.peerConnection) {
      await this.createPeerConnection()
    }

    try {
      if (type === 'offer') {
        // Received offer, create answer
        await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(data))
        const answer = await this.createAnswer()
        if (answer) {
          await this.sendSignalingMessage('answer', answer)
        }
      } else if (type === 'answer') {
        // Received answer
        await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(data))
      } else if (type === 'ice-candidate') {
        // Received ICE candidate
        await this.peerConnection!.addIceCandidate(new RTCIceCandidate(data))
      }
    } catch (error) {
      console.error(`Error handling ${type}:`, error)
      if (this.config.onError) {
        this.config.onError(error as Error)
      }
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peerConnection) {
      await this.createPeerConnection()
    }

    try {
      this.isInitiator = true
      const offer = await this.peerConnection!.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
      await this.peerConnection!.setLocalDescription(offer)
      
      // Send offer via signaling server
      await this.sendSignalingMessage('offer', offer)
      
      // Start checking for answers and ICE candidates
      this.startSignalingCheck()
      
      return offer
    } catch (error) {
      console.error('Error creating offer:', error)
      if (this.config.onError) {
        this.config.onError(error as Error)
      }
      return null
    }
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      await this.createPeerConnection()
    }

    await this.peerConnection!.setRemoteDescription(description)
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peerConnection) {
      await this.createPeerConnection()
    }

    try {
      const answer = await this.peerConnection!.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
      await this.peerConnection!.setLocalDescription(answer)
      
      // Send answer via signaling server
      await this.sendSignalingMessage('answer', answer)
      
      // Start checking for ICE candidates
      this.startSignalingCheck()
      
      return answer
    } catch (error) {
      console.error('Error creating answer:', error)
      if (this.config.onError) {
        this.config.onError(error as Error)
      }
      return null
    }
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      await this.createPeerConnection()
    }

    await this.peerConnection!.addIceCandidate(candidate)
  }

  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    if (this.config.localVideoElement) {
      this.config.localVideoElement.srcObject = null
    }
  }

  close(): void {
    this.stopSignalingCheck()
    this.stopLocalStream()

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    if (this.config.remoteVideoElement) {
      this.config.remoteVideoElement.srcObject = null
    }

    // Clear signaling messages
    fetch(`/api/webrtc/signaling?callId=${this.config.callId}`, {
      method: 'DELETE',
    }).catch(() => {
      // Ignore errors when clearing
    })
  }
}


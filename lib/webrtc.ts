// WebRTC utilities for video/audio communication
// This provides a simple WebRTC implementation for doorbell calls

export interface WebRTCConfig {
  localVideoElement?: HTMLVideoElement
  remoteVideoElement?: HTMLVideoElement
  onLocalStream?: (stream: MediaStream) => void
  onRemoteStream?: (stream: MediaStream) => void
  onError?: (error: Error) => void
}

export class DoorBellWebRTC {
  private localStream: MediaStream | null = null
  private peerConnection: RTCPeerConnection | null = null
  private config: WebRTCConfig

  constructor(config: WebRTCConfig) {
    this.config = config
  }

  async initializeLocalStream(cameraEnabled: boolean, micEnabled: boolean): Promise<MediaStream | null> {
    try {
      const constraints: MediaStreamConstraints = {
        video: cameraEnabled ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        } : false,
        audio: micEnabled ? {
          echoCancellation: true,
          noiseSuppression: true,
        } : false,
      }

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (this.config.localVideoElement && this.localStream) {
        this.config.localVideoElement.srcObject = this.localStream
      }

      if (this.config.onLocalStream) {
        this.config.onLocalStream(this.localStream)
      }

      return this.localStream
    } catch (error) {
      console.error('Error accessing media devices:', error)
      if (this.config.onError) {
        this.config.onError(error as Error)
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
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real implementation, send ICE candidates to the other peer via signaling server
        console.log('ICE candidate:', event.candidate)
      }
    }

    return this.peerConnection
  }

  async createOffer(): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peerConnection) {
      await this.createPeerConnection()
    }

    try {
      const offer = await this.peerConnection!.createOffer()
      await this.peerConnection!.setLocalDescription(offer)
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
      const answer = await this.peerConnection!.createAnswer()
      await this.peerConnection!.setLocalDescription(answer)
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
    this.stopLocalStream()

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    if (this.config.remoteVideoElement) {
      this.config.remoteVideoElement.srcObject = null
    }
  }
}


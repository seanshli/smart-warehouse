'use client'

import { useState, useRef, useEffect } from 'react'
import { MicrophoneIcon, StopIcon, PlayIcon, PauseIcon, TrashIcon } from '@heroicons/react/24/outline'
import { MicrophoneIcon as MicrophoneIconSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import { useLanguage } from './LanguageProvider'

interface VoiceCommentRecorderProps {
  onRecordingComplete: (audioBlob: Blob, audioUrl: string) => void
  onDelete?: () => void
  existingAudioUrl?: string
  maxDurationSeconds?: number
  disabled?: boolean
}

export default function VoiceCommentRecorder({
  onRecordingComplete,
  onDelete,
  existingAudioUrl,
  maxDurationSeconds = 60,
  disabled = false
}: VoiceCommentRecorderProps) {
  const { t } = useLanguage()
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [hasRecording, setHasRecording] = useState(!!existingAudioUrl)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const currentAudioUrlRef = useRef<string | null>(existingAudioUrl || null)

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (currentAudioUrlRef.current && currentAudioUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(currentAudioUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (existingAudioUrl) {
      currentAudioUrlRef.current = existingAudioUrl
      setHasRecording(true)
    }
  }, [existingAudioUrl])

  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        // Clean up old blob URL if exists
        if (currentAudioUrlRef.current && currentAudioUrlRef.current.startsWith('blob:')) {
          URL.revokeObjectURL(currentAudioUrlRef.current)
        }
        
        currentAudioUrlRef.current = audioUrl
        setHasRecording(true)
        onRecordingComplete(audioBlob, audioUrl)
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingDuration(0)

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const newDuration = prev + 1
          if (newDuration >= maxDurationSeconds) {
            stopRecording()
            toast.warning(t('voiceCommentMaxDuration') || `Recording stopped at ${maxDurationSeconds} seconds`)
          }
          return newDuration
        })
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error(t('voiceCommentPermissionError') || 'Microphone permission denied. Please allow microphone access.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }
    }
  }

  const togglePlayback = () => {
    if (!currentAudioUrlRef.current) return

    if (!audioRef.current) {
      audioRef.current = new Audio(currentAudioUrlRef.current)
      audioRef.current.onended = () => {
        setIsPlaying(false)
      }
      audioRef.current.onpause = () => {
        setIsPlaying(false)
      }
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleDelete = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    
    if (currentAudioUrlRef.current && currentAudioUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(currentAudioUrlRef.current)
    }
    
    currentAudioUrlRef.current = null
    setHasRecording(false)
    setIsPlaying(false)
    setRecordingDuration(0)
    
    if (onDelete) {
      onDelete()
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center space-x-3">
      {!hasRecording ? (
        <>
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-primary-500 hover:bg-primary-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            title={isRecording ? t('stopRecording') || 'Stop Recording' : t('startRecording') || 'Start Recording'}
          >
            {isRecording ? (
              <StopIcon className="h-5 w-5" />
            ) : (
              <MicrophoneIconSolid className="h-5 w-5" />
            )}
          </button>
          
          {isRecording && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 font-mono">
                {formatDuration(recordingDuration)} / {formatDuration(maxDurationSeconds)}
              </span>
            </div>
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={togglePlayback}
            disabled={disabled}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={isPlaying ? t('pauseRecording') || 'Pause' : t('playRecording') || 'Play'}
          >
            {isPlaying ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon className="h-5 w-5" />
            )}
          </button>
          
          <button
            type="button"
            onClick={handleDelete}
            disabled={disabled}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={t('deleteRecording') || 'Delete Recording'}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
          
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-500 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={t('rerecord') || 'Record Again'}
          >
            <MicrophoneIcon className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  )
}


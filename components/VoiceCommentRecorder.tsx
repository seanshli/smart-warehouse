'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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
  const { t, currentLanguage } = useLanguage()
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
  const promptAudioRef = useRef<HTMLAudioElement | null>(null)
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const voicesLoadedRef = useRef<boolean>(false)

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
      if (promptAudioRef.current) {
        promptAudioRef.current.pause()
        promptAudioRef.current = null
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        speechUtteranceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (existingAudioUrl) {
      currentAudioUrlRef.current = existingAudioUrl
      setHasRecording(true)
    }
  }, [existingAudioUrl])

  const mapLanguageToSpeechSynthesis = useCallback((language?: string) => {
    if (!language) return 'en-US'
    const normalized = language.toLowerCase()
    if (normalized.startsWith('zh-tw')) return 'zh-TW'
    if (normalized.startsWith('zh')) return 'zh-CN'
    if (normalized.startsWith('ja')) return 'ja-JP'
    if (normalized.startsWith('en')) return 'en-US'
    return 'en-US'
  }, [])

  const speakWithBrowserTTS = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return false
    }

    const speak = () => {
      const synth = window.speechSynthesis
      const voices = synth.getVoices()
      const targetLang = mapLanguageToSpeechSynthesis(currentLanguage)
      const matchingVoice = voices.find((voice) =>
        voice.lang?.toLowerCase().startsWith(targetLang.toLowerCase().split('-')[0])
      ) || voices.find((voice) => voice.lang === targetLang)

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = targetLang
      if (matchingVoice) {
        utterance.voice = matchingVoice
      }
      speechUtteranceRef.current = utterance
      try {
        synth.cancel()
        synth.speak(utterance)
        return true
      } catch (error) {
        console.error('Failed to speak with SpeechSynthesis:', error)
        return false
      }
    }

    if (!voicesLoadedRef.current && window.speechSynthesis.getVoices().length === 0) {
      const handleVoicesChanged = () => {
        voicesLoadedRef.current = true
        speak()
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
      }
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
      window.speechSynthesis.getVoices()
      // Attempt immediate speak as well in case voices are already available
      return speak()
    }

    voicesLoadedRef.current = true
    return speak()
  }, [currentLanguage, mapLanguageToSpeechSynthesis])

  const playPrompt = useCallback(async (text?: string) => {
    if (!text || !text.trim()) return

    try {
      if (promptAudioRef.current) {
        promptAudioRef.current.pause()
        promptAudioRef.current = null
      }
      if (speechUtteranceRef.current && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        speechUtteranceRef.current = null
      }

      const response = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          language: currentLanguage,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data?.audioBase64) {
          const audio = new Audio(`data:audio/mpeg;base64,${data.audioBase64}`)
          promptAudioRef.current = audio
          await audio.play()
          return
        }
      } else {
        console.error('TTS response not ok:', response.status)
      }
    } catch (error) {
      console.error('Failed to play TTS prompt:', error)
    }

    if (!speakWithBrowserTTS(text)) {
      console.warn('Browser speech synthesis unavailable.')
    }
  }, [currentLanguage, speakWithBrowserTTS])

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
      void playPrompt(t('voicePromptStart') || 'What can I help you?')

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const newDuration = prev + 1
          if (newDuration >= maxDurationSeconds) {
            stopRecording()
            toast(t('voiceCommentMaxDuration') || `Recording stopped at ${maxDurationSeconds} seconds`, {
              icon: '⚠️',
            })
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
      void playPrompt(t('voicePromptEnd') || 'Received.')
      
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


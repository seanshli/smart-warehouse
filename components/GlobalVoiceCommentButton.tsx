'use client'

import { useState } from 'react'
import { MicrophoneIcon } from '@heroicons/react/24/solid'
import VoiceCommentRecorder from './VoiceCommentRecorder'
import { useLanguage } from './LanguageProvider'
import toast from 'react-hot-toast'

interface GlobalVoiceCommentButtonProps {
  onCommentSubmit: (audioBlob: Blob, audioUrl: string, transcript?: string) => Promise<void>
  disabled?: boolean
}

export default function GlobalVoiceCommentButton({ 
  onCommentSubmit, 
  disabled = false 
}: GlobalVoiceCommentButtonProps) {
  const { t } = useLanguage()
  const [showRecorder, setShowRecorder] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleRecordingComplete = async (audioBlob: Blob, audioUrl: string) => {
    setSubmitting(true)
    try {
      // Convert audio blob to base64 for transcription
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Audio = reader.result as string
        const base64Data = base64Audio.split(',')[1] // Remove data:audio/webm;base64, prefix

        try {
          // Call transcription API
          const transcriptResponse = await fetch('/api/aiui/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: base64Data }),
          })

          let transcript: string | undefined
          if (transcriptResponse.ok) {
            const transcriptData = await transcriptResponse.json()
            transcript = transcriptData.transcript || transcriptData.text
          }

          // Submit the comment with transcript
          await onCommentSubmit(audioBlob, audioUrl, transcript)
          setShowRecorder(false)
          toast.success(t('voiceCommentSaved') || 'Voice comment saved')
        } catch (error) {
          console.error('Error transcribing voice comment:', error)
          // Still submit even if transcription fails
          await onCommentSubmit(audioBlob, audioUrl)
          setShowRecorder(false)
          toast.success(t('voiceCommentSaved') || 'Voice comment saved')
        }
      }
      reader.readAsDataURL(audioBlob)
    } catch (error) {
      console.error('Error processing voice comment:', error)
      toast.error(t('voiceCommentError') || 'Failed to process voice comment')
    } finally {
      setSubmitting(false)
    }
  }

  if (showRecorder) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[300px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {t('voiceComment') || 'Voice Comment'}
            </h3>
            <button
              onClick={() => setShowRecorder(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={submitting}
            >
              ✕
            </button>
          </div>
          <VoiceCommentRecorder
            onRecordingComplete={handleRecordingComplete}
            maxDurationSeconds={60}
            disabled={submitting}
          />
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowRecorder(true)}
      disabled={disabled}
      className="fixed bottom-4 right-4 z-50 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      title={t('voiceComment') || 'Voice Comment'}
      aria-label={t('voiceComment') || 'Voice Comment'}
    >
      <MicrophoneIcon className="h-6 w-6" />
    </button>
  )
}

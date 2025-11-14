'use client'
// 語音助理面板組件
// 提供文字和語音輸入的 AI 對話介面，支援 iFLYTEK AIUI 和 OpenAI 備援

import { useCallback, useMemo, useState } from 'react'
import { PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from './LanguageProvider'
import VoiceCommentRecorder from './VoiceCommentRecorder'

// 助理訊息類型定義
type AssistantMessage = {
  id: string // 訊息 ID
  role: 'user' | 'assistant' // 角色：用戶或助理
  content: string // 訊息內容
  source?: string | null // 訊息來源（AIUI 或備援）
}

// 將 Blob 轉換為 Base64 字串（用於音訊上傳）
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('Unable to convert audio blob to base64'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(blob) // 讀取為 Data URL（Base64）
  })
}

export default function VoiceAssistantPanel() {
  const { t, currentLanguage } = useLanguage() // 語言設定
  const [messages, setMessages] = useState<AssistantMessage[]>([]) // 對話訊息列表
  const [input, setInput] = useState('') // 文字輸入框內容
  const [isLoading, setIsLoading] = useState(false) // 是否正在載入
  const [pendingAudio, setPendingAudio] = useState<{ blob: Blob; url: string } | null>(null) // 待處理的音訊

  // 對話歷史記錄（用於 API 呼叫）
  const conversationHistory = useMemo(
    () =>
      messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    [messages]
  )

  const appendMessage = useCallback((message: AssistantMessage) => {
    setMessages((prev) => [...prev, message])
  }, [])

  const sendAssistantRequest = useCallback(
    async (options: { text?: string; audioBase64?: string }) => {
      const question = options.text?.trim()
      if (!question && !options.audioBase64) {
        toast.error(t('assistantNoResponse') || 'Please provide a question first.')
        return
      }

      setIsLoading(true)
      try {
        if (question) {
          appendMessage({
            id: `${Date.now()}-user`,
            role: 'user',
            content: question,
          })
        }

        const response = await fetch('/api/aiui/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: question,
            audioBase64: options.audioBase64,
            language: currentLanguage,
            history: conversationHistory,
          }),
        })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data = await response.json()
        if (!data?.response) {
          toast.error(t('assistantNoResponse') || 'No response received. Please try again.')
          appendMessage({
            id: `${Date.now()}-assistant-empty`,
            role: 'assistant',
            content: t('assistantNoResponse') || 'No response received. Please try again.',
            source: null,
          })
        } else {
          appendMessage({
            id: `${Date.now()}-assistant`,
            role: 'assistant',
            content: data.response,
            source: data.source,
          })
        }
      } catch (error) {
        console.error('Voice assistant request failed:', error)
        toast.error('Failed to contact AI assistant.')
      } finally {
        setIsLoading(false)
        setPendingAudio(null)
      }
    },
    [appendMessage, conversationHistory, currentLanguage, t]
  )

  const handleTextSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!input.trim()) {
        toast.error(t('assistantNoResponse') || 'Please enter a question.')
        return
      }

      const question = input.trim()
      setInput('')
      await sendAssistantRequest({ text: question })
    },
    [input, sendAssistantRequest, t]
  )

  const handleVoiceSend = useCallback(async () => {
    if (!pendingAudio) {
      toast.error(t('assistantNoResponse') || 'Please record a voice question first.')
      return
    }

    try {
      const audioBase64 = await blobToBase64(pendingAudio.blob)
      await sendAssistantRequest({ audioBase64 })
    } catch (error) {
      console.error('Failed to send audio query:', error)
      toast.error('Could not send voice message.')
    }
  }, [pendingAudio, sendAssistantRequest, t])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-5 sm:px-6 flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
            <SparklesIcon className="h-6 w-6 text-primary-600 dark:text-primary-300" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('assistant') || 'Assistant'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('assistantDescription') || 'Ask the AI voice agent anything about your household or the world.'}
            </p>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          <div className="space-y-3">
            <form onSubmit={handleTextSubmit} className="flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t('assistantPlaceholder') || 'Ask a question...'}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                {t('assistantSend') || 'Send'}
              </button>
            </form>
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/40 px-3 py-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {t('assistantVoiceHint') || 'Prefer voice? Record a question below and send it to the AIUI agent.'}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <VoiceCommentRecorder
                  onRecordingComplete={(blob) => {
                    setPendingAudio({ blob, url: URL.createObjectURL(blob) })
                    toast.success(t('assistantVoiceReady') || 'Voice message ready. Press send to submit.')
                  }}
                  onDelete={() => setPendingAudio(null)}
                  maxDurationSeconds={30}
                />
                <button
                  type="button"
                  onClick={handleVoiceSend}
                  disabled={isLoading || !pendingAudio}
                  className="inline-flex items-center justify-center rounded-lg border border-primary-600 text-primary-600 px-4 py-2 text-sm font-medium hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? (t('assistantProcessing') || 'Processing...')
                    : (t('assistantSendVoice') || 'Send voice question')}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {messages.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('assistantEmptyState') || 'No conversations yet. Try asking about inventory counts, weather, or anything else.'}
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-lg rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    message.role === 'assistant'
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-gray-900 dark:text-gray-50'
                      : 'bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.role === 'assistant' && message.source && (
                    <p className="mt-2 text-xs opacity-70">
                      {message.source === 'aiui'
                        ? (t('assistantSourceAIUI') || 'Answered by AIUI')
                        : (t('assistantSourceFallback') || 'Answered by fallback AI')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


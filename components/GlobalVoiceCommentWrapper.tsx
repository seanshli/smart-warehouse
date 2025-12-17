'use client'

import { usePathname } from 'next/navigation'
import GlobalVoiceCommentButton from './GlobalVoiceCommentButton'

export default function GlobalVoiceCommentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Don't show on admin pages or auth pages
  const showVoiceButton = !pathname?.startsWith('/admin') && !pathname?.startsWith('/auth') && !pathname?.startsWith('/admin-auth')

  const handleVoiceComment = async (audioBlob: Blob, audioUrl: string, transcript?: string) => {
    // Store voice comment globally - can be used by any component
    // For now, we'll store it in sessionStorage and components can listen for it
    const voiceCommentData = {
      audioUrl,
      transcript,
      timestamp: new Date().toISOString(),
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('globalVoiceComment', JSON.stringify(voiceCommentData))
      
      // Dispatch custom event for components to listen
      window.dispatchEvent(new CustomEvent('voiceCommentAdded', { detail: voiceCommentData }))
    }
  }

  return (
    <>
      {children}
      {showVoiceButton && (
        <GlobalVoiceCommentButton onCommentSubmit={handleVoiceComment} />
      )}
    </>
  )
}

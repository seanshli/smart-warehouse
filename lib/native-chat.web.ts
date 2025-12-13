// Web fallback for Native Chat Plugin
// Falls back to web-based chat UI when native is not available

import type { NativeChatPlugin } from './native-chat'

export class NativeChatWeb implements NativeChatPlugin {
  async showChat(options: {
    conversationId: string
    targetHouseholdId: string
    targetHouseholdName: string
  }): Promise<void> {
    // Web fallback: redirect to web chat page or show web modal
    console.warn('Native chat not available on web. Using web-based chat.')
    // Could redirect to chat page or trigger web modal
    window.location.href = `/chat/${options.conversationId}`
  }

  async sendMessage(options: {
    message: string
    conversationId: string
  }): Promise<void> {
    // Web fallback: use web API directly
    const response = await fetch(`/api/conversations/${options.conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: options.message,
        messageType: 'text',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to send message')
    }
  }
}

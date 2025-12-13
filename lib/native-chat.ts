// Native Chat Plugin Interface
// Provides native iOS/Android chat UI instead of web-based components

import { registerPlugin } from '@capacitor/core'

export interface NativeChatPlugin {
  /**
   * Show native chat interface
   */
  showChat(options: {
    conversationId: string
    targetHouseholdId: string
    targetHouseholdName: string
  }): Promise<void>

  /**
   * Send message via native chat
   */
  sendMessage(options: {
    message: string
    conversationId: string
  }): Promise<void>
}

const NativeChat = registerPlugin<NativeChatPlugin>('NativeChat', {
  web: () => import('./native-chat.web').then(m => new m.NativeChatWeb()),
})

export { NativeChat }

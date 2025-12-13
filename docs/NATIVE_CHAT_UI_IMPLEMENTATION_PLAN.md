# Native Chat UI Implementation Plan

## Overview

This document outlines the plan to implement native chat UI for iOS (Swift) and Android (Kotlin) instead of the current web-based React components.

## Current Architecture

### Web-Based (Current)
- **UI**: React/Next.js components (`HouseholdChat.tsx`, `ChatInterface.tsx`)
- **Rendering**: Capacitor WebView
- **APIs**: WebRTC via JavaScript, native camera/mic via Capacitor bridge
- **Updates**: Can update UI without app store approval (loads from Vercel)

### Native (Proposed)
- **UI**: SwiftUI (iOS) / Jetpack Compose (Android)
- **Rendering**: Native UI components
- **APIs**: Native WebRTC, native camera/mic
- **Updates**: Requires app store approval for UI changes

## Implementation Strategy

### Option 1: Full Native UI (Recommended for Best UX)

**iOS (Swift/SwiftUI)**:
- Native chat list view
- Native message bubbles
- Native video/audio call UI
- Native keyboard handling
- Native push notifications

**Android (Kotlin/Jetpack Compose)**:
- Material Design chat UI
- Native message bubbles
- Native video/audio call UI
- Native keyboard handling
- Native push notifications

**Pros**:
- Best performance and UX
- Truly native feel
- Better system integration
- Smoother animations

**Cons**:
- Separate codebases for iOS/Android
- More maintenance
- Requires app store updates for UI changes

### Option 2: Hybrid Approach (Current + Native Bridge)

Keep web UI but add native plugins for:
- Native chat input (keyboard handling)
- Native video/audio call overlay
- Native notifications
- Native keyboard dismiss

**Pros**:
- Single codebase for most UI
- Native feel for critical parts
- Easier maintenance

**Cons**:
- Still web-based for most UI
- Less native than full native

### Option 3: Capacitor Native UI Plugin

Create a Capacitor plugin that provides native UI components:
- `NativeChatView` plugin
- `NativeVideoCallView` plugin
- JavaScript bridge to control native UI

**Pros**:
- Single JavaScript API
- Native UI on both platforms
- Can be updated via web code

**Cons**:
- More complex plugin development
- Still requires native code maintenance

## Recommended Approach: Option 1 (Full Native)

For chat/video/audio features, full native implementation provides the best user experience.

## Implementation Steps

### Phase 1: Native Chat Plugin (Capacitor)

1. **Create iOS Plugin** (`ios/App/App/Plugins/NativeChatPlugin.swift`):
   - Chat list view
   - Message input
   - Message bubbles
   - Real-time updates via EventSource/WebSocket

2. **Create Android Plugin** (`android/app/src/main/java/com/smartwarehouse/app/plugins/NativeChatPlugin.java`):
   - Chat list view (Jetpack Compose)
   - Message input
   - Message bubbles
   - Real-time updates

3. **JavaScript Bridge** (`lib/native-chat.ts`):
   - TypeScript interface
   - Methods: `showChat()`, `sendMessage()`, `onMessage()`, etc.

### Phase 2: Native Video/Audio Call UI

1. **iOS**: SwiftUI call interface
2. **Android**: Jetpack Compose call interface
3. **WebRTC**: Use native WebRTC APIs directly

### Phase 3: Integration

1. Replace web components with native plugin calls
2. Handle navigation between web and native views
3. Test on both platforms

## File Structure

```
ios/App/App/Plugins/
  ├── NativeChatPlugin.swift
  ├── NativeChatPlugin.m
  └── Views/
      ├── ChatListView.swift
      ├── MessageBubbleView.swift
      └── VideoCallView.swift

android/app/src/main/java/com/smartwarehouse/app/plugins/
  ├── NativeChatPlugin.java
  └── ui/
      ├── ChatListActivity.kt
      ├── MessageBubble.kt
      └── VideoCallActivity.kt

lib/
  └── native-chat.ts  # JavaScript bridge
```

## API Design

### JavaScript Interface

```typescript
interface NativeChatPlugin {
  // Show chat interface
  showChat(options: {
    conversationId: string
    targetHouseholdId: string
    targetHouseholdName: string
  }): Promise<void>

  // Send message
  sendMessage(message: string): Promise<void>

  // Listen for messages
  onMessage(callback: (message: ChatMessage) => void): void

  // Show video call
  showVideoCall(options: {
    callId: string
    isIncoming: boolean
  }): Promise<void>

  // Show audio call
  showAudioCall(options: {
    callId: string
    isIncoming: boolean
  }): Promise<void>
}
```

## Migration Path

1. **Keep web UI** as fallback
2. **Add native plugins** alongside web components
3. **Detect platform** and use native when available
4. **Gradually migrate** features to native
5. **Remove web UI** once native is stable

## Timeline Estimate

- **Phase 1** (Native Chat Plugin): 2-3 weeks
- **Phase 2** (Video/Audio UI): 1-2 weeks
- **Phase 3** (Integration): 1 week
- **Total**: 4-6 weeks

## Decision

**Recommendation**: Implement Option 1 (Full Native UI) for chat/video/audio features.

**Reasoning**:
- Chat/video/audio are core features that benefit most from native UI
- Better user experience is worth the maintenance cost
- Can keep web UI for other features (inventory, settings, etc.)

## Next Steps

1. Review and approve this plan
2. Start with iOS implementation (SwiftUI)
3. Then Android implementation (Jetpack Compose)
4. Create JavaScript bridge
5. Integrate with existing app

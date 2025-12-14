import Foundation
import Capacitor
import SwiftUI
import UIKit
import Combine

/**
 * Native Chat Plugin for iOS
 * Provides native SwiftUI chat interface instead of web-based UI
 */
@objc(NativeChatPlugin)
public class NativeChatPlugin: CAPPlugin {
    
    private var currentChatViewController: UIViewController?
    
    /**
     * Show native chat interface
     */
    @objc func showChat(_ call: CAPPluginCall) {
        guard let conversationId = call.getString("conversationId"),
              let targetHouseholdId = call.getString("targetHouseholdId"),
              let targetHouseholdName = call.getString("targetHouseholdName") else {
            call.reject("Missing required parameters: conversationId, targetHouseholdId, targetHouseholdName")
            return
        }
        
        DispatchQueue.main.async { [weak self] in
            guard let self = self,
                  let viewController = self.bridge?.viewController else {
                call.reject("Cannot access view controller")
                return
            }
            
            // Create SwiftUI chat view
            let chatView = NativeChatView(
                conversationId: conversationId,
                targetHouseholdId: targetHouseholdId,
                targetHouseholdName: targetHouseholdName,
                onClose: { [weak self] in
                    self?.currentChatViewController?.dismiss(animated: true)
                    self?.currentChatViewController = nil
                    call.resolve()
                },
                onVideoCall: { [weak self] in
                    self?.initiateVideoCall(callId: UUID().uuidString, targetHouseholdId: targetHouseholdId)
                },
                onAudioCall: { [weak self] in
                    self?.initiateAudioCall(callId: UUID().uuidString, targetHouseholdId: targetHouseholdId)
                }
            )
            
            // Wrap in UIHostingController
            let hostingController = UIHostingController(rootView: chatView)
            hostingController.modalPresentationStyle = .fullScreen
            self.currentChatViewController = hostingController
            
            // Present modally
            viewController.present(hostingController, animated: true)
            
            call.resolve()
        }
    }
    
    private func initiateVideoCall(callId: String, targetHouseholdId: String) {
        // TODO: Implement native video call UI
        print("Initiating video call: \(callId)")
    }
    
    private func initiateAudioCall(callId: String, targetHouseholdId: String) {
        // TODO: Implement native audio call UI
        print("Initiating audio call: \(callId)")
    }
    
    /**
     * Send message via native chat
     */
    @objc func sendMessage(_ call: CAPPluginCall) {
        guard let message = call.getString("message"),
              let conversationId = call.getString("conversationId") else {
            call.reject("Missing required parameters: message, conversationId")
            return
        }
        
        // Send message via API
        Task {
            do {
                let url = URL(string: "https://smart-warehouse-five.vercel.app/api/conversations/\(conversationId)/messages")!
                var request = URLRequest(url: url)
                request.httpMethod = "POST"
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                
                let body: [String: Any] = [
                    "content": message,
                    "messageType": "text"
                ]
                request.httpBody = try JSONSerialization.data(withJSONObject: body)
                
                let (_, response) = try await URLSession.shared.data(for: request)
                
                if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                    call.resolve()
                } else {
                    call.reject("Failed to send message")
                }
            } catch {
                call.reject("Error sending message: \(error.localizedDescription)")
            }
        }
    }
}

// MARK: - SwiftUI Chat View

struct NativeChatView: View {
    let conversationId: String
    let targetHouseholdId: String
    let targetHouseholdName: String
    let onClose: () -> Void
    let onVideoCall: () -> Void
    let onAudioCall: () -> Void
    
    @State private var messages: [ChatMessage] = []
    @State private var messageText: String = ""
    @State private var isLoading: Bool = true
    @State private var eventSource: URLSessionDataTask?
    @State private var userId: String = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Messages list
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(messages) { message in
                            MessageBubbleView(message: message)
                        }
                    }
                    .padding()
                }
                
                // Input area
                HStack(spacing: 12) {
                    TextField("Type a message...", text: $messageText)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    Button(action: sendMessage) {
                        Image(systemName: "paperplane.fill")
                            .foregroundColor(.white)
                            .padding(10)
                            .background(Color.blue)
                            .clipShape(Circle())
                    }
                    .disabled(messageText.isEmpty)
                }
                .padding()
                .background(Color(.systemBackground))
            }
            .navigationTitle(targetHouseholdName)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: {
                        eventSource?.cancel()
                        onClose()
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.primary)
                    }
                }
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    Button(action: onAudioCall) {
                        Image(systemName: "phone.fill")
                            .foregroundColor(.blue)
                    }
                    .padding(.trailing, 8)
                    
                    Button(action: onVideoCall) {
                        Image(systemName: "video.fill")
                            .foregroundColor(.blue)
                    }
                }
            }
            .onAppear {
                loadUserId()
                loadMessages()
                startRealtimeUpdates()
            }
            .onDisappear {
                eventSource?.cancel()
            }
        }
    }
    
    private func loadUserId() {
        // Get user ID from cookies or storage
        // For now, we'll need to pass it from JavaScript
        // This should be enhanced to read from secure storage
    }
    
    private func loadMessages() {
        isLoading = true
        Task {
            do {
                var request = URLRequest(url: URL(string: "https://smart-warehouse-five.vercel.app/api/conversations/\(conversationId)/messages")!)
                request.setValue("application/json", forHTTPHeaderField: "Accept")
                // Include cookies for authentication
                request.httpShouldHandleCookies = true
                
                let (data, response) = try await URLSession.shared.data(for: request)
                
                if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                    let decoder = JSONDecoder()
                    decoder.dateDecodingStrategy = .iso8601
                    let messagesResponse = try decoder.decode(MessagesResponse.self, from: data)
                    
                    await MainActor.run {
                        // Mark own messages
                        var updatedMessages = messagesResponse.messages
                        for i in 0..<updatedMessages.count {
                            updatedMessages[i].isOwnMessage = updatedMessages[i].senderId == self.userId
                        }
                        self.messages = updatedMessages
                        self.isLoading = false
                    }
                } else {
                    await MainActor.run {
                        self.isLoading = false
                    }
                }
            } catch {
                print("Error loading messages: \(error)")
                await MainActor.run {
                    self.isLoading = false
                }
            }
        }
    }
    
    private func startRealtimeUpdates() {
        // Start EventSource for real-time message updates
        // Note: URLSession doesn't support EventSource natively, so we'll use polling or WebSocket
        // For now, we'll use polling every 2 seconds
        Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { _ in
            loadMessages()
        }
    }
    
    private func sendMessage() {
        guard !messageText.isEmpty else { return }
        
        let messageToSend = messageText
        messageText = "" // Clear immediately for better UX
        
        Task {
            do {
                var request = URLRequest(url: URL(string: "https://smart-warehouse-five.vercel.app/api/conversations/\(conversationId)/messages")!)
                request.httpMethod = "POST"
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.httpShouldHandleCookies = true
                
                let body: [String: Any] = [
                    "content": messageToSend,
                    "messageType": "text"
                ]
                request.httpBody = try JSONSerialization.data(withJSONObject: body)
                
                let (data, response) = try await URLSession.shared.data(for: request)
                
                if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                    let decoder = JSONDecoder()
                    decoder.dateDecodingStrategy = .iso8601
                    let newMessageResponse = try decoder.decode(MessageResponse.self, from: data)
                    
                    await MainActor.run {
                        var newMessage = newMessageResponse.message
                        newMessage.isOwnMessage = newMessage.senderId == self.userId
                        self.messages.append(newMessage)
                    }
                } else {
                    // Restore message text on error
                    await MainActor.run {
                        self.messageText = messageToSend
                    }
                }
            } catch {
                print("Error sending message: \(error)")
                // Restore message text on error
                await MainActor.run {
                    self.messageText = messageToSend
                }
            }
        }
    }
}

struct MessageBubbleView: View {
    let message: ChatMessage
    
    var body: some View {
        HStack {
            if message.isOwnMessage {
                Spacer()
            }
            
            VStack(alignment: message.isOwnMessage ? .trailing : .leading, spacing: 4) {
                Text(message.content)
                    .padding(12)
                    .background(message.isOwnMessage ? Color.blue : Color(.systemGray5))
                    .foregroundColor(message.isOwnMessage ? .white : .primary)
                    .cornerRadius(16)
                
                Text(message.createdAt, style: .time)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            if !message.isOwnMessage {
                Spacer()
            }
        }
    }
}

// MARK: - Data Models

struct ChatMessage: Identifiable, Codable {
    let id: String
    let content: String
    let senderId: String
    let sender: Sender
    let createdAt: Date
    var isOwnMessage: Bool = false
    
    enum CodingKeys: String, CodingKey {
        case id, content, senderId, sender, createdAt
    }
}

struct Sender: Codable {
    let id: String
    let name: String
    let email: String
}

struct MessagesResponse: Codable {
    let messages: [ChatMessage]
}

struct MessageResponse: Codable {
    let message: ChatMessage
}

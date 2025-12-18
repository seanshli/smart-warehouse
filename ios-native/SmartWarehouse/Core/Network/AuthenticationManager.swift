import Foundation
import SwiftUI

/// Authentication manager for handling user login state
@MainActor
class AuthenticationManager: ObservableObject {
    static let shared = AuthenticationManager()
    
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var currentHousehold: Household?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let keychain = KeychainManager.shared
    private let apiClient = APIClient.shared
    
    private init() {}
    
    // MARK: - Public Methods
    
    func checkAuthStatus() async {
        isLoading = true
        defer { isLoading = false }
        
        guard let token = keychain.getAuthToken() else {
            isAuthenticated = false
            return
        }
        
        await apiClient.setAuthToken(token)
        
        do {
            let profile: UserProfileResponse = try await apiClient.get(endpoint: .userProfile)
            currentUser = profile.user
            currentHousehold = profile.household
            isAuthenticated = true
        } catch {
            // Token expired or invalid
            keychain.deleteAuthToken()
            isAuthenticated = false
        }
    }
    
    func signIn(email: String, password: String) async -> Bool {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        do {
            let request = SignInRequest(email: email, password: password)
            let response: AuthResponse = try await apiClient.post(endpoint: .signIn, body: request)
            
            if let token = response.token {
                keychain.saveAuthToken(token)
                await apiClient.setAuthToken(token)
            }
            
            currentUser = response.user
            currentHousehold = response.household
            isAuthenticated = true
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
            return false
        } catch {
            errorMessage = "signInFailed".localized
            return false
        }
    }
    
    func register(name: String, email: String, password: String, invitationCode: String? = nil) async -> Bool {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        do {
            let request = RegisterRequest(name: name, email: email, password: password, invitationCode: invitationCode)
            let response: AuthResponse = try await apiClient.post(endpoint: .register, body: request)
            
            if let token = response.token {
                keychain.saveAuthToken(token)
                await apiClient.setAuthToken(token)
            }
            
            currentUser = response.user
            currentHousehold = response.household
            isAuthenticated = true
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
            return false
        } catch {
            errorMessage = "registrationFailed".localized
            return false
        }
    }
    
    func signOut() async {
        isLoading = true
        defer { isLoading = false }
        
        keychain.deleteAuthToken()
        await apiClient.setAuthToken(nil)
        
        currentUser = nil
        currentHousehold = nil
        isAuthenticated = false
    }
}

// MARK: - Request/Response Types

struct SignInRequest: Encodable {
    let email: String
    let password: String
}

struct RegisterRequest: Encodable {
    let name: String
    let email: String
    let password: String
    let invitationCode: String?
}

struct AuthResponse: Decodable {
    let user: User?
    let household: Household?
    let token: String?
}

struct UserProfileResponse: Decodable {
    let user: User
    let household: Household?
}

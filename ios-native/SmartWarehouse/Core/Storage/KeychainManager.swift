import Foundation
import Security

/// Secure storage manager using iOS Keychain
class KeychainManager {
    static let shared = KeychainManager()
    
    private let service = "com.smartwarehouse.app"
    private let authTokenKey = "auth_token"
    
    private init() {}
    
    // MARK: - Auth Token
    
    func saveAuthToken(_ token: String) {
        save(key: authTokenKey, data: Data(token.utf8))
    }
    
    func getAuthToken() -> String? {
        guard let data = load(key: authTokenKey) else { return nil }
        return String(data: data, encoding: .utf8)
    }
    
    func deleteAuthToken() {
        delete(key: authTokenKey)
    }
    
    // MARK: - Generic Keychain Operations
    
    private func save(key: String, data: Data) {
        // Delete existing item first
        delete(key: key)
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        SecItemAdd(query as CFDictionary, nil)
    }
    
    private func load(key: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess else { return nil }
        return result as? Data
    }
    
    private func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]
        
        SecItemDelete(query as CFDictionary)
    }
}

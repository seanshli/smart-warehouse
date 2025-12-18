import Foundation
import SwiftUI

/// Supported languages in the app
enum AppLanguage: String, CaseIterable, Identifiable {
    case english = "en"
    case traditionalChinese = "zh-TW"
    case simplifiedChinese = "zh"
    case japanese = "ja"
    
    var id: String { rawValue }
    
    var displayName: String {
        switch self {
        case .english: return "English"
        case .traditionalChinese: return "繁體中文"
        case .simplifiedChinese: return "简体中文"
        case .japanese: return "日本語"
        }
    }
    
    var locale: Locale {
        switch self {
        case .english: return Locale(identifier: "en")
        case .traditionalChinese: return Locale(identifier: "zh-Hant")
        case .simplifiedChinese: return Locale(identifier: "zh-Hans")
        case .japanese: return Locale(identifier: "ja")
        }
    }
    
    /// iFLYTEK language code
    var iflytekCode: String {
        switch self {
        case .english: return "en_us"
        case .traditionalChinese: return "zh_tw"
        case .simplifiedChinese: return "zh_cn"
        case .japanese: return "ja_jp"
        }
    }
    
    /// Whisper language code
    var whisperCode: String {
        switch self {
        case .english: return "en"
        case .traditionalChinese: return "zh"
        case .simplifiedChinese: return "zh"
        case .japanese: return "ja"
        }
    }
}

/// Language manager for handling localization
@MainActor
class LanguageManager: ObservableObject {
    static let shared = LanguageManager()
    
    @Published var currentLanguage: AppLanguage {
        didSet {
            UserDefaults.standard.set(currentLanguage.rawValue, forKey: languageKey)
            updateLocale()
        }
    }
    
    @Published var locale: Locale
    
    private let languageKey = "app_language"
    
    private init() {
        // Load saved language or detect from system
        if let savedLanguage = UserDefaults.standard.string(forKey: languageKey),
           let language = AppLanguage(rawValue: savedLanguage) {
            self.currentLanguage = language
            self.locale = language.locale
        } else {
            // Detect from system
            let systemLanguage = Locale.current.language.languageCode?.identifier ?? "en"
            
            if systemLanguage.starts(with: "zh") {
                // Check for Traditional vs Simplified
                let region = Locale.current.region?.identifier ?? ""
                if region == "TW" || region == "HK" || region == "MO" {
                    self.currentLanguage = .traditionalChinese
                } else {
                    self.currentLanguage = .simplifiedChinese
                }
            } else if systemLanguage == "ja" {
                self.currentLanguage = .japanese
            } else {
                self.currentLanguage = .english
            }
            
            self.locale = self.currentLanguage.locale
        }
    }
    
    private func updateLocale() {
        locale = currentLanguage.locale
    }
    
    /// Update language on the server
    func syncLanguageToServer() async {
        do {
            let request = UpdateLanguageRequest(language: currentLanguage.rawValue)
            let _: LanguageResponse = try await APIClient.shared.request(
                endpoint: .userLanguage,
                method: .patch,
                body: request
            )
        } catch {
            print("Failed to sync language to server: \(error)")
        }
    }
}

struct UpdateLanguageRequest: Encodable {
    let language: String
}

struct LanguageResponse: Decodable {
    let language: String
}

// MARK: - String Extension for Localization

extension String {
    /// Returns localized string for the current language
    var localized: String {
        // Use NSLocalizedString with the current bundle
        NSLocalizedString(self, comment: "")
    }
    
    /// Returns localized string with format arguments
    func localized(with arguments: CVarArg...) -> String {
        String(format: localized, arguments: arguments)
    }
}

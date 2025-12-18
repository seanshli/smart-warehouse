import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @EnvironmentObject var languageManager: LanguageManager
    
    var body: some View {
        NavigationStack {
            List {
                // User Profile
                Section {
                    if let user = authManager.currentUser {
                        HStack {
                            // Avatar
                            if let imageUrl = user.image, let url = URL(string: imageUrl) {
                                AsyncImage(url: url) { image in
                                    image.resizable().scaledToFill()
                                } placeholder: {
                                    Image(systemName: "person.circle.fill")
                                        .font(.largeTitle)
                                }
                                .frame(width: 50, height: 50)
                                .clipShape(Circle())
                            } else {
                                Image(systemName: "person.circle.fill")
                                    .font(.largeTitle)
                                    .foregroundColor(.gray)
                            }
                            
                            VStack(alignment: .leading) {
                                Text(user.name ?? "user".localized)
                                    .font(.headline)
                                
                                if let email = user.email {
                                    Text(email)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }
                }
                
                // Household
                if let household = authManager.currentHousehold {
                    Section("household".localized) {
                        LabeledContent("name".localized, value: household.name)
                        
                        if let code = household.invitationCode {
                            HStack {
                                Text("invitationCode".localized)
                                Spacer()
                                Text(code)
                                    .font(.system(.body, design: .monospaced))
                                
                                Button {
                                    UIPasteboard.general.string = code
                                } label: {
                                    Image(systemName: "doc.on.doc")
                                }
                            }
                        }
                    }
                }
                
                // Language
                Section("language".localized) {
                    Picker("appLanguage".localized, selection: $languageManager.currentLanguage) {
                        ForEach(AppLanguage.allCases) { language in
                            Text(language.displayName).tag(language)
                        }
                    }
                    .onChange(of: languageManager.currentLanguage) { _, _ in
                        Task {
                            await languageManager.syncLanguageToServer()
                        }
                    }
                }
                
                // About
                Section("about".localized) {
                    LabeledContent("version".localized, value: Bundle.main.appVersion)
                    
                    Link(destination: URL(string: "https://github.com/seanshli/smart-warehouse")!) {
                        HStack {
                            Text("sourceCode".localized)
                            Spacer()
                            Image(systemName: "arrow.up.right.square")
                        }
                    }
                }
                
                // Sign Out
                Section {
                    Button(role: .destructive) {
                        Task {
                            await authManager.signOut()
                        }
                    } label: {
                        HStack {
                            Spacer()
                            Text("signOut".localized)
                            Spacer()
                        }
                    }
                }
            }
            .navigationTitle("settings".localized)
        }
    }
}

extension Bundle {
    var appVersion: String {
        "\(infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0") (\(infoDictionary?["CFBundleVersion"] as? String ?? "1"))"
    }
}

#Preview {
    SettingsView()
        .environmentObject(AuthenticationManager.shared)
        .environmentObject(LanguageManager.shared)
}

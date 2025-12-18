import SwiftUI

@main
struct SmartWarehouseApp: App {
    @StateObject private var authManager = AuthenticationManager.shared
    @StateObject private var languageManager = LanguageManager.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .environmentObject(languageManager)
                .environment(\.locale, languageManager.locale)
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    
    var body: some View {
        Group {
            if authManager.isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
        .task {
            await authManager.checkAuthStatus()
        }
    }
}

struct MainTabView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Label("dashboard".localized, systemImage: "house")
                }
                .tag(0)
            
            ItemListView()
                .tabItem {
                    Label("items".localized, systemImage: "cube.box")
                }
                .tag(1)
            
            RoomListView()
                .tabItem {
                    Label("rooms".localized, systemImage: "door.left.hand.open")
                }
                .tag(2)
            
            BarcodeScannerView()
                .tabItem {
                    Label("scan".localized, systemImage: "barcode.viewfinder")
                }
                .tag(3)
            
            SettingsView()
                .tabItem {
                    Label("settings".localized, systemImage: "gear")
                }
                .tag(4)
        }
    }
}

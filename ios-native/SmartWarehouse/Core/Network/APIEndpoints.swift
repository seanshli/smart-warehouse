import Foundation

/// API Endpoints for Smart Warehouse
enum APIEndpoint {
    // Auth
    case register
    case signIn
    case signOut
    
    // Items
    case items
    case item(id: String)
    case itemCheckout(id: String)
    case itemHistory(id: String)
    
    // Rooms
    case rooms
    case room(id: String)
    case roomItems(id: String)
    
    // Categories
    case categories
    case category(id: String)
    
    // Search
    case search
    case searchChatGPT
    
    // AI
    case aiRecognize
    
    // Dashboard
    case dashboardStats
    
    // User
    case userLanguage
    case userProfile
    
    // IoT
    case iotDevices
    case iotDevice(id: String)
    case iotDeviceControl(id: String)
    
    // Household
    case households
    case household(id: String)
    
    var path: String {
        switch self {
        // Auth
        case .register:
            return "auth/register"
        case .signIn:
            return "auth/signin"
        case .signOut:
            return "auth/signout"
            
        // Items
        case .items:
            return "warehouse/items"
        case .item(let id):
            return "warehouse/items/\(id)"
        case .itemCheckout(let id):
            return "warehouse/items/\(id)/checkout"
        case .itemHistory(let id):
            return "warehouse/items/\(id)/history"
            
        // Rooms
        case .rooms:
            return "warehouse/rooms"
        case .room(let id):
            return "warehouse/rooms/\(id)"
        case .roomItems(let id):
            return "warehouse/rooms/\(id)/items"
            
        // Categories
        case .categories:
            return "warehouse/categories"
        case .category(let id):
            return "warehouse/categories/\(id)"
            
        // Search
        case .search:
            return "warehouse/search"
        case .searchChatGPT:
            return "warehouse/search/chatgpt"
            
        // AI
        case .aiRecognize:
            return "ai/recognize"
            
        // Dashboard
        case .dashboardStats:
            return "warehouse/dashboard/stats"
            
        // User
        case .userLanguage:
            return "user/language"
        case .userProfile:
            return "user/profile"
            
        // IoT
        case .iotDevices:
            return "mqtt/devices"
        case .iotDevice(let id):
            return "mqtt/devices/\(id)"
        case .iotDeviceControl(let id):
            return "mqtt/iot/devices/\(id)/control"
            
        // Household
        case .households:
            return "household"
        case .household(let id):
            return "household/\(id)"
        }
    }
}

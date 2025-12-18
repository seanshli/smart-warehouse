import Foundation

/// Dashboard statistics model
struct DashboardStats: Decodable {
    let totalItems: Int
    let totalRooms: Int
    let totalCategories: Int
    let lowStockItems: Int
    let recentItems: [Item]?
}

/// ViewModel for Dashboard
@MainActor
class DashboardViewModel: ObservableObject {
    @Published var stats: DashboardStats?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let apiClient = APIClient.shared
    
    func loadStats() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        do {
            stats = try await apiClient.get(endpoint: .dashboardStats)
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "failedToLoadStats".localized
        }
    }
}

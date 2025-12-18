import Foundation

/// ViewModel for Rooms management
@MainActor
class RoomsViewModel: ObservableObject {
    @Published var rooms: [Room] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let apiClient = APIClient.shared
    
    func loadRooms() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        do {
            rooms = try await apiClient.get(endpoint: .rooms)
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "failedToLoadRooms".localized
        }
    }
    
    func createRoom(_ request: CreateRoomRequest) async -> Room? {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        do {
            let room: Room = try await apiClient.post(endpoint: .rooms, body: request)
            rooms.append(room)
            return room
        } catch let error as APIError {
            errorMessage = error.localizedDescription
            return nil
        } catch {
            errorMessage = "failedToCreateRoom".localized
            return nil
        }
    }
    
    func updateRoom(_ id: String, request: UpdateRoomRequest) async -> Bool {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        do {
            let updatedRoom: Room = try await apiClient.put(endpoint: .room(id: id), body: request)
            if let index = rooms.firstIndex(where: { $0.id == id }) {
                rooms[index] = updatedRoom
            }
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
            return false
        } catch {
            errorMessage = "failedToUpdateRoom".localized
            return false
        }
    }
    
    func deleteRoom(_ room: Room) async -> Bool {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        do {
            try await apiClient.delete(endpoint: .room(id: room.id))
            rooms.removeAll { $0.id == room.id }
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
            return false
        } catch {
            errorMessage = "failedToDeleteRoom".localized
            return false
        }
    }
}

/// ViewModel for Categories management
@MainActor
class CategoriesViewModel: ObservableObject {
    @Published var categories: [Category] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let apiClient = APIClient.shared
    
    func loadCategories() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        do {
            categories = try await apiClient.get(endpoint: .categories)
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "failedToLoadCategories".localized
        }
    }
    
    func createCategory(_ request: CreateCategoryRequest) async -> Category? {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        do {
            let category: Category = try await apiClient.post(endpoint: .categories, body: request)
            categories.append(category)
            return category
        } catch let error as APIError {
            errorMessage = error.localizedDescription
            return nil
        } catch {
            errorMessage = "failedToCreateCategory".localized
            return nil
        }
    }
}

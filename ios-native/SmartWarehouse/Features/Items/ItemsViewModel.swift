import Foundation

/// ViewModel for Items management
@MainActor
class ItemsViewModel: ObservableObject {
    @Published var items: [Item] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let apiClient = APIClient.shared
    
    // MARK: - CRUD Operations
    
    func loadItems(roomId: String? = nil, categoryId: String? = nil) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        do {
            var params: [String: String] = [:]
            if let roomId = roomId { params["roomId"] = roomId }
            if let categoryId = categoryId { params["categoryId"] = categoryId }
            
            let response: ItemListResponse = try await apiClient.get(endpoint: .items, queryParams: params)
            items = response.items
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "failedToLoadItems".localized
        }
    }
    
    func createItem(_ request: CreateItemRequest) async -> Item? {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        do {
            let item: Item = try await apiClient.post(endpoint: .items, body: request)
            items.insert(item, at: 0)
            return item
        } catch let error as APIError {
            errorMessage = error.localizedDescription
            return nil
        } catch {
            errorMessage = "failedToCreateItem".localized
            return nil
        }
    }
    
    func updateItem(_ id: String, request: UpdateItemRequest) async -> Bool {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        do {
            let updatedItem: Item = try await apiClient.put(endpoint: .item(id: id), body: request)
            if let index = items.firstIndex(where: { $0.id == id }) {
                items[index] = updatedItem
            }
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
            return false
        } catch {
            errorMessage = "failedToUpdateItem".localized
            return false
        }
    }
    
    func deleteItem(_ item: Item) async -> Bool {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        do {
            try await apiClient.delete(endpoint: .item(id: item.id))
            items.removeAll { $0.id == item.id }
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
            return false
        } catch {
            errorMessage = "failedToDeleteItem".localized
            return false
        }
    }
    
    func checkoutItem(_ id: String, quantity: Int, reason: String? = nil) async -> Bool {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        do {
            let request = CheckoutItemRequest(quantity: quantity, reason: reason)
            let updatedItem: Item = try await apiClient.post(endpoint: .itemCheckout(id: id), body: request)
            if let index = items.firstIndex(where: { $0.id == id }) {
                items[index] = updatedItem
            }
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
            return false
        } catch {
            errorMessage = "failedToCheckoutItem".localized
            return false
        }
    }
}

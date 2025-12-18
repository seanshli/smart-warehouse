import Foundation

/// Item model representing inventory items
struct Item: Identifiable, Codable, Hashable {
    let id: String
    var name: String
    var description: String?
    var quantity: Int
    var minQuantity: Int
    var barcode: String?
    var qrCode: String?
    var imageUrl: String?
    var tags: [String]?
    var buyDate: Date?
    var buyCost: Double?
    var buyLocation: String?
    var invoiceNumber: String?
    var sellerName: String?
    var category: Category?
    var room: Room?
    var cabinet: Cabinet?
    let createdAt: Date?
    let updatedAt: Date?
    
    // MARK: - Computed Properties
    
    var isLowStock: Bool {
        quantity <= minQuantity
    }
    
    var displayLocation: String {
        var parts: [String] = []
        if let roomName = room?.name {
            parts.append(roomName)
        }
        if let cabinetName = cabinet?.name {
            parts.append(cabinetName)
        }
        return parts.joined(separator: " → ")
    }
    
    var displayCategory: String {
        var parts: [String] = []
        if let parent = category?.parent?.name {
            parts.append(parent)
        }
        if let categoryName = category?.name {
            parts.append(categoryName)
        }
        return parts.joined(separator: " → ")
    }
}

/// Request to create a new item
struct CreateItemRequest: Encodable {
    let name: String
    var description: String?
    var quantity: Int = 1
    var minQuantity: Int = 0
    var category: String?
    var subcategory: String?
    var room: String
    var cabinet: String?
    var barcode: String?
    var qrCode: String?
    var imageUrl: String?
    var tags: [String]?
    var householdId: String?
    var buyDate: Date?
    var buyCost: Double?
    var buyLocation: String?
}

/// Request to update an existing item
struct UpdateItemRequest: Encodable {
    var name: String?
    var description: String?
    var quantity: Int?
    var minQuantity: Int?
    var category: String?
    var room: String?
    var cabinet: String?
    var barcode: String?
    var imageUrl: String?
    var tags: [String]?
}

/// Request to checkout/use an item
struct CheckoutItemRequest: Encodable {
    let quantity: Int
    var reason: String?
}

/// Response containing list of items
struct ItemListResponse: Decodable {
    let items: [Item]
    let total: Int?
    let page: Int?
    let limit: Int?
}

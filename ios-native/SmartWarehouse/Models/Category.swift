import Foundation

/// Category model for organizing items
struct Category: Identifiable, Codable, Hashable {
    let id: String
    var name: String
    var icon: String?
    var parentId: String?
    var parent: Category?
    var children: [Category]?
    
    // Break circular reference for Hashable
    static func == (lhs: Category, rhs: Category) -> Bool {
        lhs.id == rhs.id
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

/// Request to create a new category
struct CreateCategoryRequest: Encodable {
    let name: String
    var icon: String?
    var parentId: String?
    var householdId: String?
}

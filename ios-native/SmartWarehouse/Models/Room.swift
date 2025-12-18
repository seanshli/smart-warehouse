import Foundation

/// Room model representing storage locations
struct Room: Identifiable, Codable, Hashable {
    let id: String
    var name: String
    var description: String?
    var icon: String?
    var cabinets: [Cabinet]?
    var count: RoomCount?
    
    // Custom coding for _count field
    enum CodingKeys: String, CodingKey {
        case id, name, description, icon, cabinets
        case count = "_count"
    }
}

struct RoomCount: Codable, Hashable {
    let items: Int?
    let cabinets: Int?
}

/// Cabinet model representing storage containers within rooms
struct Cabinet: Identifiable, Codable, Hashable {
    let id: String
    var name: String
    var description: String?
}

/// Request to create a new room
struct CreateRoomRequest: Encodable {
    let name: String
    var description: String?
    var icon: String?
    var householdId: String?
}

/// Request to update a room
struct UpdateRoomRequest: Encodable {
    var name: String?
    var description: String?
    var icon: String?
}

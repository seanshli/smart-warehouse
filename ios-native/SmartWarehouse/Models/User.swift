import Foundation

/// User model
struct User: Identifiable, Codable, Hashable {
    let id: String
    var name: String?
    var email: String?
    var image: String?
    var language: String?
}

/// Household model
struct Household: Identifiable, Codable, Hashable {
    let id: String
    var name: String
    var invitationCode: String?
}

/// Household member
struct HouseholdMember: Identifiable, Codable, Hashable {
    let id: String
    let userId: String
    let householdId: String
    let role: String
    let user: User?
}

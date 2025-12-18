import Foundation

/// API Client for Smart Warehouse backend
/// Uses async/await for modern Swift concurrency
actor APIClient {
    static let shared = APIClient()
    
    private let baseURL: URL
    private let session: URLSession
    private var authToken: String?
    
    private init() {
        #if DEBUG
        self.baseURL = URL(string: "http://localhost:3000/api")!
        #else
        self.baseURL = URL(string: "https://smart-warehouse-five.vercel.app/api")!
        #endif
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: config)
    }
    
    // MARK: - Authentication
    
    func setAuthToken(_ token: String?) {
        self.authToken = token
    }
    
    // MARK: - Generic Request Methods
    
    func request<T: Decodable>(
        endpoint: APIEndpoint,
        method: HTTPMethod = .get,
        body: Encodable? = nil,
        queryParams: [String: String]? = nil
    ) async throws -> T {
        var urlComponents = URLComponents(url: baseURL.appendingPathComponent(endpoint.path), resolvingAgainstBaseURL: true)!
        
        // Add query parameters
        var params = queryParams ?? [:]
        params["language"] = LanguageManager.shared.currentLanguage.rawValue
        urlComponents.queryItems = params.map { URLQueryItem(name: $0.key, value: $0.value) }
        
        guard let url = urlComponents.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add auth token if available
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Add body if present
        if let body = body {
            request.httpBody = try JSONEncoder().encode(body)
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            return try decoder.decode(T.self, from: data)
        case 401:
            throw APIError.unauthorized
        case 404:
            throw APIError.notFound
        case 400...499:
            let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data)
            throw APIError.clientError(errorResponse?.error ?? "Request failed")
        case 500...599:
            throw APIError.serverError
        default:
            throw APIError.unknown
        }
    }
    
    // MARK: - Convenience Methods
    
    func get<T: Decodable>(endpoint: APIEndpoint, queryParams: [String: String]? = nil) async throws -> T {
        try await request(endpoint: endpoint, method: .get, queryParams: queryParams)
    }
    
    func post<T: Decodable>(endpoint: APIEndpoint, body: Encodable) async throws -> T {
        try await request(endpoint: endpoint, method: .post, body: body)
    }
    
    func put<T: Decodable>(endpoint: APIEndpoint, body: Encodable) async throws -> T {
        try await request(endpoint: endpoint, method: .put, body: body)
    }
    
    func delete(endpoint: APIEndpoint) async throws {
        let _: EmptyResponse = try await request(endpoint: endpoint, method: .delete)
    }
}

// MARK: - Supporting Types

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case unauthorized
    case notFound
    case clientError(String)
    case serverError
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .unauthorized:
            return "Please sign in again"
        case .notFound:
            return "Resource not found"
        case .clientError(let message):
            return message
        case .serverError:
            return "Server error. Please try again later."
        case .unknown:
            return "An unknown error occurred"
        }
    }
}

struct ErrorResponse: Decodable {
    let error: String
    let details: String?
}

struct EmptyResponse: Decodable {}

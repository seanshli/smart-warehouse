import Foundation

/// IoT Device model
struct IoTDevice: Identifiable, Codable, Hashable {
    let id: String
    let deviceId: String
    var name: String
    var vendor: DeviceVendor
    var type: String?
    var status: DeviceStatus
    var state: [String: AnyCodable]?
    var metadata: [String: AnyCodable]?
    
    enum CodingKeys: String, CodingKey {
        case id, deviceId, name, vendor, type, status, state, metadata
    }
}

enum DeviceVendor: String, Codable, CaseIterable {
    case tuya
    case midea
    case shelly
    case esp
    case aqara
    case philips
    case panasonic
    case knx
    
    var displayName: String {
        switch self {
        case .tuya: return "Tuya"
        case .midea: return "Midea"
        case .shelly: return "Shelly"
        case .esp: return "ESP"
        case .aqara: return "Aqara"
        case .philips: return "Philips Hue"
        case .panasonic: return "Panasonic"
        case .knx: return "KNX"
        }
    }
}

enum DeviceStatus: String, Codable {
    case online
    case offline
}

/// Device control request
struct DeviceControlRequest: Encodable {
    let command: DeviceCommand
    let value: AnyCodable?
}

enum DeviceCommand: String, Encodable {
    case powerOn = "power_on"
    case powerOff = "power_off"
    case setTemperature = "set_temperature"
    case setMode = "set_mode"
    case setBrightness = "set_brightness"
}

/// Helper for encoding/decoding any JSON value
struct AnyCodable: Codable, Hashable {
    let value: Any
    
    init(_ value: Any) {
        self.value = value
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if container.decodeNil() {
            self.value = NSNull()
        } else if let bool = try? container.decode(Bool.self) {
            self.value = bool
        } else if let int = try? container.decode(Int.self) {
            self.value = int
        } else if let double = try? container.decode(Double.self) {
            self.value = double
        } else if let string = try? container.decode(String.self) {
            self.value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            self.value = array.map { $0.value }
        } else if let dict = try? container.decode([String: AnyCodable].self) {
            self.value = dict.mapValues { $0.value }
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode value")
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        
        switch value {
        case is NSNull:
            try container.encodeNil()
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dict as [String: Any]:
            try container.encode(dict.mapValues { AnyCodable($0) })
        default:
            throw EncodingError.invalidValue(value, EncodingError.Context(codingPath: encoder.codingPath, debugDescription: "Cannot encode value"))
        }
    }
    
    static func == (lhs: AnyCodable, rhs: AnyCodable) -> Bool {
        // Simple equality check
        String(describing: lhs.value) == String(describing: rhs.value)
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(String(describing: value))
    }
}

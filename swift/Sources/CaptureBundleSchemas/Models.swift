import Foundation

/// Unsigned nanoseconds since Unix epoch encoded as a string for uint64-safe JSON.
public struct TimestampNanoseconds: Codable, Hashable, Sendable {
    public let value: String

    public init(value: String) throws {
        guard Self.isValid(value) else {
            throw DecodingError.dataCorrupted(
                .init(codingPath: [], debugDescription: "Invalid timestamp_ns string"))
        }
        self.value = value
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        let s = try c.decode(String.self)
        try self.init(value: s)
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        try c.encode(value)
    }

    public static func isValid(_ s: String) -> Bool {
        guard let re = try? NSRegularExpression(pattern: #"^[0-9]{1,19}$"#) else {
            return false
        }
        let range = NSRange(s.startIndex..<s.endIndex, in: s)
        guard re.firstMatch(in: s, options: [], range: range) != nil else { return false }
        if s.count > 1, s.hasPrefix("0") { return false }
        return true
    }
}

public struct ManifestFileEntry: Codable, Hashable, Sendable {
    public let sha256: String
    public let sizeBytes: Int
    public let mediaType: String?

    enum CodingKeys: String, CodingKey {
        case sha256
        case sizeBytes = "size_bytes"
        case mediaType = "media_type"
    }
}

public struct CaptureManifest: Codable, Hashable, Sendable {
    public let schemaVersion: String
    public let bundleSpecVersion: String
    public let bundleId: String
    public let captureSessionId: String?
    public let createdAtUtc: String
    public let lifecycle: String
    public let hashAlgorithm: String
    public let rootPoseFrame: String?
    public let rootPoseFrameNote: String?
    public let files: [String: ManifestFileEntry]

    enum CodingKeys: String, CodingKey {
        case schemaVersion = "schema_version"
        case bundleSpecVersion = "bundle_spec_version"
        case bundleId = "bundle_id"
        case captureSessionId = "capture_session_id"
        case createdAtUtc = "created_at_utc"
        case lifecycle
        case hashAlgorithm = "hash_algorithm"
        case rootPoseFrame = "root_pose_frame"
        case rootPoseFrameNote = "root_pose_frame_note"
        case files
    }
}

public struct CaptureMetadataApp: Codable, Hashable, Sendable {
    public let name: String
    public let version: String
    public let build: String?
}

public struct CaptureMetadata: Codable, Hashable, Sendable {
    public let schemaVersion: String
    public let bundleId: String
    public let recordedPlatform: String
    public let app: CaptureMetadataApp
    public let sensors: [String: JSONValue]

    enum CodingKeys: String, CodingKey {
        case schemaVersion = "schema_version"
        case bundleId = "bundle_id"
        case recordedPlatform = "recorded_platform"
        case app
        case sensors
    }
}

public struct SyncUtcAnchor: Codable, Hashable, Sendable {
    public let valid: Bool
    public let anchorUtc: String
    public let anchorMonotonicNs: String?

    enum CodingKeys: String, CodingKey {
        case valid
        case anchorUtc = "anchor_utc"
        case anchorMonotonicNs = "anchor_monotonic_ns"
    }
}

public struct SyncStreamSample: Codable, Hashable, Sendable {
    public let tStreamNs: String
    public let tUtcNs: String?
    public let frameIndex: Int?

    enum CodingKeys: String, CodingKey {
        case tStreamNs = "t_stream_ns"
        case tUtcNs = "t_utc_ns"
        case frameIndex = "frame_index"
    }
}

public struct SyncStream: Codable, Hashable, Sendable {
    public let streamId: String
    public let clock: String
    public let offsetToUtcNs: String?
    public let samples: [SyncStreamSample]

    enum CodingKeys: String, CodingKey {
        case streamId = "stream_id"
        case clock
        case offsetToUtcNs = "offset_to_utc_ns"
        case samples
    }
}

public struct CaptureSync: Codable, Hashable, Sendable {
    public let schemaVersion: String
    public let bundleId: String
    public let utcEpochAnchor: SyncUtcAnchor
    public let streams: [SyncStream]?

    enum CodingKeys: String, CodingKey {
        case schemaVersion = "schema_version"
        case bundleId = "bundle_id"
        case utcEpochAnchor = "utc_epoch_anchor"
        case streams
    }
}

/// Loose JSON object bucket for `metadata.sensors` maps without importing a full JSON library.
public indirect enum JSONValue: Codable, Hashable, Sendable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case object([String: JSONValue])
    case array([JSONValue])
    case null

    public init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() {
            self = .null
        } else if let b = try? c.decode(Bool.self) {
            self = .bool(b)
        } else if let n = try? c.decode(Double.self) {
            self = .number(n)
        } else if let s = try? c.decode(String.self) {
            self = .string(s)
        } else if let a = try? c.decode([JSONValue].self) {
            self = .array(a)
        } else if let o = try? c.decode([String: JSONValue].self) {
            self = .object(o)
        } else {
            throw DecodingError.dataCorruptedError(in: c, debugDescription: "Unsupported JSON value")
        }
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .null: try c.encodeNil()
        case .bool(let v): try c.encode(v)
        case .number(let v): try c.encode(v)
        case .string(let v): try c.encode(v)
        case .array(let v): try c.encode(v)
        case .object(let v): try c.encode(v)
        }
    }
}

public struct PoseSample: Codable, Hashable, Sendable {
    public let timestampNs: TimestampNanoseconds
    public let frameId: Int
    public let trackingState: String?
    public let positionM: [Double]
    public let orientationXyzw: [Double]

    enum CodingKeys: String, CodingKey {
        case timestampNs = "timestamp_ns"
        case frameId = "frame_id"
        case trackingState = "tracking_state"
        case positionM = "position_m"
        case orientationXyzw = "orientation_xyzw"
    }
}

public struct ImuSample: Codable, Hashable, Sendable {
    public let timestampNs: TimestampNanoseconds
    public let gyroRadS: [Double]
    public let accelMS2: [Double]

    enum CodingKeys: String, CodingKey {
        case timestampNs = "timestamp_ns"
        case gyroRadS = "gyro_rad_s"
        case accelMS2 = "accel_m_s2"
    }
}

package global.refinement.capture.schemas

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject

private val TS_REGEX = Regex("^[0-9]{1,19}$")

fun assertValidTimestampNs(raw: String): String {
    require(TS_REGEX.matches(raw)) { "timestamp_ns must match uint64 ns digit pattern" }
    require(raw.length == 1 || !raw.startsWith('0')) { "timestamp_ns must not have leading zeros" }
    return raw
}

@Serializable
data class ManifestFileEntry(
    val sha256: String,
    val size_bytes: Int,
    val media_type: String? = null,
)

@Serializable
data class CaptureManifest(
    val schema_version: String,
    val bundle_spec_version: String,
    val bundle_id: String,
    val capture_session_id: String? = null,
    val created_at_utc: String,
    val lifecycle: String,
    val hash_algorithm: String,
    val root_pose_frame: String? = null,
    val root_pose_frame_note: String? = null,
    val files: Map<String, ManifestFileEntry>,
)

@Serializable
data class CaptureMetadata(
    val schema_version: String,
    val bundle_id: String,
    val recorded_platform: String,
    val app: JsonObject,
    val sensors: JsonObject,
    val devices: JsonArray? = null,
    val coordinate_conventions: JsonObject? = null,
    val timeline: JsonObject? = null,
)

@Serializable
data class SyncUtcAnchor(
    val valid: Boolean,
    val anchor_utc: String,
    val anchor_monotonic_ns: String? = null,
)

@Serializable
data class SyncStreamSample(
    val t_stream_ns: String,
    val t_utc_ns: String? = null,
    val frame_index: Int? = null,
)

@Serializable
data class SyncStream(
    val stream_id: String,
    val clock: String,
    val offset_to_utc_ns: String? = null,
    val samples: List<SyncStreamSample>,
)

@Serializable
data class CaptureSync(
    val schema_version: String,
    val bundle_id: String,
    val utc_epoch_anchor: SyncUtcAnchor,
    val streams: List<SyncStream>? = null,
)

@Serializable
data class PoseSample(
    val timestamp_ns: String,
    val frame_id: Int,
    val tracking_state: String? = null,
    val position_m: List<Double>,
    val orientation_xyzw: List<Double>,
) {
    init {
        assertValidTimestampNs(timestamp_ns)
    }
}

@Serializable
data class ImuSample(
    val timestamp_ns: String,
    val sequence: Int? = null,
    val gyro_rad_s: List<Double>,
    val accel_m_s2: List<Double>,
    val mag_uT: List<Double>? = null,
) {
    init {
        assertValidTimestampNs(timestamp_ns)
    }
}

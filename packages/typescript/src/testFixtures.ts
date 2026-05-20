import type { CaptureManifest, CaptureMetadata, CaptureSync } from "./types.js";

export const TEST_BUNDLE_ID = "550e8400-e29b-41d4-a716-446655440000";
export const TEST_SESSION_ID = "650e8400-e29b-41d4-a716-446655440001";

export function createBaseManifest(overrides: Partial<CaptureManifest> = {}): CaptureManifest {
  return {
    schema_version: "1.0.0",
    bundle_spec_version: "1.0.0",
    bundle_id: TEST_BUNDLE_ID,
    capture_session_id: TEST_SESSION_ID,
    created_at_utc: "2026-05-13T12:00:00.000Z",
    lifecycle: "sealed",
    hash_algorithm: "sha256",
    root_pose_frame: "world_ar_session",
    files: {
      "metadata.json": {
        sha256: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        size_bytes: 100,
      },
    },
    ...overrides,
  };
}

export function createBaseMetadata(overrides: Partial<CaptureMetadata> = {}): CaptureMetadata {
  return {
    schema_version: "1.0.0",
    bundle_id: TEST_BUNDLE_ID,
    recorded_platform: "ios",
    app: { name: "capture-app-ios", version: "1.0.0" },
    sensors: {
      rgb: { present: true, clock_domain: "host_monotonic_ns" },
      depth: { mode: "lidar_dense", units: "meters" },
      imu: { present: true, accel_unit: "m_s2", gyro_unit: "rad_s" },
    },
    ...overrides,
  };
}

export function createBaseSync(overrides: Partial<CaptureSync> = {}): CaptureSync {
  return {
    schema_version: "1.0.0",
    bundle_id: TEST_BUNDLE_ID,
    utc_epoch_anchor: {
      valid: true,
      anchor_utc: "2026-05-13T12:00:00.000Z",
    },
    streams: [
      {
        stream_id: "pose",
        clock: "ar_frame_timestamp_ns",
        samples: [{ t_stream_ns: "123" }],
      },
    ],
    ...overrides,
  };
}

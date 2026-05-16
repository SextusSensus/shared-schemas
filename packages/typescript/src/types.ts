/** Mirrors `schemas/v1/common.schema.json` enums and shapes used in documents. */

export type BundleLifecycle =
  | "draft"
  | "recording"
  | "sealed"
  | "uploaded"
  | "verified"
  | "failed";

export type RootPoseFrame =
  | "world_ar_session"
  | "world_posemesh_domain"
  | "device_imu"
  | "custom";

export interface ManifestFileEntry {
  sha256: string;
  size_bytes: number;
  media_type?: string;
}

export interface CaptureManifest {
  schema_version: string;
  bundle_spec_version: string;
  bundle_id: string;
  capture_session_id?: string;
  created_at_utc: string;
  lifecycle: BundleLifecycle;
  hash_algorithm: "sha256";
  root_pose_frame?: RootPoseFrame;
  root_pose_frame_note?: string;
  files: Record<string, ManifestFileEntry>;
}

export type RecordedPlatform = "ios" | "android" | "glasses" | "mixed";

export type ArSdk = "arkit" | "arcore" | "none";

export type PosemeshDomainSpace = "right_handed_y_up" | "unspecified";

export interface MetadataDevice {
  device_id: string;
  role: "phone_primary" | "glasses_companion" | "unknown";
  model?: string;
  os_version?: string;
}

export interface CaptureMetadata {
  schema_version: string;
  bundle_id: string;
  recorded_platform: RecordedPlatform;
  app: { name: string; version: string; build?: string };
  devices?: MetadataDevice[];
  coordinate_conventions?: {
    phone_ar_sdk?: ArSdk;
    posemesh_domain_space?: PosemeshDomainSpace;
    notes?: string;
  };
  sensors: {
    rgb: {
      present: boolean;
      codec?: string;
      resolution?: { width_px: number; height_px: number };
      nominal_fps?: number;
      clock_domain?: "host_monotonic_ns" | "sensor_unknown";
      [k: string]: unknown;
    };
    depth: {
      mode:
        | "lidar_dense"
        | "stereo"
        | "tof"
        | "arcore_raw"
        | "none"
        | "unknown";
      units?: "meters" | "millimeters" | "normalized" | "unknown";
      [k: string]: unknown;
    };
    imu: {
      present: boolean;
      accel_unit?: "m_s2" | "g" | "unknown";
      gyro_unit?: "rad_s" | "deg_s" | "unknown";
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  timeline?: {
    recording_start_utc?: string;
    recording_end_utc?: string;
  };
}

export interface SyncStreamSample {
  t_stream_ns: string;
  t_utc_ns?: string;
  frame_index?: number;
}

export interface SyncStream {
  stream_id: string;
  clock:
    | "utc_epoch_ns"
    | "host_monotonic_ns"
    | "ar_frame_timestamp_ns"
    | "sensor_batch_ns"
    | "unknown";
  offset_to_utc_ns?: string;
  samples: SyncStreamSample[];
}

export interface CaptureSync {
  schema_version: string;
  bundle_id: string;
  utc_epoch_anchor: {
    valid: boolean;
    anchor_utc: string;
    anchor_monotonic_ns?: string;
  };
  streams?: SyncStream[];
}

export interface PoseSample {
  timestamp_ns: string;
  frame_id: number;
  tracking_state?:
    | "not_available"
    | "limited"
    | "normal"
    | "unknown";
  position_m: [number, number, number];
  orientation_xyzw: [number, number, number, number];
  linear_velocity_m_s?: [number, number, number];
  angular_velocity_rad_s?: [number, number, number];
}

export interface ImuSample {
  timestamp_ns: string;
  sequence?: number;
  gyro_rad_s: [number, number, number];
  accel_m_s2: [number, number, number];
  mag_uT?: [number, number, number];
}

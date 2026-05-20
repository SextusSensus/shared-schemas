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
  schema_family?: "capture_bundle";
  extends_schema_version?: string;
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

export interface TimestampRange {
  start_ns?: string;
  end_ns?: string;
}

export interface SourceDeviceRef {
  device_id?: string;
  stream_id?: string;
}

export interface AudioMetadata {
  codec?: string;
  sample_rate_hz?: number;
  channels?: number;
  bit_depth?: number;
  duration_ms?: number;
  language?: string;
  bitrate_bps?: number;
  spatial_audio?: boolean;
  noise_reduction?: boolean;
  timestamps?: TimestampRange;
  source_device?: SourceDeviceRef;
  sync_offset_ms?: number;
}

export interface CameraIntrinsics {
  fx: number;
  fy: number;
  cx: number;
  cy: number;
  skew?: number;
}

export interface VideoMetadata {
  codec?: string;
  width_px?: number;
  height_px?: number;
  fps?: number;
  bitrate_bps?: number;
  color_space?: string;
  hdr?: boolean;
  stabilization?: boolean;
  rolling_shutter_correction?: boolean;
  duration_ms?: number;
  orientation?: "portrait" | "landscape_left" | "landscape_right" | "unknown";
  camera_intrinsics?: CameraIntrinsics;
  timestamps?: TimestampRange;
  sync_offset_ms?: number;
}

export interface CalibrationMatrix3x3 {
  values: [number, number, number, number, number, number, number, number, number];
}

export interface CalibrationExtrinsic {
  translation_m: [number, number, number];
  rotation_xyzw: [number, number, number, number];
}

export interface LensDistortion {
  model: "brown_conrady" | "fisheye" | "none" | "unknown";
  coefficients?: number[];
}

export interface DepthCalibration {
  scale?: number;
  bias_m?: number;
  min_range_m?: number;
  max_range_m?: number;
}

export interface ImuCalibration {
  accel_bias?: [number, number, number];
  gyro_bias?: [number, number, number];
  accel_scale?: [number, number, number];
  gyro_scale?: [number, number, number];
}

export interface CalibrationMetadata {
  intrinsic?: CalibrationMatrix3x3;
  extrinsic?: CalibrationExtrinsic;
  lens_distortion?: LensDistortion;
  depth_calibration?: DepthCalibration;
  imu_calibration?: ImuCalibration;
  timestamp_utc?: string;
  calibration_version?: string;
  calibration_source?: "factory" | "runtime" | "manual" | "unknown";
  reprojection_error_px?: number;
  confidence_score?: number;
}

export interface BoundingBox3d {
  min: [number, number, number];
  max: [number, number, number];
}

export interface LodLevel {
  level: number;
  face_count?: number;
  vertex_count?: number;
}

export interface MeshMetadata {
  mesh_format?: "obj" | "ply" | "glb" | "fbx" | "unknown";
  vertex_count?: number;
  face_count?: number;
  normals?: boolean;
  uv_channels?: number;
  texture_references?: string[];
  compression?: "none" | "draco" | "meshopt" | "unknown";
  coordinate_system?: string;
  scale?: number;
  bounding_box?: BoundingBox3d;
  generation_pipeline?: string;
  lod_levels?: LodLevel[];
}

export type ReconstructionStatus = "not_started" | "in_progress" | "completed" | "failed" | "partial";

export interface ReconstructionStats {
  sparse_points?: number;
  dense_points?: number;
  keyframes?: number;
}

export interface DevicePairingInfo {
  primary_device_id?: string;
  companion_device_ids?: string[];
  sync_quality?: "excellent" | "good" | "degraded" | "unknown";
}

export interface ReconstructionMetadata {
  status?: ReconstructionStatus;
  algorithm?: string;
  pipeline_version?: string;
  processing_duration_ms?: number;
  tracking_quality?: "excellent" | "good" | "degraded" | "lost" | "unknown";
  failure_reason?:
    | "none"
    | "tracking_loss"
    | "insufficient_features"
    | "sensor_desync"
    | "corrupted_frames"
    | "unknown";
  stats?: ReconstructionStats;
  point_cloud_references?: string[];
  timestamps?: TimestampRange;
  device_pairing_info?: DevicePairingInfo;
}

export interface ExportMetadata {
  export_format: string;
  export_version?: string;
  compression_settings?: string;
  export_timestamp_utc?: string;
  source_bundle_id?: string;
  export_target?: string;
  conversion_pipeline?: string;
  checksum_sha256?: string;
  exported_assets?: string[];
}

export interface LabeledObjectAnnotation {
  object_id: string;
  label: string;
  tracking_id?: string;
  confidence?: number;
  segmentation_ref?: string;
}

export interface LabelingMetadata {
  semantic_labels?: string[];
  object_annotations?: LabeledObjectAnnotation[];
  tracking_ids?: string[];
  confidence_scores?: number[];
  segmentation_references?: string[];
  label_taxonomy_version?: string;
  annotator_source?: "human" | "model" | "hybrid" | "unknown";
  timestamps?: TimestampRange;
  review_status?: "not_reviewed" | "in_review" | "approved" | "rejected";
}

export interface CaptureMetadata {
  schema_version: string;
  schema_family?: "capture_bundle";
  extends_schema_version?: string;
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
  audio?: AudioMetadata;
  video?: VideoMetadata;
  calibration?: CalibrationMetadata;
  mesh?: MeshMetadata;
  reconstruction?: ReconstructionMetadata;
  exports?: ExportMetadata[];
  labeling?: LabelingMetadata;
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
  schema_family?: "capture_bundle";
  extends_schema_version?: string;
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

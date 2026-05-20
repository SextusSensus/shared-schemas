import { describe, expect, it } from "vitest";
import { getMetadataValidator } from "./validate.js";
import { createBaseMetadata, TEST_BUNDLE_ID } from "./testFixtures.js";

describe("metadata schema expansion", () => {
  it("accepts full expanded metadata blocks", () => {
    const metadata = createBaseMetadata({
      schema_version: "1.1.0",
      audio: {
        codec: "aac",
        sample_rate_hz: 48000,
        channels: 2,
        bit_depth: 24,
        duration_ms: 12001.5,
        language: "en-US",
        bitrate_bps: 256000,
        spatial_audio: true,
        noise_reduction: true,
        timestamps: { start_ns: "1700000000000000000", end_ns: "1700000000120000000" },
        source_device: { device_id: TEST_BUNDLE_ID, stream_id: "audio" },
        sync_offset_ms: -12.5,
      },
      video: {
        codec: "h265",
        width_px: 1920,
        height_px: 1080,
        fps: 60,
        bitrate_bps: 12000000,
        color_space: "bt2020",
        hdr: true,
        stabilization: true,
        rolling_shutter_correction: true,
        duration_ms: 12000,
        orientation: "landscape_left",
        camera_intrinsics: { fx: 1200.5, fy: 1199.8, cx: 960, cy: 540, skew: 0 },
        timestamps: { start_ns: "1700000000000000000", end_ns: "1700000000120000000" },
        sync_offset_ms: 1.2,
      },
      calibration: {
        intrinsic: {
          values: [1200, 0, 960, 0, 1200, 540, 0, 0, 1],
        },
        extrinsic: {
          translation_m: [0.01, -0.02, 0.03],
          rotation_xyzw: [0, 0, 0, 1],
        },
        lens_distortion: {
          model: "brown_conrady",
          coefficients: [0.01, -0.001, 0.0002, 0, 0],
        },
        depth_calibration: { scale: 1, bias_m: 0, min_range_m: 0.1, max_range_m: 5 },
        imu_calibration: {
          accel_bias: [0.01, -0.02, 0.03],
          gyro_bias: [0.001, -0.001, 0.002],
          accel_scale: [1, 1, 1],
          gyro_scale: [1, 1, 1],
        },
        timestamp_utc: "2026-05-13T12:00:00.000Z",
        calibration_version: "1.1.0",
        calibration_source: "runtime",
        reprojection_error_px: 0.42,
        confidence_score: 0.94,
      },
      mesh: {
        mesh_format: "glb",
        vertex_count: 120034,
        face_count: 240011,
        normals: true,
        uv_channels: 2,
        texture_references: ["assets/textures/albedo.ktx2", "assets/textures/normal.ktx2"],
        compression: "draco",
        coordinate_system: "right_handed_y_up",
        scale: 1,
        bounding_box: { min: [-2, -1, -1], max: [2, 2.5, 3] },
        generation_pipeline: "mentra-recon-4",
        lod_levels: [
          { level: 0, face_count: 240011, vertex_count: 120034 },
          { level: 1, face_count: 120000, vertex_count: 60000 },
        ],
      },
      reconstruction: {
        status: "completed",
        algorithm: "multi_view_stereo",
        pipeline_version: "2.2.1",
        processing_duration_ms: 45000,
        tracking_quality: "good",
        failure_reason: "none",
        stats: { sparse_points: 120000, dense_points: 2400000, keyframes: 1800 },
        point_cloud_references: ["assets/pointclouds/sparse.ply", "assets/pointclouds/dense.ply"],
        timestamps: { start_ns: "1700000000000000000", end_ns: "1700000000320000000" },
        device_pairing_info: {
          primary_device_id: TEST_BUNDLE_ID,
          companion_device_ids: ["650e8400-e29b-41d4-a716-446655440001"],
          sync_quality: "good",
        },
      },
      exports: [
        {
          export_format: "glb",
          export_version: "1.0.0",
          compression_settings: "draco:q7",
          export_timestamp_utc: "2026-05-13T12:10:00.000Z",
          source_bundle_id: TEST_BUNDLE_ID,
          export_target: "cloud://reconstruction/eu-west-1",
          conversion_pipeline: "bundle-export-v1",
          checksum_sha256: "f".repeat(64),
          exported_assets: ["exports/model.glb", "exports/metadata.json"],
        },
      ],
      labeling: {
        semantic_labels: ["floor", "chair", "table"],
        object_annotations: [
          {
            object_id: "obj-chair-01",
            label: "chair",
            tracking_id: "trk-100",
            confidence: 0.91,
            segmentation_ref: "assets/segments/chair-01.bin",
          },
        ],
        tracking_ids: ["trk-100"],
        confidence_scores: [0.91],
        segmentation_references: ["assets/segments/chair-01.bin"],
        label_taxonomy_version: "2.1.0",
        annotator_source: "hybrid",
        timestamps: { start_ns: "1700000000000000000", end_ns: "1700000000050000000" },
        review_status: "approved",
      },
    });

    const validator = getMetadataValidator();
    expect(validator(metadata)).toBe(true);
  });

  it("rejects invalid expanded metadata values", () => {
    const invalid = createBaseMetadata({
      audio: {
        sample_rate_hz: 0,
      },
      calibration: {
        confidence_score: 1.4,
      },
      reconstruction: {
        status: "failed",
        failure_reason: "not-a-valid-enum" as unknown as
          | "none"
          | "tracking_loss"
          | "insufficient_features"
          | "sensor_desync"
          | "corrupted_frames"
          | "unknown",
      },
    });

    const validator = getMetadataValidator();
    expect(validator(invalid)).toBe(false);
  });
});

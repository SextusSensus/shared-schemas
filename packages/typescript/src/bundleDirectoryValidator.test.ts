import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import {
  validateCaptureBundleDirectory,
  isValidTimestampNsString,
} from "./bundleDirectoryValidator.js";
import type { CaptureManifest } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BUNDLE_ID = "550e8400-e29b-41d4-a716-446655440000";
const SESSION_ID = "650e8400-e29b-41d4-a716-446655440001";

async function writeTmp(name: string, files: Record<string, string | Buffer>) {
  const root = path.join(__dirname, "..", "..", "..", "target", `vitest-${name}`);
  await fs.mkdir(root, { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    const p = path.join(root, rel);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, content);
  }
  return root;
}

function sha(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function baseManifest(overrides: Partial<CaptureManifest> = {}): CaptureManifest {
  return {
    schema_version: "1.0.0",
    bundle_spec_version: "1.0.0",
    bundle_id: BUNDLE_ID,
    capture_session_id: SESSION_ID,
    created_at_utc: "2026-05-13T12:00:00.000Z",
    lifecycle: "sealed",
    hash_algorithm: "sha256",
    root_pose_frame: "world_ar_session",
    files: {},
    ...overrides,
  };
}

describe("timestamp validation", () => {
  it("rejects leading zeros and non-numeric", () => {
    expect(isValidTimestampNsString("0123")).toBe(false);
    expect(isValidTimestampNsString("abc")).toBe(false);
  });
  it("accepts canonical ns strings", () => {
    expect(isValidTimestampNsString("0")).toBe(true);
    expect(isValidTimestampNsString("1700000000000000000")).toBe(true);
  });
});

describe("capture bundle directory validation", () => {
  it("accepts a minimal well-formed bundle", async () => {
    const metadata = Buffer.from(
      JSON.stringify({
        schema_version: "1.0.0",
        bundle_id: BUNDLE_ID,
        recorded_platform: "ios",
        app: { name: "capture-app-ios", version: "1.0.0" },
        sensors: {
          rgb: { present: true, clock_domain: "host_monotonic_ns" },
          depth: { mode: "lidar_dense", units: "meters" },
          imu: { present: true, accel_unit: "m_s2", gyro_unit: "rad_s" },
        },
      }),
    );
    const sync = Buffer.from(
      JSON.stringify({
        schema_version: "1.0.0",
        bundle_id: BUNDLE_ID,
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
      }),
    );
    const poseLine = `${JSON.stringify({
      timestamp_ns: "1700000000000000000",
      frame_id: 0,
      position_m: [0, 0, 0],
      orientation_xyzw: [0, 0, 0, 1],
    })}\n`;
    const imuLine = `${JSON.stringify({
      timestamp_ns: "1700000000000000000",
      gyro_rad_s: [0, 0, 0],
      accel_m_s2: [0, 0, 9.81],
    })}\n`;

    const poseBuf = Buffer.from(poseLine, "utf8");
    const imuBuf = Buffer.from(imuLine, "utf8");

    const manifestObj = baseManifest({
      files: {
        "metadata.json": { sha256: sha(metadata), size_bytes: metadata.length },
        "sync.json": { sha256: sha(sync), size_bytes: sync.length },
        "pose.jsonl": { sha256: sha(poseBuf), size_bytes: poseBuf.length },
        "imu.jsonl": { sha256: sha(imuBuf), size_bytes: imuBuf.length },
      },
    });
    const manifest = Buffer.from(JSON.stringify(manifestObj, null, 2), "utf8");

    const root = await writeTmp("ok", {
      "manifest.json": manifest,
      "metadata.json": metadata,
      "sync.json": sync,
      "pose.jsonl": poseBuf,
      "imu.jsonl": imuBuf,
    });
    const issues = await validateCaptureBundleDirectory(root);
    expect(issues).toEqual([]);
  });

  it("flags malformed manifest JSON", async () => {
    const root = await writeTmp("bad-json", { "manifest.json": "{not json" });
    const issues = await validateCaptureBundleDirectory(root);
    expect(issues.some((i) => i.code === "malformed_manifest_json")).toBe(true);
  });

  it("flags schema-invalid manifest", async () => {
    const root = await writeTmp("bad-schema", {
      "manifest.json": JSON.stringify({}),
    });
    const issues = await validateCaptureBundleDirectory(root);
    expect(issues.some((i) => i.code === "manifest_schema")).toBe(true);
  });

  it("flags missing assets declared in manifest", async () => {
    const manifestObj = baseManifest({
      files: {
        "metadata.json": { sha256: "a".repeat(64), size_bytes: 1 },
      },
    });
    const root = await writeTmp("missing", {
      "manifest.json": JSON.stringify(manifestObj),
    });
    const issues = await validateCaptureBundleDirectory(root);
    expect(issues.some((i) => i.code === "missing_required_asset")).toBe(true);
    expect(issues.some((i) => i.code === "missing_file_on_disk")).toBe(true);
  });

  it("flags hash and size mismatch", async () => {
    const content = Buffer.from("hello");
    const manifestObj = baseManifest({
      files: {
        "metadata.json": {
          sha256: "0".repeat(64),
          size_bytes: 999,
        },
      },
    });
    const root = await writeTmp("hash", {
      "manifest.json": JSON.stringify(manifestObj),
      "metadata.json": content,
    });
    const issues = await validateCaptureBundleDirectory(root);
    expect(issues.some((i) => i.code === "hash_mismatch")).toBe(true);
    expect(issues.some((i) => i.code === "size_mismatch")).toBe(true);
  });

  it("flags invalid timestamp_ns in jsonl", async () => {
    const metadata = Buffer.from(
      JSON.stringify({
        schema_version: "1.0.0",
        bundle_id: BUNDLE_ID,
        recorded_platform: "android",
        app: { name: "capture-app-android", version: "1.0.0" },
        sensors: {
          rgb: { present: true },
          depth: { mode: "none" },
          imu: { present: true },
        },
      }),
    );
    const sync = Buffer.from(
      JSON.stringify({
        schema_version: "1.0.0",
        bundle_id: BUNDLE_ID,
        utc_epoch_anchor: { valid: false, anchor_utc: "2026-05-13T12:00:00.000Z" },
        streams: [{ stream_id: "imu", clock: "unknown", samples: [{ t_stream_ns: "1" }] }],
      }),
    );
    const badPose = `${JSON.stringify({
      timestamp_ns: "00",
      frame_id: 0,
      position_m: [0, 0, 0],
      orientation_xyzw: [0, 0, 0, 1],
    })}\n`;
    const imuLine = `${JSON.stringify({
      timestamp_ns: "01",
      gyro_rad_s: [0, 0, 0],
      accel_m_s2: [0, 0, 9.81],
    })}\n`;

    const poseBuf = Buffer.from(badPose, "utf8");
    const imuBuf = Buffer.from(imuLine, "utf8");
    const manifestObj = baseManifest({
      files: {
        "metadata.json": { sha256: sha(metadata), size_bytes: metadata.length },
        "sync.json": { sha256: sha(sync), size_bytes: sync.length },
        "pose.jsonl": { sha256: sha(poseBuf), size_bytes: poseBuf.length },
        "imu.jsonl": { sha256: sha(imuBuf), size_bytes: imuBuf.length },
      },
    });

    const root = await writeTmp("ts", {
      "manifest.json": JSON.stringify(manifestObj),
      "metadata.json": metadata,
      "sync.json": sync,
      "pose.jsonl": poseBuf,
      "imu.jsonl": imuBuf,
    });
    const issues = await validateCaptureBundleDirectory(root);
    expect(issues.some((i) => i.code === "invalid_timestamp_ns")).toBe(true);
  });
});

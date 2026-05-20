import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { ValidateFunction } from "ajv";
import type { CaptureManifest } from "./types.js";
import {
  getImuLineValidator,
  getManifestValidator,
  getMetadataValidator,
  getPoseLineValidator,
  getSyncValidator,
  formatAjvErrors,
} from "./validate.js";
import { REQUIRED_BUNDLE_FILES } from "./bundleSpec.js";

export type BundleValidationIssue = {
  code: string;
  message: string;
  path?: string;
};

function sha256HexOfBuffer(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

/** Validates whether a nanoseconds-since-epoch string is plausible UTF-8 digits in uint64 range. */
export function isValidTimestampNsString(s: string): boolean {
  if (!/^[0-9]{1,19}$/.test(s)) return false;
  if (s.length > 1 && s.startsWith("0")) return false;
  const bi = BigInt(s);
  return bi >= 0n && bi <= 18446744073709551615n;
}

export interface ValidateBundleDirectoryOptions {
  /** If true, require metadata.bundle_id === manifest.bundle_id, etc. */
  strictIds?: boolean;
}

export async function validateCaptureBundleDirectory(
  bundleRoot: string,
  options: ValidateBundleDirectoryOptions = {},
): Promise<BundleValidationIssue[]> {
  const issues: BundleValidationIssue[] = [];
  const strictIds = options.strictIds ?? true;

  const manifestPath = path.join(bundleRoot, "manifest.json");
  let manifestRaw: string;
  try {
    manifestRaw = await fs.readFile(manifestPath, "utf8");
  } catch {
    return [
      {
        code: "missing_manifest",
        message: "manifest.json is missing or unreadable",
        path: manifestPath,
      },
    ];
  }

  let manifest: CaptureManifest;
  try {
    manifest = JSON.parse(manifestRaw) as CaptureManifest;
  } catch {
    return [
      {
        code: "malformed_manifest_json",
        message: "manifest.json is not valid JSON",
        path: manifestPath,
      },
    ];
  }

  const mv = getManifestValidator();
  if (!mv(manifest)) {
    issues.push({
      code: "manifest_schema",
      message: formatAjvErrors(mv.errors) || "manifest failed schema validation",
      path: manifestPath,
    });
    return issues;
  }

  if (manifest.root_pose_frame === "custom" && !manifest.root_pose_frame_note) {
    issues.push({
      code: "custom_frame_note",
      message: "root_pose_frame is custom but root_pose_frame_note is missing",
    });
  }

  for (const req of REQUIRED_BUNDLE_FILES) {
    if (!Object.hasOwn(manifest.files, req)) {
      issues.push({
        code: "missing_required_asset",
        message: `manifest.files is missing required entry '${req}'`,
      });
    }
  }

  for (const [rel, desc] of Object.entries(manifest.files)) {
    const abs = path.join(bundleRoot, rel);
    let buf: Buffer;
    try {
      buf = await fs.readFile(abs);
    } catch {
      issues.push({
        code: "missing_file_on_disk",
        message: `File '${rel}' listed in manifest is missing on disk`,
        path: abs,
      });
      continue;
    }
    if (buf.length !== desc.size_bytes) {
      issues.push({
        code: "size_mismatch",
        message: `File '${rel}' size ${buf.length} does not match manifest size_bytes ${desc.size_bytes}`,
        path: abs,
      });
    }
    const h = sha256HexOfBuffer(buf);
    if (h !== desc.sha256) {
      issues.push({
        code: "hash_mismatch",
        message: `File '${rel}' sha256 ${h} does not match manifest ${desc.sha256}`,
        path: abs,
      });
    }
  }

  async function validateJsonFile(
    rel: string,
    validator: ValidateFunction,
  ): Promise<void> {
    const abs = path.join(bundleRoot, rel);
    let raw: string;
    try {
      raw = await fs.readFile(abs, "utf8");
    } catch {
      issues.push({
        code: "missing_sidecar",
        message: `Cannot read ${rel}`,
        path: abs,
      });
      return;
    }
    let doc: unknown;
    try {
      doc = JSON.parse(raw);
    } catch {
      issues.push({
        code: "malformed_json",
        message: `${rel} is not valid JSON`,
        path: abs,
      });
      return;
    }
    if (!validator(doc)) {
      issues.push({
        code: "schema_validation",
        message: `${rel}: ${formatAjvErrors(validator.errors)}`,
        path: abs,
      });
      return;
    }
    if (strictIds && rel === "metadata.json" && doc && typeof doc === "object") {
      const d = doc as { bundle_id?: string };
      if (d.bundle_id !== manifest.bundle_id) {
        issues.push({
          code: "bundle_id_mismatch",
          message: "metadata.bundle_id does not match manifest.bundle_id",
        });
      }
    }
    if (strictIds && rel === "sync.json" && doc && typeof doc === "object") {
      const d = doc as { bundle_id?: string };
      if (d.bundle_id !== manifest.bundle_id) {
        issues.push({
          code: "bundle_id_mismatch",
          message: "sync.bundle_id does not match manifest.bundle_id",
        });
      }
    }
  }

  await validateJsonFile("metadata.json", getMetadataValidator());
  await validateJsonFile("sync.json", getSyncValidator());

  async function validateJsonl(
    rel: string,
    lineValidator: ValidateFunction,
    stream: "pose" | "imu",
  ): Promise<void> {
    const abs = path.join(bundleRoot, rel);
    let raw: string;
    try {
      raw = await fs.readFile(abs, "utf8");
    } catch {
      issues.push({
        code: "missing_jsonl",
        message: `Cannot read ${rel}`,
        path: abs,
      });
      return;
    }
    const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
    if (lines.length === 0) {
      issues.push({
        code: "empty_jsonl",
        message: `${rel} has no non-empty lines`,
        path: abs,
      });
    }
    const pv = lineValidator;
    for (let i = 0; i < lines.length; i++) {
      let obj: unknown;
      try {
        obj = JSON.parse(lines[i] ?? "");
      } catch {
        issues.push({
          code: "jsonl_parse",
          message: `${rel} line ${i + 1} is not valid JSON`,
          path: abs,
        });
        continue;
      }
      if (!pv(obj)) {
        issues.push({
          code: "jsonl_schema",
          message: `${rel} line ${i + 1}: ${formatAjvErrors(pv.errors)}`,
          path: abs,
        });
        continue;
      }
      if (stream === "pose" || stream === "imu") {
        const ts = (obj as { timestamp_ns?: string }).timestamp_ns;
        if (ts !== undefined && !isValidTimestampNsString(ts)) {
          issues.push({
            code: "invalid_timestamp_ns",
            message: `${rel} line ${i + 1}: timestamp_ns is not a valid ns string`,
            path: abs,
          });
        }
      }
    }
  }

  await validateJsonl("pose.jsonl", getPoseLineValidator(), "pose");
  await validateJsonl("imu.jsonl", getImuLineValidator(), "imu");

  return issues;
}

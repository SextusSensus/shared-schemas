import type { CaptureManifest, CaptureMetadata, CaptureSync } from "./types.js";

export const CAPTURE_BUNDLE_SCHEMA_FAMILY = "capture_bundle" as const;
export const CAPTURE_BUNDLE_VERSION_V1 = "1.0.0" as const;
export const CAPTURE_BUNDLE_VERSION_V1_1 = "1.1.0" as const;
export const SUPPORTED_CAPTURE_BUNDLE_VERSIONS = [
  CAPTURE_BUNDLE_VERSION_V1,
  CAPTURE_BUNDLE_VERSION_V1_1,
] as const;

export type CaptureBundleSchemaVersion = (typeof SUPPORTED_CAPTURE_BUNDLE_VERSIONS)[number];

export interface VersionedSchemaDocument {
  schema_version: string;
  schema_family?: typeof CAPTURE_BUNDLE_SCHEMA_FAMILY;
  extends_schema_version?: string;
}

export interface CaptureBundleV1 {
  manifest: CaptureManifest;
  metadata: CaptureMetadata;
  sync: CaptureSync;
  pose?: unknown[];
  imu?: unknown[];
}

export interface CaptureBundleV1_1 extends CaptureBundleV1 {
  metadata: CaptureMetadata & {
    schema_version: typeof CAPTURE_BUNDLE_VERSION_V1_1;
    extends_schema_version?: typeof CAPTURE_BUNDLE_VERSION_V1;
  };
}

function parseSemver(version: string): [number, number, number] | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function compareSchemaVersions(a: string, b: string): number {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }
  if (pa[0] !== pb[0]) return pa[0] - pb[0];
  if (pa[1] !== pb[1]) return pa[1] - pb[1];
  return pa[2] - pb[2];
}

export function isSupportedCaptureBundleVersion(
  schemaVersion: string,
): schemaVersion is CaptureBundleSchemaVersion {
  return (SUPPORTED_CAPTURE_BUNDLE_VERSIONS as readonly string[]).includes(schemaVersion);
}

export function resolveNearestSupportedVersion(schemaVersion: string): CaptureBundleSchemaVersion | null {
  if (isSupportedCaptureBundleVersion(schemaVersion)) {
    return schemaVersion;
  }
  if (compareSchemaVersions(schemaVersion, CAPTURE_BUNDLE_VERSION_V1_1) >= 0) {
    return CAPTURE_BUNDLE_VERSION_V1_1;
  }
  if (compareSchemaVersions(schemaVersion, CAPTURE_BUNDLE_VERSION_V1) >= 0) {
    return CAPTURE_BUNDLE_VERSION_V1;
  }
  return null;
}

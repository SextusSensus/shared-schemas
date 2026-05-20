/** Capture Bundle v1 — canonical relative paths from bundle root. */
export const BUNDLE_SPEC_VERSION = "1.0.0" as const;

export const REQUIRED_BUNDLE_FILES = [
  "metadata.json",
  "sync.json",
  "pose.jsonl",
  "imu.jsonl",
] as const;

export type RequiredBundleFile = (typeof REQUIRED_BUNDLE_FILES)[number];

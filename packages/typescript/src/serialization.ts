export interface StableStringifyOptions {
  sortArrays?: boolean;
}

const CANONICAL_ARRAY_PATHS = new Set<string>([
  "exports",
  "mesh.texture_references",
  "mesh.lod_levels",
  "reconstruction.point_cloud_references",
  "reconstruction.device_pairing_info.companion_device_ids",
  "labeling.semantic_labels",
  "labeling.object_annotations",
  "labeling.tracking_ids",
  "labeling.segmentation_references",
  "exports[].exported_assets",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeNumber(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Non-finite numbers are not allowed in canonical serialization.");
  }
  return Object.is(value, -0) ? 0 : value;
}

function normalizePath(path: string[]): string {
  return path.join(".");
}

function shouldSortArray(path: string[], options: StableStringifyOptions): boolean {
  if (options.sortArrays) return true;
  const exactPath = normalizePath(path);
  if (CANONICAL_ARRAY_PATHS.has(exactPath)) return true;
  const wildcardPath = exactPath.replace(/\.\d+(?=\.|$)/g, "[]");
  return CANONICAL_ARRAY_PATHS.has(wildcardPath);
}

function compareCanonicalValues(a: unknown, b: unknown): number {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa < sb) return -1;
  if (sa > sb) return 1;
  return 0;
}

function normalizeValue(
  value: unknown,
  path: string[],
  options: StableStringifyOptions,
): unknown {
  if (typeof value === "number") {
    return normalizeNumber(value);
  }

  if (Array.isArray(value)) {
    const normalizedArray = value.map((entry, index) =>
      normalizeValue(entry, [...path, String(index)], options),
    );
    if (!shouldSortArray(path, options)) {
      return normalizedArray;
    }
    return [...normalizedArray].sort(compareCanonicalValues);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const keys = Object.keys(value).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const normalized: Record<string, unknown> = {};
  for (const key of keys) {
    normalized[key] = normalizeValue(value[key], [...path, key], options);
  }
  return normalized;
}

export function stableStringify(
  value: unknown,
  options: StableStringifyOptions = {},
): string {
  return JSON.stringify(normalizeValue(value, [], options));
}

export function serializeCanonical(
  value: unknown,
  options: StableStringifyOptions = {},
): string {
  return stableStringify(value, options);
}

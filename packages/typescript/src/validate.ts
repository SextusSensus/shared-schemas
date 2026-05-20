import type { Ajv, ErrorObject, ValidateFunction } from "ajv";
import { Ajv2020 } from "ajv/dist/2020.js";
import formatsPlugin from "ajv-formats";
import fs from "node:fs";
import path from "node:path";
import { schemaV1Dir } from "./paths.js";
import { resolveNearestSupportedVersion } from "./versioning.js";

function createAjv(): Ajv {
  return new Ajv2020({
    allErrors: true,
    strict: true,
    validateSchema: true,
    allowUnionTypes: true,
  }) as unknown as Ajv;
}

function loadSchema(name: string): object {
  const p = path.join(schemaV1Dir(), name);
  return JSON.parse(fs.readFileSync(p, "utf8")) as object;
}

const ajvSingleton = createAjv();
(formatsPlugin as unknown as (a: Ajv) => void)(ajvSingleton);

const manifests = [
  "common.schema.json",
  "manifest.schema.json",
  "metadata.schema.json",
  "sync.schema.json",
  "pose-line.schema.json",
  "imu-line.schema.json",
] as const;

for (const f of manifests) {
  ajvSingleton.addSchema(loadSchema(f));
}

export function getManifestValidator(): ValidateFunction {
  return ajvSingleton.getSchema(
    "https://schemas.mentraos.global/capture-bundle/v1/manifest.schema.json",
  ) as ValidateFunction;
}

export function getMetadataValidator(): ValidateFunction {
  return ajvSingleton.getSchema(
    "https://schemas.mentraos.global/capture-bundle/v1/metadata.schema.json",
  ) as ValidateFunction;
}

export function getSyncValidator(): ValidateFunction {
  return ajvSingleton.getSchema(
    "https://schemas.mentraos.global/capture-bundle/v1/sync.schema.json",
  ) as ValidateFunction;
}

export function getPoseLineValidator(): ValidateFunction {
  return ajvSingleton.getSchema(
    "https://schemas.mentraos.global/capture-bundle/v1/pose-line.schema.json",
  ) as ValidateFunction;
}

export function getImuLineValidator(): ValidateFunction {
  return ajvSingleton.getSchema(
    "https://schemas.mentraos.global/capture-bundle/v1/imu-line.schema.json",
  ) as ValidateFunction;
}

export type BundleDocumentKind = "manifest" | "metadata" | "sync" | "pose-line" | "imu-line";

export function getValidatorForKind(kind: BundleDocumentKind): ValidateFunction {
  if (kind === "manifest") return getManifestValidator();
  if (kind === "metadata") return getMetadataValidator();
  if (kind === "sync") return getSyncValidator();
  if (kind === "pose-line") return getPoseLineValidator();
  return getImuLineValidator();
}

export interface VersionAwareValidationResult {
  valid: boolean;
  resolved_version: string | null;
  errors: string;
}

export function validateVersionedDocument(
  kind: BundleDocumentKind,
  document: unknown,
): VersionAwareValidationResult {
  const schemaVersion =
    document && typeof document === "object" && typeof (document as { schema_version?: unknown }).schema_version === "string"
      ? (document as { schema_version: string }).schema_version
      : null;
  const resolvedVersion = schemaVersion ? resolveNearestSupportedVersion(schemaVersion) : null;
  const validator = getValidatorForKind(kind);
  const valid = validator(document);
  return {
    valid,
    resolved_version: resolvedVersion,
    errors: valid ? "" : formatAjvErrors(validator.errors),
  };
}

export function formatAjvErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors?.length) return "";
  return errors
    .map((e) => `${e.instancePath || "/"} ${e.message ?? ""}`.trim())
    .join("\n");
}

import type { ValidateFunction } from "ajv";
import type { CaptureManifest, CaptureMetadata, CaptureSync } from "./types.js";
import {
  CAPTURE_BUNDLE_VERSION_V1,
  CAPTURE_BUNDLE_VERSION_V1_1,
  compareSchemaVersions,
  isSupportedCaptureBundleVersion,
  type CaptureBundleSchemaVersion,
} from "./versioning.js";
import {
  getManifestValidator,
  getMetadataValidator,
  getSyncValidator,
  formatAjvErrors,
} from "./validate.js";

export type SchemaDocumentKind = "manifest" | "metadata" | "sync";

export interface MigrationMessage {
  code: string;
  message: string;
}

export interface MigrationResult<T> {
  document: T;
  from_version: string;
  to_version: CaptureBundleSchemaVersion;
  warnings: MigrationMessage[];
}

interface SchemaMigration<TDoc extends { schema_version: string }> {
  kind: SchemaDocumentKind;
  fromVersion: string;
  toVersion: CaptureBundleSchemaVersion;
  migrate: (doc: TDoc) => MigrationResult<TDoc>;
}

type AnySchemaDocument = CaptureManifest | CaptureMetadata | CaptureSync;

const migrationRegistry: SchemaMigration<AnySchemaDocument>[] = [];

function registerMigration<TDoc extends { schema_version: string }>(
  migration: SchemaMigration<TDoc>,
): void {
  migrationRegistry.push(migration as unknown as SchemaMigration<AnySchemaDocument>);
}

function validatorForKind(kind: SchemaDocumentKind): ValidateFunction {
  if (kind === "manifest") return getManifestValidator();
  if (kind === "metadata") return getMetadataValidator();
  return getSyncValidator();
}

function cloneDoc<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

function validateOrThrow(kind: SchemaDocumentKind, document: unknown, stage: string): void {
  const validator = validatorForKind(kind);
  if (!validator(document)) {
    throw new Error(`${kind} ${stage} validation failed: ${formatAjvErrors(validator.errors)}`);
  }
}

registerMigration<CaptureMetadata>({
  kind: "metadata",
  fromVersion: CAPTURE_BUNDLE_VERSION_V1,
  toVersion: CAPTURE_BUNDLE_VERSION_V1_1,
  migrate: (doc) => {
    const next: CaptureMetadata = { ...doc, schema_version: CAPTURE_BUNDLE_VERSION_V1_1 };
    const warnings: MigrationMessage[] = [];
    if (!next.timeline?.recording_start_utc || !next.timeline?.recording_end_utc) {
      warnings.push({
        code: "timeline_partial",
        message: "timeline is missing one or more boundary timestamps.",
      });
    }
    return {
      document: next,
      from_version: CAPTURE_BUNDLE_VERSION_V1,
      to_version: CAPTURE_BUNDLE_VERSION_V1_1,
      warnings,
    };
  },
});

function applyMigration(
  kind: SchemaDocumentKind,
  document: AnySchemaDocument,
  fromVersion: string,
  toVersion: CaptureBundleSchemaVersion,
): MigrationResult<AnySchemaDocument> {
  let current = cloneDoc(document);
  let cursor = fromVersion;
  const warnings: MigrationMessage[] = [];

  const ordered = migrationRegistry
    .filter((migration) => migration.kind === kind)
    .sort((a, b) => compareSchemaVersions(a.fromVersion, b.fromVersion));

  while (compareSchemaVersions(cursor, toVersion) < 0) {
    const step = ordered.find((candidate) => candidate.fromVersion === cursor);
    if (!step) {
      throw new Error(`No migration registered for ${kind} from version ${cursor}.`);
    }
    const result = step.migrate(current);
    current = result.document;
    cursor = result.to_version;
    warnings.push(...result.warnings);
  }

  return {
    document: current,
    from_version: fromVersion,
    to_version: toVersion,
    warnings,
  };
}

export interface MigrateSchemaOptions {
  targetVersion?: CaptureBundleSchemaVersion;
  validateBefore?: boolean;
  validateAfter?: boolean;
}

export function migrateSchema<TDoc extends AnySchemaDocument>(
  kind: SchemaDocumentKind,
  document: TDoc,
  options: MigrateSchemaOptions = {},
): MigrationResult<TDoc> {
  const fromVersion = document.schema_version;
  if (options.validateBefore !== false) {
    validateOrThrow(kind, document, "before migration");
  }
  if (!isSupportedCaptureBundleVersion(fromVersion)) {
    throw new Error(`Unsupported schema version '${fromVersion}' for ${kind}.`);
  }
  const defaultTarget =
    kind === "metadata" ? CAPTURE_BUNDLE_VERSION_V1_1 : (fromVersion as CaptureBundleSchemaVersion);
  const toVersion = options.targetVersion ?? defaultTarget;
  const result =
    compareSchemaVersions(fromVersion, toVersion) === 0
      ? {
          document: cloneDoc(document),
          from_version: fromVersion,
          to_version: toVersion,
          warnings: [],
        }
      : applyMigration(kind, document, fromVersion, toVersion);

  if (options.validateAfter !== false) {
    validateOrThrow(kind, result.document, "after migration");
  }

  return result as MigrationResult<TDoc>;
}

export interface CaptureBundleDocuments {
  manifest: CaptureManifest;
  metadata: CaptureMetadata;
  sync: CaptureSync;
}

export interface MigrateBundleResult {
  bundle: CaptureBundleDocuments;
  warnings: MigrationMessage[];
}

export function migrateBundle(
  bundle: CaptureBundleDocuments,
  options: MigrateSchemaOptions = {},
): MigrateBundleResult {
  const manifestTarget =
    options.targetVersion ??
    (isSupportedCaptureBundleVersion(bundle.manifest.schema_version)
      ? bundle.manifest.schema_version
      : CAPTURE_BUNDLE_VERSION_V1);
  const syncTarget =
    options.targetVersion ??
    (isSupportedCaptureBundleVersion(bundle.sync.schema_version)
      ? bundle.sync.schema_version
      : CAPTURE_BUNDLE_VERSION_V1);

  const metadataResult = migrateSchema("metadata", bundle.metadata, options);
  const manifestResult = migrateSchema("manifest", bundle.manifest, {
    ...options,
    targetVersion: manifestTarget,
  });
  const syncResult = migrateSchema("sync", bundle.sync, {
    ...options,
    targetVersion: syncTarget,
  });

  return {
    bundle: {
      manifest: manifestResult.document as CaptureManifest,
      metadata: metadataResult.document as CaptureMetadata,
      sync: syncResult.document as CaptureSync,
    },
    warnings: [...manifestResult.warnings, ...metadataResult.warnings, ...syncResult.warnings],
  };
}

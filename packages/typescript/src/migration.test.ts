import { describe, expect, it } from "vitest";
import { migrateBundle, migrateSchema } from "./migration.js";
import { createBaseManifest, createBaseMetadata, createBaseSync } from "./testFixtures.js";

describe("schema migrations", () => {
  it("migrates metadata from v1.0.0 to v1.1.0", () => {
    const metadata = createBaseMetadata({ schema_version: "1.0.0" });
    const result = migrateSchema("metadata", metadata, { targetVersion: "1.1.0" });
    expect(result.from_version).toBe("1.0.0");
    expect(result.to_version).toBe("1.1.0");
    expect(result.document.schema_version).toBe("1.1.0");
  });

  it("keeps manifest and sync versions stable without explicit migration target", () => {
    const manifest = createBaseManifest();
    const sync = createBaseSync();
    const migratedManifest = migrateSchema("manifest", manifest);
    const migratedSync = migrateSchema("sync", sync);
    expect(migratedManifest.document.schema_version).toBe("1.0.0");
    expect(migratedSync.document.schema_version).toBe("1.0.0");
  });

  it("migrates bundle metadata and preserves other docs", () => {
    const bundle = {
      manifest: createBaseManifest(),
      metadata: createBaseMetadata({ schema_version: "1.0.0" }),
      sync: createBaseSync(),
    };
    const result = migrateBundle(bundle);
    expect(result.bundle.metadata.schema_version).toBe("1.1.0");
    expect(result.bundle.manifest.schema_version).toBe("1.0.0");
    expect(result.bundle.sync.schema_version).toBe("1.0.0");
  });
});

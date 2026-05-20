import { describe, expect, it } from "vitest";
import { createBaseMetadata } from "./testFixtures.js";
import { validateVersionedDocument } from "./validate.js";

describe("backward compatibility", () => {
  it("accepts v1.0.0 metadata without expanded fields", () => {
    const metadata = createBaseMetadata({
      schema_version: "1.0.0",
      timeline: {
        recording_start_utc: "2026-05-13T11:58:00.000Z",
        recording_end_utc: "2026-05-13T12:03:01.000Z",
      },
    });
    const result = validateVersionedDocument("metadata", metadata);
    expect(result.valid).toBe(true);
    expect(result.resolved_version).toBe("1.0.0");
  });

  it("parses future minor versions with nearest-version strategy", () => {
    const metadata = createBaseMetadata({
      schema_version: "1.2.0",
      reconstruction: { status: "in_progress" },
    });
    const result = validateVersionedDocument("metadata", metadata);
    expect(result.valid).toBe(true);
    expect(result.resolved_version).toBe("1.1.0");
  });

  it("reports malformed expanded metadata", () => {
    const metadata = createBaseMetadata({
      schema_version: "1.1.0",
      mesh: { scale: -1 },
    });
    const result = validateVersionedDocument("metadata", metadata);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("/mesh/scale");
  });
});

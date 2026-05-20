import { describe, expect, it } from "vitest";
import {
  generateBundleFingerprint,
  generateBundleStructureFingerprint,
  generatePayloadFingerprint,
  generateSchemaFingerprint,
} from "./fingerprint.js";
import { serializeCanonical, stableStringify } from "./serialization.js";

describe("canonical serialization", () => {
  it("serializes objects with stable key ordering", () => {
    const a = { z: 1, a: { d: 4, b: 2 }, q: ["b", "a"] };
    const b = { q: ["b", "a"], a: { b: 2, d: 4 }, z: 1 };
    expect(stableStringify(a)).toBe(stableStringify(b));
  });

  it("sorts applicable arrays deterministically", () => {
    const payload = {
      labeling: {
        semantic_labels: ["chair", "floor", "apple"],
      },
    };
    expect(serializeCanonical(payload)).toBe(
      JSON.stringify({
        labeling: {
          semantic_labels: ["apple", "chair", "floor"],
        },
      }),
    );
  });
});

describe("fingerprints", () => {
  it("produces stable payload and schema fingerprints", () => {
    const schemaA = { type: "object", properties: { b: { type: "number" }, a: { type: "string" } } };
    const schemaB = { properties: { a: { type: "string" }, b: { type: "number" } }, type: "object" };
    expect(generateSchemaFingerprint(schemaA)).toBe(generateSchemaFingerprint(schemaB));
  });

  it("fingerprints bundle structure independent of runtime values", () => {
    const bundleA = { metadata: { app: { name: "a", version: "1" } }, sync: { streams: [{ id: "x" }] } };
    const bundleB = { metadata: { app: { name: "b", version: "2" } }, sync: { streams: [{ id: "y" }] } };
    expect(generateBundleStructureFingerprint(bundleA)).toBe(generateBundleStructureFingerprint(bundleB));
  });

  it("produces deterministic full bundle fingerprints", () => {
    const a = { b: 2, a: [3, 2, 1] };
    const b = { a: [3, 2, 1], b: 2 };
    expect(generateBundleFingerprint(a)).toBe(generateBundleFingerprint(b));
    expect(generatePayloadFingerprint(stableStringify(a))).toMatch(/^[a-f0-9]{64}$/);
  });
});

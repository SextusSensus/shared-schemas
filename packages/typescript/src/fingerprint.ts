import { createHash } from "node:crypto";
import { serializeCanonical } from "./serialization.js";

export type FingerprintAlgorithm = "sha256";

function digestHex(input: string | Buffer, algorithm: FingerprintAlgorithm): string {
  return createHash(algorithm).update(input).digest("hex");
}

function extractStructure(value: unknown): unknown {
  if (Array.isArray(value)) {
    const childStructures = value.map(extractStructure);
    return childStructures.sort((a, b) => {
      const sa = JSON.stringify(a);
      const sb = JSON.stringify(b);
      if (sa < sb) return -1;
      if (sa > sb) return 1;
      return 0;
    });
  }
  if (typeof value === "object" && value !== null) {
    const out: Record<string, unknown> = {};
    const keys = Object.keys(value).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    for (const key of keys) {
      out[key] = extractStructure((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  if (value === null) return "null";
  return typeof value;
}

export function generateBundleFingerprint(
  bundle: unknown,
  algorithm: FingerprintAlgorithm = "sha256",
): string {
  return digestHex(serializeCanonical(bundle), algorithm);
}

export function generateSchemaFingerprint(
  schema: unknown,
  algorithm: FingerprintAlgorithm = "sha256",
): string {
  return digestHex(serializeCanonical(schema), algorithm);
}

export function generatePayloadFingerprint(
  serializedPayload: string | Buffer,
  algorithm: FingerprintAlgorithm = "sha256",
): string {
  return digestHex(serializedPayload, algorithm);
}

export function generateBundleStructureFingerprint(
  bundle: unknown,
  algorithm: FingerprintAlgorithm = "sha256",
): string {
  return digestHex(serializeCanonical(extractStructure(bundle)), algorithm);
}

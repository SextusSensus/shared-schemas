import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Absolute path to bundled `schemas/v1` (npm package layout) or the monorepo
 * `schemas/v1` at the repository root during development.
 */
export function schemaV1Dir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const packaged = path.resolve(here, "..", "schemas", "v1");
  if (fs.existsSync(packaged)) {
    return packaged;
  }
  return path.resolve(here, "..", "..", "..", "schemas", "v1");
}

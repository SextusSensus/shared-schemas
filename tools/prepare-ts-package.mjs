import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "schemas", "v1");
const destDir = path.join(root, "packages", "typescript", "schemas", "v1");

fs.rmSync(destDir, { recursive: true, force: true });
fs.mkdirSync(destDir, { recursive: true });

for (const f of fs.readdirSync(srcDir)) {
  if (!f.endsWith(".json")) continue;
  fs.copyFileSync(path.join(srcDir, f), path.join(destDir, f));
}

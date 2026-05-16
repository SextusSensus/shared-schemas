import Ajv2020 from "ajv/dist/2020.js";
import formatsPlugin from "ajv-formats";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const v1 = path.join(root, "schemas", "v1");

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  validateSchema: true,
  allowUnionTypes: true,
});
formatsPlugin(ajv);

const files = [
  "common.schema.json",
  "manifest.schema.json",
  "metadata.schema.json",
  "sync.schema.json",
  "pose-line.schema.json",
  "imu-line.schema.json",
];

for (const f of files) {
  const doc = JSON.parse(fs.readFileSync(path.join(v1, f), "utf8"));
  ajv.addSchema(doc);
}

console.log("All Capture Bundle v1 JSON Schemas compile and cross-reference successfully.");

/**
 * Example: validate a bundle directory from the CLI:
 *   node tools/validate-example-bundle.mjs path/to/bundle
 */
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import process from "node:process";

const bundleRoot = process.argv[2];
if (!bundleRoot) {
  console.error("Usage: node tools/validate-example-bundle.mjs <bundle-directory>");
  process.exit(2);
}

const mod = await import(
  pathToFileURL(
    path.join(
      path.dirname(fileURLToPath(new URL(import.meta.url))),
      "..",
      "packages",
      "typescript",
      "dist",
      "bundleDirectoryValidator.js",
    ),
  ).href,
);

const { validateCaptureBundleDirectory } = mod;
const issues = await validateCaptureBundleDirectory(path.resolve(bundleRoot));
if (issues.length) {
  console.error(JSON.stringify(issues, null, 2));
  process.exit(1);
}
console.log("Bundle directory is valid.");

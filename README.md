# shared-schemas

Canonical **Capture Bundle v1** contracts for the Global Refinement Layer: JSON Schemas, multi-language models, and validation helpers.

## Layout

| Path | Purpose |
|------|---------|
| `schemas/v1/` | JSON Schema 2020-12 definitions (`manifest`, `metadata`, `sync`, `pose.jsonl` line, `imu.jsonl` line) |
| `docs/` | Normative bundle directory spec, coordinates, UTC, Posemesh notes |
| `packages/typescript` | NPM workspace `@mentraos/capture-bundle-schemas` (Ajv validators + `validateCaptureBundleDirectory`) |
| `packages/python` | PyPI-ready package `mentraos-capture-bundle-schemas` (Pydantic models) |
| `swift/` | SwiftPM library `CaptureBundleSchemas` |
| `kotlin/` | JVM library with `kotlinx.serialization` models |
| `VERSION` | Repository semantic version for `bundle_spec_version` alignment |

## Requirements

- **Node.js** ≥ 18 for schema tooling and TypeScript tests
- Optional: Python ≥ 3.11, Swift 5.9+, JDK 17+ / Gradle for other targets

## Scripts (from repo root)

```bash
npm install
npm run validate:schemas   # Ajv compiles all v1 schemas
npm run ci                 # schemas + TS build + tests
```

Full directory validation (after `npm run build --workspace=@mentraos/capture-bundle-schemas`):

```bash
node tools/validate-example-bundle.mjs path/to/bundle-root
```

## Publishing

- **npm**: `cd packages/typescript && npm publish` (runs `prepublishOnly`: copies schemas, `tsc` build)
- **PyPI**: `cd packages/python && python -m build && twine upload dist/*`
- **SwiftPM**: tag the `swift/` folder as its own repo or depend on a subdirectory via your org’s convention

Coordinate semantics and hash rules are documented in `docs/BUNDLE_SPECIFICATION.md` and `docs/COORDINATE_SYSTEMS_AND_TIME.md`.

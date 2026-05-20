# Capture Bundle v1 — Directory Specification

This document defines the **canonical on-disk layout** for a Capture Bundle handled by the Global Refinement Layer. The machine-readable contract is expressed as JSON Schemas under `schemas/v1/`.

## Layout

```
<bundle_root>/
  manifest.json
  metadata.json
  sync.json
  pose.jsonl
  imu.jsonl
  assets/
    ... binary payloads referenced only via manifest.files (recommended prefix)
```

* `manifest.json` is authoritative for **which files exist**, their **byte length**, and their **SHA-256** digests over **raw file bytes** (no re-encoding, no transcoding).
* `manifest.json` **must not** contain an entry for itself. Distribution layers that need manifest integrity SHOULD use an external sidecar signature, a Merkle tree, or a wrapping manifest.
* Sidecar files (`metadata.json`, `sync.json`, stream traces) are ordinary files listed in `manifest.files` like any other asset.

## Bundle lifecycle

`manifest.lifecycle` is a coarse state machine:

1. **draft** — Directory reserved; schemas may be incomplete.
2. **recording** — Devices actively append samples / media; hashes may be absent until sealed.
3. **sealed** — All listed files are present, sizes and hashes match, JSONL streams finalized.
4. **uploaded** — Ingest acknowledged by backend (set by uploader or backend echo file).
5. **verified** — Backend completed schema, sync, and integrity checks.
6. **failed** — Terminal error (optional companion error artefact outside v1 spec).

> Implementations may keep additional proprietary markers; they **must not** replace these canonical states in `manifest.json`.

## Timestamp precision

* **`timestamp_ns` fields** (JSON strings) hold **unsigned integers** counting **nanoseconds** since the Unix epoch in **UTC**.
* String encoding is mandatory for interchange so uint64 values are not rounded by IEEE-754 `number` in JavaScript.
* Validation MUST reject **leading zeros** (except the single character `"0"`) to keep canonical string form unique.
* Human-readable `*_utc` fields use **RFC 3339** with a literal **`Z`** suffix (no numeric offsets) for wall-clock anchors.

## Hash serialization rules

* **Algorithm**: only `sha256` is defined for v1 (`manifest.hash_algorithm`).
* **Payload**: digest is computed on the **exact bytes** stored for the file. Text JSON sidecars must pick a single on-disk Unicode encoding (UTF-8 without BOM recommended) and hash those bytes.
* **Encoding**: digests are **lowercase hex** (64 nibbles), no `0x` prefix.
* **Normalization**: there is **no** canonical JSON transform for hashing payload content; if JSON documents must be content-addressed, implementations SHOULD hash the serialized bytes as written.

## Coordinate and sensor conventions

See [COORDINATE_SYSTEMS_AND_TIME.md](./COORDINATE_SYSTEMS_AND_TIME.md) for ARKit/ARCore frames, Posemesh domain space, handedness, and UTC discipline.

Sensor units and fields are summarized in `metadata.json` under `sensors` to disambiguate platform-specific defaults.

# Coordinate Systems, Posemesh Domain Space, and UTC Discipline

This document is **normative** for interpreting `pose.jsonl`, `imu.jsonl`, and `sync.json` together with mobile capture runtimes.

## UTC synchronization rules

* All `*_utc` RFC 3339 timestamps use the **`Z`** suffix and represent **UTC** instant time.
* Monotonic clocks (e.g. `CLOCK_MONOTONIC`) are used internally for frame alignment; `sync.json` documents how each `stream_id` maps to `utc_epoch_ns` via paired samples and optional `offset_to_utc_ns`.
* `sync.utc_epoch_anchor.valid` MUST be `true` only when the anchor wall clock was synchronized (typically NTP/PTP quality) at session start; otherwise downstream datasets MUST treat UTC mapping as **best-effort**.

## ARKit (iOS)

* ARKit world space is **right-handed**, **Y-up**, **meters**.
* World origin is established at session initialization; it is **session-relative**, not geodetic.
* Device pose conventions follow Apple's documentation: the camera or device frame moves in world space according to the returned 4×4 transform (translation in meters).
* When `manifest.root_pose_frame` is **`world_ar_session`**, `pose.jsonl` is expressed in the AR session world frame for the **phone** recording unless `metadata.coordinate_conventions.notes` say otherwise.

## ARCore (Android)

* ARCore world space is **right-handed**, **Y-up**, **meters**.
* Like ARKit, the world frame is **session-relative** and may drift when mapping quality changes; record tracking state in `pose.tracking_state` when sampled from ARCore APIs.

## Posemesh domain space

* Interoperable transforms published into Posemesh are treated as **right-handed**, **Y-up** domain space for robotic planning unless an integration note specifies a different convention.
* Use `manifest.root_pose_frame = world_posemesh_domain` when `pose.jsonl` has been **re-expressed** (already aligned) into that domain space on device or in preprocessing.
* Conversions between AR session frames and Posemesh domain space MUST be recorded in `metadata.coordinate_conventions.notes` with sufficient detail to reproduce the transform chain.

## Handedness conversions

* **No handedness flip** is implied between ARKit and ARCore for v1 bundles; both are right-handed Y-up.
* If external tooling consumes **left-handed** graphics frames (e.g. some engines), conversions are **out of band** and must not silently rewrite `pose.jsonl` without updating manifest hashes and documentation.
* Quaternion order in v1 is **`[x, y, z, w]`** (Hamilton convention). Conjugate/inverse conventions for passive vs active rotations must be respected when chaining transforms.

## IMU sensor frame

* Accelerometer and gyroscope vectors are recorded in the **sensor/mount frame** of the reporting device unless `metadata.sensors.imu` documents a remapped frame.
* Pair IMU samples to poses using `sync.json` stream entries for `imu` and `pose`.

## Practical guidance for cross-device bundles

When phones and glasses contribute to the same capture session, each device may have distinct intrinsics and mount transforms. `metadata.devices[]` identifies producers; session-wide alignment is established through `sync.json` and narrative notes, not implicit equality of world origins.

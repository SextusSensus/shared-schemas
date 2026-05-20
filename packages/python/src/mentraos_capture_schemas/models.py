"""Pydantic models mirroring Capture Bundle v1 JSON Schemas."""

from __future__ import annotations

import re
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

_SEMVER_RE = re.compile(
    r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)"
    r"(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?"
    r"(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$"
)


def _ts_ns_ok(value: str) -> str:
    if not re.fullmatch(r"[0-9]{1,19}", value):
        raise ValueError("timestamp_ns must be a decimal string of length 1..19")
    if len(value) > 1 and value.startswith("0"):
        raise ValueError("timestamp_ns must not have leading zeros")
    return value


class ManifestFileEntry(BaseModel):
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    size_bytes: int = Field(ge=0)
    media_type: Optional[str] = Field(default=None, max_length=256)


class CaptureManifest(BaseModel):
    schema_version: str
    bundle_spec_version: str
    bundle_id: str
    capture_session_id: Optional[str] = None
    created_at_utc: str = Field(
        pattern=r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$"
    )
    lifecycle: Literal[
        "draft", "recording", "sealed", "uploaded", "verified", "failed"
    ]
    hash_algorithm: Literal["sha256"]
    root_pose_frame: Optional[
        Literal["world_ar_session", "world_posemesh_domain", "device_imu", "custom"]
    ] = None
    root_pose_frame_note: Optional[str] = Field(default=None, max_length=4096)
    files: dict[str, ManifestFileEntry]

    @field_validator("schema_version", "bundle_spec_version")
    @classmethod
    def semver_ok(cls, v: str) -> str:
        if not _SEMVER_RE.fullmatch(v):
            raise ValueError("must be semver")
        return v


class MetadataApp(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    version: str
    build: Optional[str] = Field(default=None, max_length=128)

    @field_validator("version")
    @classmethod
    def semver_ok(cls, v: str) -> str:
        if not _SEMVER_RE.fullmatch(v):
            raise ValueError("must be semver")
        return v


class CaptureMetadata(BaseModel):
    schema_version: str
    bundle_id: str
    recorded_platform: Literal["ios", "android", "glasses", "mixed"]
    app: MetadataApp
    devices: Optional[list[dict[str, object]]] = None
    coordinate_conventions: Optional[dict[str, object]] = None
    sensors: dict[str, object]
    timeline: Optional[dict[str, str]] = None

    @field_validator("schema_version")
    @classmethod
    def semver_ok(cls, v: str) -> str:
        if not _SEMVER_RE.fullmatch(v):
            raise ValueError("must be semver")
        return v


class SyncSample(BaseModel):
    t_stream_ns: str
    t_utc_ns: Optional[str] = None
    frame_index: Optional[int] = Field(default=None, ge=0)


class SyncStream(BaseModel):
    stream_id: str = Field(pattern=r"^[a-z0-9_\-\.]+$", max_length=64)
    clock: Literal[
        "utc_epoch_ns",
        "host_monotonic_ns",
        "ar_frame_timestamp_ns",
        "sensor_batch_ns",
        "unknown",
    ]
    offset_to_utc_ns: Optional[str] = None
    samples: list[SyncSample]


class UtcEpochAnchor(BaseModel):
    valid: bool
    anchor_utc: str = Field(
        pattern=r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$"
    )
    anchor_monotonic_ns: Optional[str] = None


class CaptureSync(BaseModel):
    schema_version: str
    bundle_id: str
    utc_epoch_anchor: UtcEpochAnchor
    streams: Optional[list[SyncStream]] = None

    @field_validator("schema_version")
    @classmethod
    def semver_ok(cls, v: str) -> str:
        if not _SEMVER_RE.fullmatch(v):
            raise ValueError("must be semver")
        return v


class PoseSample(BaseModel):
    timestamp_ns: str
    frame_id: int = Field(ge=0)
    tracking_state: Optional[
        Literal["not_available", "limited", "normal", "unknown"]
    ] = None
    position_m: tuple[float, float, float]
    orientation_xyzw: tuple[float, float, float, float]
    linear_velocity_m_s: Optional[tuple[float, float, float]] = None
    angular_velocity_rad_s: Optional[tuple[float, float, float]] = None

    @field_validator("timestamp_ns")
    @classmethod
    def v_ts(cls, v: str) -> str:
        return _ts_ns_ok(v)


class ImuSample(BaseModel):
    timestamp_ns: str
    sequence: Optional[int] = Field(default=None, ge=0)
    gyro_rad_s: tuple[float, float, float]
    accel_m_s2: tuple[float, float, float]
    mag_uT: Optional[tuple[float, float, float]] = None

    @field_validator("timestamp_ns")
    @classmethod
    def v_ts(cls, v: str) -> str:
        return _ts_ns_ok(v)

from mentraos_capture_schemas import PoseSample
import pytest


def test_pose_timestamp_leading_zeros_rejected():
    with pytest.raises(Exception):  # pydantic ValidationError
        PoseSample.model_validate(
            {
                "timestamp_ns": "010",
                "frame_id": 0,
                "position_m": (0, 0, 0),
                "orientation_xyzw": (0, 0, 0, 1),
            }
        )

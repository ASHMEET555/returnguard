"""Hash-lock verification test for frozen ML artifacts."""

import hashlib
import json
import os
import pytest

MANIFEST_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "reports",
    "artifact_manifest.json",
)


def test_frozen_artifacts_match_manifest():
    """Verify that every frozen artifact has not been modified or corrupted."""
    assert os.path.exists(MANIFEST_PATH), f"Manifest missing at {MANIFEST_PATH}"

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    artifacts = manifest.get("artifacts", {})
    assert len(artifacts) > 0, "No artifacts listed in manifest"

    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    for path, meta in artifacts.items():
        if not meta.get("frozen", False):
            continue
        full_path = os.path.join(project_root, path.replace("/", os.sep))
        assert os.path.exists(full_path), f"Artifact missing on disk: {full_path}"

        with open(full_path, "rb") as f:
            data = f.read()

        actual_sha256 = hashlib.sha256(data).hexdigest()
        assert actual_sha256 == meta["sha256"], (
            f"Hash mismatch for {path}: expected {meta['sha256']}, got {actual_sha256}"
        )
        assert len(data) == meta["size_bytes"], (
            f"Size mismatch for {path}: expected {meta['size_bytes']}, got {len(data)}"
        )

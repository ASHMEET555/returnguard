"""Seeded random number generator for ReturnGuard synthetic data generation."""

import hashlib

import numpy as np

DEFAULT_SEED = 42


def get_rng(seed: int = DEFAULT_SEED) -> np.random.Generator:
    """Return a single seeded numpy.random.Generator.

    Guarantees reproducible streams across all entity and event generation.
    """
    return np.random.default_rng(seed)


def deterministic_hash(value: str) -> str:
    """Generate deterministic SHA-256 hex digest for synthetic hashes.

    Avoids Python's built-in non-deterministic hash().
    """
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]

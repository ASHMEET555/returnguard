"""
Fixture tests for deterministic Union-Find ring builder.

Verifies:
1. Size-3 shared-address ring is discovered and assigned a ring_id (e.g. R01).
2. Size-2 pair is not discovered (remains below min_ring_size threshold).
3. Ring discovery and ring_id assignment are 100% deterministic across random input orderings.
"""

import random
import pytest
from rings.builder import RingBuilder, UnionFind


def test_size_3_shared_address_ring_discovered():
    """A cluster of 3 customers sharing an address forms a valid ring (size >= 3)."""
    entity_links = [
        {"customer_id": "cust_A", "address_hash": "ADDR_FARM_99"},
        {"customer_id": "cust_B", "address_hash": "ADDR_FARM_99"},
        {"customer_id": "cust_C", "address_hash": "ADDR_FARM_99"},
    ]
    builder = RingBuilder(min_ring_size=3)
    result = builder.build(entity_links)

    assert len(result.rings) == 1
    ring_id = list(result.rings.keys())[0]
    assert ring_id == "R01"

    ring_info = result.rings["R01"]
    assert ring_info.ring_size == 3
    assert set(ring_info.member_customer_ids) == {"cust_A", "cust_B", "cust_C"}

    for cid in ["cust_A", "cust_B", "cust_C"]:
        assert result.customer_to_ring[cid] == "R01"


def test_size_2_pair_not_discovered():
    """A pair of 2 customers sharing an identifier must not be assigned a ring_id."""
    entity_links = [
        {"customer_id": "cust_X", "phone": "9998887770"},
        {"customer_id": "cust_Y", "phone": "9998887770"},
    ]
    builder = RingBuilder(min_ring_size=3)
    result = builder.build(entity_links)

    assert len(result.rings) == 0
    assert result.customer_to_ring.get("cust_X") is None
    assert result.customer_to_ring.get("cust_Y") is None


def test_determinism_across_shuffled_runs():
    """Shuffling the input entity links produces identical ring_ids and memberships."""
    base_links = [
        # Ring 1 (size 3)
        {"customer_id": "c1", "phone": "1111111111"},
        {"customer_id": "c2", "phone": "1111111111"},
        {"customer_id": "c3", "phone": "1111111111"},
        # Pair (size 2 - ignored)
        {"customer_id": "p1", "device_hash": "DEV_SHARED"},
        {"customer_id": "p2", "device_hash": "DEV_SHARED"},
        # Ring 2 (size 4)
        {"customer_id": "d1", "address_hash": "ADDR_BIG"},
        {"customer_id": "d2", "address_hash": "ADDR_BIG"},
        {"customer_id": "d3", "address_hash": "ADDR_BIG"},
        {"customer_id": "d4", "address_hash": "ADDR_BIG"},
    ]

    builder = RingBuilder(min_ring_size=3)
    canonical_result = builder.build(base_links)

    # Run 10 trials with random orderings
    rng = random.Random(42)
    for trial in range(10):
        shuffled = list(base_links)
        rng.shuffle(shuffled)
        trial_result = builder.build(shuffled)

        assert trial_result.customer_to_ring == canonical_result.customer_to_ring
        assert set(trial_result.rings.keys()) == set(canonical_result.rings.keys())
        for rid, info in canonical_result.rings.items():
            trial_info = trial_result.rings[rid]
            assert trial_info.member_customer_ids == info.member_customer_ids
            assert trial_info.ring_size == info.ring_size


def test_canonical_edge_ordering():
    """Verify that extracted edges follow canonical (u < v) ordering and are deduplicated."""
    links = [
        {"customer_id": "zeta", "phone": "common_phone"},
        {"customer_id": "alpha", "phone": "common_phone"},
        {"customer_id": "beta", "phone": "common_phone"},
    ]
    builder = RingBuilder()
    _, sorted_edges, _ = builder.extract_edges(links)

    for u, v in sorted_edges:
        assert u < v, f"Edge ({u}, {v}) violates canonical ordering u < v"

    assert len(sorted_edges) == len(set(sorted_edges)), "Edges must be deduplicated"

"""Unit tests for rings builder."""

import random

from rings.builder import RingBuilder, RingMembershipStore, UnionFind


def test_shared_address_ring_size_3_discovered():
    """Verify shared-address ring of size >= 3 is discovered."""
    links = [
        {"customer_id": "cust_1", "address_hash": "addr_shared_alpha"},
        {"customer_id": "cust_2", "address_hash": "addr_shared_alpha"},
        {"customer_id": "cust_3", "address_hash": "addr_shared_alpha"},
    ]
    builder = RingBuilder(min_ring_size=3)
    result = builder.build(links)

    assert len(result.rings) == 1
    ring = next(iter(result.rings.values()))
    assert ring.ring_id == "R01"
    assert ring.ring_size == 3
    assert ring.member_customer_ids == ["cust_1", "cust_2", "cust_3"]
    assert result.customer_to_ring["cust_1"] == "R01"
    assert result.customer_to_ring["cust_2"] == "R01"
    assert result.customer_to_ring["cust_3"] == "R01"


def test_size_2_pairs_are_filtered_out():
    """Verify shared-identity pairs of size 2 are not treated as abuse rings."""
    links = [
        # Size 2 pair sharing a device
        {"customer_id": "cust_pair_a", "device_hash": "dev_pair_shared"},
        {"customer_id": "cust_pair_b", "device_hash": "dev_pair_shared"},
        # Isolated singleton
        {"customer_id": "cust_solo", "device_hash": "dev_solo_unique"},
    ]
    builder = RingBuilder(min_ring_size=3)
    result = builder.build(links)

    assert len(result.rings) == 0
    assert "cust_pair_a" not in result.customer_to_ring
    assert "cust_pair_b" not in result.customer_to_ring
    assert "cust_solo" not in result.customer_to_ring


def test_transitive_multi_attribute_ring():
    """Verify transitive edges across phone, address, and device merge into one ring."""
    links = [
        # cust_1 and cust_2 share phone
        {"customer_id": "cust_1", "phone": "9876543210"},
        {"customer_id": "cust_2", "phone": "9876543210"},
        # cust_2 and cust_3 share device
        {"customer_id": "cust_2", "device_hash": "device_shared_beta"},
        {"customer_id": "cust_3", "device_hash": "device_shared_beta"},
        # cust_3 and cust_4 share address
        {"customer_id": "cust_3", "address_hash": "address_shared_gamma"},
        {"customer_id": "cust_4", "address_hash": "address_shared_gamma"},
    ]
    builder = RingBuilder(min_ring_size=3)
    result = builder.build(links)

    assert len(result.rings) == 1
    ring = next(iter(result.rings.values()))
    assert ring.ring_size == 4
    assert ring.member_customer_ids == ["cust_1", "cust_2", "cust_3", "cust_4"]


def test_ring_builder_determinism_under_permutation():
    """Verify input ordering permutations do not change ring IDs or member ordering."""
    base_links = [
        {"customer_id": "cust_a", "address_hash": "shared_addr_1"},
        {"customer_id": "cust_b", "address_hash": "shared_addr_1"},
        {"customer_id": "cust_c", "address_hash": "shared_addr_1"},
        {"customer_id": "cust_d", "device_hash": "shared_dev_2"},
        {"customer_id": "cust_e", "device_hash": "shared_dev_2"},
        {"customer_id": "cust_f", "device_hash": "shared_dev_2"},
    ]

    builder = RingBuilder(min_ring_size=3)
    res1 = builder.build(base_links)

    # Permute links
    permuted_links = list(base_links)
    rng = random.Random(42)
    rng.shuffle(permuted_links)

    res2 = builder.build(permuted_links)

    assert set(res1.rings.keys()) == set(res2.rings.keys())
    for rid in res1.rings:
        assert (
            res1.rings[rid].member_customer_ids == res2.rings[rid].member_customer_ids
        )
        assert res1.rings[rid].ring_size == res2.rings[rid].ring_size
    assert res1.customer_to_ring == res2.customer_to_ring


def test_union_find_primitive_operations():
    """Verify UnionFind primitive operations."""
    uf = UnionFind(["a", "b", "c", "d"])
    assert uf.find("a") == "a"
    assert uf.union("a", "b") is True
    assert uf.find("a") == uf.find("b")
    assert uf.union("a", "b") is False  # already united
    assert uf.union("c", "d") is True
    assert uf.union("b", "c") is True
    assert uf.find("d") == uf.find("a")
    components = uf.get_components()
    assert len(components) == 1
    assert next(iter(components.values())) == ["a", "b", "c", "d"]


def test_ring_aggregates_and_membership_store(tmp_path):
    """Verify per-ring aggregates (ring_size, ring_return_rate) and O(1) store lookup."""
    links = [
        {"customer_id": "cust_m1", "address_hash": "cluster_address_1"},
        {"customer_id": "cust_m2", "address_hash": "cluster_address_1"},
        {"customer_id": "cust_m3", "address_hash": "cluster_address_1"},
    ]
    historical_orders = [
        {"customer_id": "cust_m1", "y": 1, "outcome_time": "2026-02-01T10:00:00Z"},
        {"customer_id": "cust_m1", "y": 0, "outcome_time": "2026-02-02T10:00:00Z"},
        {"customer_id": "cust_m2", "y": 1, "outcome_time": "2026-02-03T10:00:00Z"},
        {"customer_id": "cust_m3", "y": 1, "outcome_time": "2026-02-04T10:00:00Z"},
    ]
    builder = RingBuilder(min_ring_size=3)
    store = builder.create_membership_store(links, historical_orders=historical_orders)

    # 3 out of 4 orders are returns (y=1) -> 0.75
    res_m1 = store.lookup("cust_m1")
    assert res_m1["in_ring"] is True
    assert res_m1["ring_id"] == "R01"
    assert res_m1["ring_size"] == 3
    assert res_m1["ring_return_rate"] == 0.75

    # Non-ring customer lookup returns defaults
    res_outside = store.lookup("cust_outside", default_return_rate=0.12)
    assert res_outside["in_ring"] is False
    assert res_outside["ring_id"] is None
    assert res_outside["ring_size"] == 1
    assert res_outside["ring_return_rate"] == 0.12

    # Test file persistence
    save_path = tmp_path / "rings.json"
    store.save(save_path)
    loaded_store = RingMembershipStore.load(save_path)
    assert loaded_store.lookup("cust_m2") == res_m1

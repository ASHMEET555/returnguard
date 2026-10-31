"""Ring builder using graph connected components.

Builds deterministic graph edges across shared phone, address, and device
attributes and computes connected components using Union-Find.
Filters components to size >= 3.
"""

from collections.abc import Iterable
from dataclasses import dataclass, field
from typing import Any


class UnionFind:
    """Deterministic Union-Find (Disjoint-Set Union) data structure."""

    def __init__(self, elements: Iterable[str] | None = None):
        self.parent: dict[str, str] = {}
        self.rank: dict[str, int] = {}
        if elements:
            for el in sorted(set(elements)):
                self.parent[el] = el
                self.rank[el] = 0

    def add(self, x: str) -> None:
        if x not in self.parent:
            self.parent[x] = x
            self.rank[x] = 0

    def find(self, x: str) -> str:
        self.add(x)
        path = []
        curr = x
        while self.parent[curr] != curr:
            path.append(curr)
            curr = self.parent[curr]
        # Path compression
        for node in path:
            self.parent[node] = curr
        return curr

    def union(self, x: str, y: str) -> bool:
        root_x = self.find(x)
        root_y = self.find(y)
        if root_x == root_y:
            return False

        # Union by rank with deterministic tie-breaking (lexicographical)
        if self.rank[root_x] < self.rank[root_y]:
            self.parent[root_x] = root_y
        elif self.rank[root_x] > self.rank[root_y]:
            self.parent[root_y] = root_x
        else:
            # Equal rank: break tie by smaller string name for determinism
            if root_x < root_y:
                self.parent[root_y] = root_x
                self.rank[root_x] += 1
            else:
                self.parent[root_x] = root_y
                self.rank[root_y] += 1
        return True

    def get_components(self) -> dict[str, list[str]]:
        """Return root -> sorted list of member customer IDs."""
        components: dict[str, list[str]] = {}
        for x in sorted(self.parent.keys()):
            root = self.find(x)
            components.setdefault(root, []).append(x)
        for members in components.values():
            members.sort()
        return components


@dataclass
class RingInfo:
    """Discovered abuse ring summary."""

    ring_id: str
    member_customer_ids: list[str]
    ring_size: int
    shared_identifiers: dict[str, list[str]] = field(default_factory=dict)
    ring_return_rate: float = 0.0


@dataclass
class RingResult:
    """Container for ring discovery results."""

    rings: dict[str, RingInfo] = field(default_factory=dict)
    customer_to_ring: dict[str, str] = field(default_factory=dict)


class RingBuilder:
    """Discovers abuse rings across shared customer identifiers."""

    def __init__(self, min_ring_size: int = 3):
        self.min_ring_size = min_ring_size

    def extract_edges(
        self,
        entity_links: list[dict[str, Any]],
    ) -> tuple[set[str], list[tuple[str, str]], dict[str, dict[str, set[str]]]]:
        """Extract nodes, deterministic edges, and index shared identifiers.

        Each entity_link dict is expected to have:
            - customer_id: str
            - phone: optional str
            - address_hash: optional str
            - device_hash: optional str
        """
        all_customers: set[str] = set()
        phone_map: dict[str, set[str]] = {}
        address_map: dict[str, set[str]] = {}
        device_map: dict[str, set[str]] = {}

        for item in entity_links:
            cid = item.get("customer_id")
            if not cid:
                continue
            all_customers.add(cid)

            phone = item.get("phone")
            if phone:
                phone_map.setdefault(str(phone).strip(), set()).add(cid)

            addr = item.get("address_hash")
            if addr:
                address_map.setdefault(str(addr).strip(), set()).add(cid)

            dev = item.get("device_hash")
            if dev:
                device_map.setdefault(str(dev).strip(), set()).add(cid)

        # Build pairwise edges deterministically
        edge_set: set[tuple[str, str]] = set()

        def add_star_edges(cust_set: set[str]) -> None:
            if len(cust_set) < 2:
                return
            sorted_custs = sorted(cust_set)
            canonical = sorted_custs[0]
            for other in sorted_custs[1:]:
                edge = (min(canonical, other), max(canonical, other))
                edge_set.add(edge)

        for c_set in phone_map.values():
            add_star_edges(c_set)
        for c_set in address_map.values():
            add_star_edges(c_set)
        for c_set in device_map.values():
            add_star_edges(c_set)

        sorted_edges = sorted(edge_set)
        shared_maps = {
            "phone": phone_map,
            "address": address_map,
            "device": device_map,
        }
        return all_customers, sorted_edges, shared_maps

    def build(
        self,
        entity_links: list[dict[str, Any]],
    ) -> RingResult:
        """Execute connected components on entity links and filter size >= min_ring_size."""
        all_customers, sorted_edges, _shared_maps = self.extract_edges(entity_links)

        uf = UnionFind(all_customers)
        for u, v in sorted_edges:
            uf.union(u, v)

        raw_components = uf.get_components()

        # Filter components with size >= min_ring_size
        qualifying_components = [
            members
            for members in raw_components.values()
            if len(members) >= self.min_ring_size
        ]

        # Sort qualifying components deterministically by their minimum member ID
        qualifying_components.sort(key=lambda m: (m[0], len(m)))

        rings: dict[str, RingInfo] = {}
        customer_to_ring: dict[str, str] = {}

        for idx, members in enumerate(qualifying_components, start=1):
            ring_id = f"R{idx:02d}"
            info = RingInfo(
                ring_id=ring_id,
                member_customer_ids=members,
                ring_size=len(members),
                ring_return_rate=0.0,
            )
            rings[ring_id] = info
            for cid in members:
                customer_to_ring[cid] = ring_id

        return RingResult(rings=rings, customer_to_ring=customer_to_ring)

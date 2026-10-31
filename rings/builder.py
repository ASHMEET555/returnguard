"""Ring builder using graph connected components.

Builds deterministic graph edges across shared phone, address, and device
attributes, computes connected components using Union-Find,
filters components to size >= 3, and computes per-ring aggregates
(ring_size, ring_return_rate).
Provides an O(1) online lookup store without graph walks.
"""

import datetime
import json
from collections.abc import Iterable
from dataclasses import asdict, dataclass, field
from pathlib import Path
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
    """Discovered abuse ring summary and aggregates."""

    ring_id: str
    member_customer_ids: list[str]
    ring_size: int
    ring_return_rate: float = 0.0
    shared_identifiers: dict[str, list[str]] = field(default_factory=dict)


@dataclass
class RingResult:
    """Container for ring discovery results."""

    rings: dict[str, RingInfo] = field(default_factory=dict)
    customer_to_ring: dict[str, str] = field(default_factory=dict)


class RingMembershipStore:
    """Lookup store for precomputed batch ring membership and aggregates.

    Ensures the online scoring path requires only O(1) lookups and never traverses
    the entity graph dynamically on request paths.
    """

    def __init__(
        self,
        customer_to_ring: dict[str, str] | None = None,
        rings: dict[str, RingInfo] | None = None,
    ):
        self.customer_to_ring: dict[str, str] = customer_to_ring or {}
        self.rings: dict[str, RingInfo] = rings or {}

    def lookup(
        self, customer_id: str, default_return_rate: float = 0.0
    ) -> dict[str, Any]:
        """Look up ring membership and aggregates for customer_id."""
        ring_id = self.customer_to_ring.get(customer_id)
        if ring_id and ring_id in self.rings:
            ring = self.rings[ring_id]
            return {
                "ring_id": ring.ring_id,
                "ring_size": ring.ring_size,
                "ring_return_rate": ring.ring_return_rate,
                "in_ring": True,
            }
        return {
            "ring_id": None,
            "ring_size": 1,
            "ring_return_rate": default_return_rate,
            "in_ring": False,
        }

    def save(self, file_path: str | Path) -> None:
        """Persist ring membership and aggregates to JSON file."""
        data = {
            "customer_to_ring": self.customer_to_ring,
            "rings": {rid: asdict(rinfo) for rid, rinfo in self.rings.items()},
        }
        path = Path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    @classmethod
    def load(cls, file_path: str | Path) -> "RingMembershipStore":
        """Load ring membership and aggregates from JSON file."""
        path = Path(file_path)
        if not path.exists():
            return cls()
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        rings = {rid: RingInfo(**rdata) for rid, rdata in data.get("rings", {}).items()}
        return cls(
            customer_to_ring=data.get("customer_to_ring", {}),
            rings=rings,
        )


class RingBuilder:
    """Discovers abuse rings across shared customer identifiers."""

    def __init__(self, min_ring_size: int = 3):
        self.min_ring_size = min_ring_size

    def extract_edges(
        self,
        entity_links: list[dict[str, Any]],
    ) -> tuple[set[str], list[tuple[str, str]], dict[str, dict[str, set[str]]]]:
        """Extract nodes, deterministic edges, and index shared identifiers."""
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
        historical_orders: list[dict[str, Any]] | None = None,
        as_of: datetime.datetime | None = None,
    ) -> RingResult:
        """Execute connected components on entity links, filter size >= min_ring_size,

        and calculate historical per-ring aggregates strictly as-of.
        """
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

        # Pre-index historical completed orders by customer if provided
        cust_orders_map: dict[str, list[dict[str, Any]]] = {}
        if historical_orders:
            for o in historical_orders:
                c_id = o.get("customer_id")
                if not c_id:
                    continue
                # As-of filtering on outcome:
                # only count outcomes that occurred on or before as_of
                ot = o.get("outcome_time")
                if as_of and ot:
                    if isinstance(ot, str):
                        ot_dt = datetime.datetime.fromisoformat(ot)
                    else:
                        ot_dt = ot
                    if ot_dt > as_of:
                        continue
                cust_orders_map.setdefault(c_id, []).append(o)

        for idx, members in enumerate(qualifying_components, start=1):
            ring_id = f"R{idx:02d}"

            # Calculate ring_return_rate across all members
            ring_orders = []
            for m in members:
                ring_orders.extend(cust_orders_map.get(m, []))

            if ring_orders:
                returns_count = sum(1 for o in ring_orders if o.get("y", 0) == 1)
                ring_return_rate = round(returns_count / len(ring_orders), 4)
            else:
                ring_return_rate = 0.0

            info = RingInfo(
                ring_id=ring_id,
                member_customer_ids=members,
                ring_size=len(members),
                ring_return_rate=ring_return_rate,
            )
            rings[ring_id] = info
            for cid in members:
                customer_to_ring[cid] = ring_id

        return RingResult(rings=rings, customer_to_ring=customer_to_ring)

    def create_membership_store(
        self,
        entity_links: list[dict[str, Any]],
        historical_orders: list[dict[str, Any]] | None = None,
        as_of: datetime.datetime | None = None,
    ) -> RingMembershipStore:
        """Build rings and wrap results in RingMembershipStore for fast lookups."""
        result = self.build(
            entity_links, historical_orders=historical_orders, as_of=as_of
        )
        return RingMembershipStore(
            customer_to_ring=result.customer_to_ring,
            rings=result.rings,
        )

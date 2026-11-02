"""
Deterministic Ring Builder using Union-Find (Display-Only).

Constructs deterministic graph edges across shared phone, address, and device attributes,
computes connected components using Union-Find with canonical edge ordering (u < v, sorted,
deduplicated), and assigns ring_ids (R01, R02, ...) sorted by the lexicographically
smallest member. Components of size >= 3 receive a ring_id; smaller components do not.

CRITICAL INVARIANT:
Rings and entity graph relationships are DISPLAY-ONLY.
They never enter the ML model input vector, probability calculation, or policy action.
"""

from collections.abc import Iterable
from dataclasses import asdict, dataclass, field
import datetime
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple


class UnionFind:
    """Deterministic Union-Find (Disjoint-Set Union) with path compression and union-by-rank."""

    def __init__(self, elements: Optional[Iterable[str]] = None):
        self.parent: Dict[str, str] = {}
        self.rank: Dict[str, int] = {}
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

    def get_components(self) -> Dict[str, List[str]]:
        """Return root -> sorted list of member customer IDs."""
        components: Dict[str, List[str]] = {}
        for x in sorted(self.parent.keys()):
            root = self.find(x)
            components.setdefault(root, []).append(x)
        for members in components.values():
            members.sort()
        return components


@dataclass
class RingInfo:
    """Discovered abuse ring summary and display aggregates."""
    ring_id: str
    member_customer_ids: List[str]
    ring_size: int
    ring_return_rate: float = 0.0
    shared_identifiers: Dict[str, List[str]] = field(default_factory=dict)


@dataclass
class RingResult:
    """Container for ring discovery outputs."""
    rings: Dict[str, RingInfo] = field(default_factory=dict)
    customer_to_ring: Dict[str, str] = field(default_factory=dict)


class RingMembershipStore:
    """
    O(1) in-memory lookup store for precomputed batch ring membership.
    Ensures online scoring never executes dynamic graph walks on the request path.
    """

    def __init__(
        self,
        customer_to_ring: Optional[Dict[str, str]] = None,
        rings: Optional[Dict[str, RingInfo]] = None,
    ):
        self.customer_to_ring: Dict[str, str] = customer_to_ring or {}
        self.rings: Dict[str, RingInfo] = rings or {}

    def lookup(self, customer_id: str, default_return_rate: float = 0.0) -> Dict[str, Any]:
        """O(1) key lookup for customer's ring membership."""
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

    def save(self, file_path: Union[str, Path]) -> None:
        """Persist ring membership to JSON."""
        data = {
            "customer_to_ring": self.customer_to_ring,
            "rings": {rid: asdict(rinfo) for rid, rinfo in self.rings.items()},
        }
        path = Path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    @classmethod
    def load(cls, file_path: Union[str, Path]) -> "RingMembershipStore":
        """Load ring membership from JSON file."""
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
    """Discovers abuse rings across shared phone, address, and device links."""

    def __init__(self, min_ring_size: int = 3):
        self.min_ring_size = min_ring_size

    def extract_edges(
        self,
        entity_links: List[Dict[str, Any]],
    ) -> Tuple[Set[str], List[Tuple[str, str]], Dict[str, Dict[str, Set[str]]]]:
        """Extract nodes, canonical pairwise edges (u < v, sorted), and shared maps."""
        all_customers: Set[str] = set()
        phone_map: Dict[str, Set[str]] = {}
        address_map: Dict[str, Set[str]] = {}
        device_map: Dict[str, Set[str]] = {}

        for item in entity_links:
            cid = item.get("customer_id")
            if not cid:
                continue
            all_customers.add(cid)

            phone = item.get("phone") or item.get("phone_number")
            if phone and str(phone).strip():
                phone_map.setdefault(str(phone).strip(), set()).add(cid)

            addr = item.get("address_hash") or item.get("address")
            if addr and str(addr).strip():
                address_map.setdefault(str(addr).strip(), set()).add(cid)

            dev = item.get("device_hash") or item.get("device_id")
            if dev and str(dev).strip():
                device_map.setdefault(str(dev).strip(), set()).add(cid)

        # Build pairwise edges with canonical ordering (u < v)
        edge_set: Set[Tuple[str, str]] = set()

        def add_canonical_edges(cust_set: Set[str]) -> None:
            if len(cust_set) < 2:
                return
            sorted_custs = sorted(cust_set)
            for i in range(len(sorted_custs)):
                for j in range(i + 1, len(sorted_custs)):
                    u = min(sorted_custs[i], sorted_custs[j])
                    v = max(sorted_custs[i], sorted_custs[j])
                    edge_set.add((u, v))

        for c_set in phone_map.values():
            add_canonical_edges(c_set)
        for c_set in address_map.values():
            add_canonical_edges(c_set)
        for c_set in device_map.values():
            add_canonical_edges(c_set)

        sorted_edges = sorted(edge_set)
        shared_maps = {
            "phone": phone_map,
            "address": address_map,
            "device": device_map,
        }
        return all_customers, sorted_edges, shared_maps

    def build(
        self,
        entity_links: List[Dict[str, Any]],
        historical_orders: Optional[List[Dict[str, Any]]] = None,
        as_of: Optional[datetime.datetime] = None,
    ) -> RingResult:
        """
        Execute deterministic connected components, filter size >= min_ring_size,
        and assign ring_ids R01, R02, ... sorted by lexicographically smallest member.
        """
        all_customers, sorted_edges, _shared_maps = self.extract_edges(entity_links)

        # Nodes inserted in sorted order
        uf = UnionFind(sorted(all_customers))
        for u, v in sorted_edges:
            uf.union(u, v)

        raw_components = uf.get_components()

        # Filter components with size >= min_ring_size
        qualifying = [
            members
            for members in raw_components.values()
            if len(members) >= self.min_ring_size
        ]

        # Sort qualifying components deterministically by their smallest member ID
        qualifying.sort(key=lambda m: (m[0], len(m)))

        rings: Dict[str, RingInfo] = {}
        customer_to_ring: Dict[str, str] = {}

        for idx, members in enumerate(qualifying, start=1):
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

    def create_membership_store(
        self,
        entity_links: List[Dict[str, Any]],
        historical_orders: Optional[List[Dict[str, Any]]] = None,
        as_of: Optional[datetime.datetime] = None,
    ) -> RingMembershipStore:
        """Convenience method returning an O(1) lookup store."""
        result = self.build(entity_links, historical_orders=historical_orders, as_of=as_of)
        return RingMembershipStore(
            customer_to_ring=result.customer_to_ring,
            rings=result.rings,
        )

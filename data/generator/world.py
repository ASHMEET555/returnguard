"""Synthetic COD + PayPal world generation.

Generates base population of merchants, customers, addresses, devices,
orders, payments, delivery events, and refund/dispute lifecycles.
"""

import datetime
from dataclasses import dataclass

import numpy as np

from data.generator.seed import deterministic_hash

# Indian cities and pincodes with tier-based baseline RTO rates
PINCODE_CATALOG = [
    # Tier 1 (Low RTO risk: ~10-15%)
    {"city": "Mumbai", "state": "Maharashtra", "pincode": "400001", "base_rto": 0.12},
    {"city": "Bengaluru", "state": "Karnataka", "pincode": "560001", "base_rto": 0.10},
    {"city": "Delhi", "state": "Delhi", "pincode": "110001", "base_rto": 0.14},
    {"city": "Hyderabad", "state": "Telangana", "pincode": "500001", "base_rto": 0.11},
    {"city": "Pune", "state": "Maharashtra", "pincode": "411001", "base_rto": 0.13},
    {"city": "Chennai", "state": "Tamil Nadu", "pincode": "600001", "base_rto": 0.10},
    # Tier 2 (Medium RTO risk: ~20-25%)
    {"city": "Jaipur", "state": "Rajasthan", "pincode": "302001", "base_rto": 0.22},
    {
        "city": "Lucknow",
        "state": "Uttar Pradesh",
        "pincode": "226001",
        "base_rto": 0.24,
    },
    {
        "city": "Indore",
        "state": "Madhya Pradesh",
        "pincode": "452001",
        "base_rto": 0.21,
    },
    {"city": "Surat", "state": "Gujarat", "pincode": "395001", "base_rto": 0.19},
    # Tier 3 (High RTO risk: ~30-40%)
    {"city": "Patna", "state": "Bihar", "pincode": "800001", "base_rto": 0.35},
    {"city": "Ranchi", "state": "Jharkhand", "pincode": "834001", "base_rto": 0.36},
    {
        "city": "Bhopal",
        "state": "Madhya Pradesh",
        "pincode": "462001",
        "base_rto": 0.28,
    },
    {"city": "Agra", "state": "Uttar Pradesh", "pincode": "282001", "base_rto": 0.34},
]

FIRST_NAMES = [
    "Aarav",
    "Aditi",
    "Amit",
    "Ananya",
    "Arjun",
    "Deepak",
    "Divya",
    "Ishaan",
    "Kavita",
    "Manish",
    "Neha",
    "Pooja",
    "Rahul",
    "Rohan",
    "Sanjay",
    "Sneha",
    "Sunil",
    "Tanvi",
    "Varun",
    "Vikas",
]

LAST_NAMES = [
    "Sharma",
    "Verma",
    "Patel",
    "Gupta",
    "Singh",
    "Kumar",
    "Mishra",
    "Joshi",
    "Reddy",
    "Nair",
    "Mehta",
    "Chopra",
    "Bose",
    "Das",
    "Yadav",
    "Rao",
]

STREETS = [
    "MG Road",
    "Station Road",
    "Park Street",
    "Link Road",
    "Civil Lines",
    "Bazaar Street",
    "Nehru Nagar",
    "Gandhi Marg",
    "Ring Road",
    "Sector 14",
]

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15",
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) Chrome/123.0.6312.118 Mobile Safari/537.36",
]


@dataclass
class SyntheticMerchant:
    id: str
    name: str
    email: str


@dataclass
class SyntheticCustomer:
    id: str
    merchant_id: str
    first_name: str
    last_name: str
    email: str
    phone: str
    created_at: datetime.datetime


@dataclass
class SyntheticAddress:
    id: str
    customer_id: str
    line1: str
    locality: str
    city: str
    state: str
    pincode: str
    country: str
    normalized_hash: str
    base_rto_rate: float
    completeness: float


@dataclass
class SyntheticDevice:
    id: str
    customer_id: str
    device_hash: str
    ip_address: str
    user_agent: str


def generate_merchants(rng: np.random.Generator, n: int = 1) -> list[SyntheticMerchant]:
    """Generate primary merchant record."""
    merchants = []
    for i in range(n):
        m_id = f"merch_{i + 1:03d}"
        merchants.append(
            SyntheticMerchant(
                id=m_id,
                name="ReturnGuard Demo Merchant",
                email="merchant@returnguard.example.com",
            )
        )
    return merchants


def generate_customers(
    rng: np.random.Generator,
    merchant_id: str,
    n_customers: int = 1000,
    start_date: datetime.datetime = datetime.datetime(2026, 1, 1, tzinfo=datetime.UTC),
) -> list[SyntheticCustomer]:
    """Generate synthetic customer profiles."""
    customers = []
    for i in range(n_customers):
        c_id = f"cust_{i + 1:05d}"
        fn = str(rng.choice(FIRST_NAMES))
        ln = str(rng.choice(LAST_NAMES))
        suffix = rng.integers(100, 9999)
        email = f"{fn.lower()}.{ln.lower()}{suffix}@example.com"
        # 10-digit Indian mobile starting with 9, 8, 7, 6
        prefix = rng.choice([9, 8, 7, 6])
        num_rest = rng.integers(100000000, 999999999)
        phone = f"+91{prefix}{num_rest}"

        days_offset = int(rng.integers(0, 180))
        created_at = start_date + datetime.timedelta(days=days_offset)

        customers.append(
            SyntheticCustomer(
                id=c_id,
                merchant_id=merchant_id,
                first_name=fn,
                last_name=ln,
                email=email,
                phone=phone,
                created_at=created_at,
            )
        )
    return customers


def generate_addresses(
    rng: np.random.Generator, customers: list[SyntheticCustomer]
) -> list[SyntheticAddress]:
    """Generate synthetic physical delivery addresses for customers."""
    addresses = []
    for idx, cust in enumerate(customers):
        a_id = f"addr_{idx + 1:05d}"
        geo = rng.choice(PINCODE_CATALOG)
        street = str(rng.choice(STREETS))
        bldg_no = rng.integers(1, 400)
        line1 = f"Flat {bldg_no}, {street}"
        locality = f"Near {street} Cross"

        # Realistic completeness: most complete (1.0), some missing locality (0.8)
        completeness = float(rng.choice([1.0, 0.85, 0.70], p=[0.85, 0.12, 0.03]))

        # Normalized address hash for ring builder
        norm_str = f"{line1.lower().strip()}|{geo['pincode']}"
        norm_hash = deterministic_hash(norm_str)

        addresses.append(
            SyntheticAddress(
                id=a_id,
                customer_id=cust.id,
                line1=line1,
                locality=locality if completeness > 0.75 else "",
                city=geo["city"],
                state=geo["state"],
                pincode=geo["pincode"],
                country="India",
                normalized_hash=norm_hash,
                base_rto_rate=geo["base_rto"],
                completeness=completeness,
            )
        )
    return addresses


def generate_devices(
    rng: np.random.Generator, customers: list[SyntheticCustomer]
) -> list[SyntheticDevice]:
    """Generate synthetic device fingerprints for customers."""
    devices = []
    for idx, cust in enumerate(customers):
        d_id = f"dev_{idx + 1:05d}"
        # Unique deterministic hash per device token
        device_token = f"device_tok_{idx + 1:05d}_{cust.id}"
        d_hash = deterministic_hash(device_token)
        # Synthetic IP
        ip_parts = [
            str(rng.integers(103, 182)),
            str(rng.integers(10, 250)),
            str(rng.integers(1, 254)),
            str(rng.integers(1, 254)),
        ]
        ip = ".".join(ip_parts)
        ua = str(rng.choice(USER_AGENTS))

        devices.append(
            SyntheticDevice(
                id=d_id,
                customer_id=cust.id,
                device_hash=d_hash,
                ip_address=ip,
                user_agent=ua,
            )
        )
    return devices

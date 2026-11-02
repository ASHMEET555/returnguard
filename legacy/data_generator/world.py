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

CATEGORIES = [
    {"name": "Apparel", "base_risk": 0.28, "aov_mean": 1400.0, "aov_std": 500.0},
    {"name": "Footwear", "base_risk": 0.25, "aov_mean": 1800.0, "aov_std": 600.0},
    {"name": "Beauty", "base_risk": 0.12, "aov_mean": 850.0, "aov_std": 300.0},
    {"name": "Electronics", "base_risk": 0.08, "aov_mean": 3200.0, "aov_std": 1200.0},
    {"name": "Home", "base_risk": 0.15, "aov_mean": 1600.0, "aov_std": 700.0},
]

CARRIERS = ["BlueDart", "Delhivery", "Shadowfax", "Ekart", "DTDC"]


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


@dataclass
class SyntheticOrder:
    id: str
    merchant_id: str
    customer_id: str
    address_id: str
    device_id: str
    channel: str  # 'cod' | 'paypal'
    is_cod: int
    order_value: float
    item_count: int
    category: str
    category_risk: float
    checkout_speed_sec: float
    order_time: datetime.datetime


@dataclass
class SyntheticPayment:
    id: str
    order_id: str
    channel: str
    amount: float
    payment_authorized: int
    payment_captured: int
    order_to_payment_ratio: float
    status: str
    paypal_order_id: str | None


@dataclass
class SyntheticShipment:
    id: str
    order_id: str
    carrier: str
    tracking_number: str
    status: str
    shipped_at: datetime.datetime
    delivered_at: datetime.datetime | None
    rto_initiated_at: datetime.datetime | None


@dataclass
class SyntheticLabel:
    order_id: str
    channel: str
    y: int  # 1 for abuse, 0 for clean
    outcome_type: str  # 'delivered_clean', 'rto', 'refund_abusive', etc.
    outcome_time: datetime.datetime
    label_delay_days: int


def simulate_order_shipment_and_label(
    rng: np.random.Generator,
    order: SyntheticOrder,
    is_abuse: bool,
    abuse_type: str | None = None,
) -> tuple[SyntheticPayment, SyntheticShipment, SyntheticLabel]:
    """Simulate payment lifecycle, logistics shipment, and label outcome with delay."""
    # Payment simulation
    pay_id = f"pay_{order.id[4:]}"
    paypal_ord_id = f"PAYPAL-ORD-{order.id[4:]}" if order.channel == "paypal" else None

    if order.channel == "paypal":
        pay_auth = 1
        pay_capt = 1
        pay_status = "captured"
    else:
        pay_auth = 0
        pay_capt = 0
        pay_status = "pending"

    payment = SyntheticPayment(
        id=pay_id,
        order_id=order.id,
        channel=order.channel,
        amount=order.order_value,
        payment_authorized=pay_auth,
        payment_captured=pay_capt,
        order_to_payment_ratio=1.0,
        status=pay_status,
        paypal_order_id=paypal_ord_id,
    )

    # Shipment simulation
    ship_id = f"ship_{order.id[4:]}"
    carrier = str(rng.choice(CARRIERS))
    track_num = f"{carrier[:2].upper()}{rng.integers(1000000000, 9999999999)}"

    # Transit time: 2 to 5 days
    transit_days = int(rng.integers(2, 6))
    shipped_at = order.order_time + datetime.timedelta(hours=int(rng.integers(6, 24)))

    # Label delay: 3 to 7 days
    label_delay_days = int(rng.integers(3, 8))

    if order.channel == "cod":
        if is_abuse:
            # Abusive COD = RTO (delivery refused / customer unreachable)
            status = "rto_delivered"
            delivered_at = None
            rto_initiated_at = shipped_at + datetime.timedelta(days=transit_days)
            outcome_time = rto_initiated_at + datetime.timedelta(days=label_delay_days)
            outcome_type = abuse_type or "rto"
            y = 1
        else:
            # Genuine delivery
            status = "delivered"
            delivered_at = shipped_at + datetime.timedelta(days=transit_days)
            rto_initiated_at = None
            outcome_time = delivered_at + datetime.timedelta(days=label_delay_days)
            outcome_type = "delivered_clean"
            y = 0
    else:
        # PayPal channel (prepaid)
        status = "delivered"
        delivered_at = shipped_at + datetime.timedelta(days=transit_days)
        rto_initiated_at = None
        outcome_time = delivered_at + datetime.timedelta(days=label_delay_days)

        if is_abuse:
            outcome_type = abuse_type or "refund_abusive"
            y = 1
        else:
            outcome_type = "delivered_clean"
            y = 0

    shipment = SyntheticShipment(
        id=ship_id,
        order_id=order.id,
        carrier=carrier,
        tracking_number=track_num,
        status=status,
        shipped_at=shipped_at,
        delivered_at=delivered_at,
        rto_initiated_at=rto_initiated_at,
    )

    label = SyntheticLabel(
        order_id=order.id,
        channel=order.channel,
        y=y,
        outcome_type=outcome_type,
        outcome_time=outcome_time,
        label_delay_days=label_delay_days,
    )

    return payment, shipment, label


def generate_baseline_orders(
    rng: np.random.Generator,
    merchant_id: str,
    customers: list[SyntheticCustomer],
    addresses: list[SyntheticAddress],
    devices: list[SyntheticDevice],
    n_orders: int = 3500,
    start_date: datetime.datetime = datetime.datetime(2026, 1, 1, tzinfo=datetime.UTC),
    end_date: datetime.datetime = datetime.datetime(2026, 6, 30, tzinfo=datetime.UTC),
) -> tuple[
    list[SyntheticOrder],
    list[SyntheticPayment],
    list[SyntheticShipment],
    list[SyntheticLabel],
]:
    """Generate baseline legitimate orders and fulfillment across COD and PayPal."""
    cust_map = {c.id: c for c in customers}
    addr_map = {a.customer_id: a for a in addresses}
    dev_map = {d.customer_id: d for d in devices}

    orders = []
    payments = []
    shipments = []
    labels = []

    total_span_seconds = int((end_date - start_date).total_seconds())

    # Customer order counts following a power-law distribution
    cust_ids = [c.id for c in customers]
    weights = 1.0 / (np.arange(1, len(customers) + 1) ** 0.8)
    weights /= weights.sum()

    for i in range(n_orders):
        order_id = f"ord_{i + 1:06d}"
        c_id = str(rng.choice(cust_ids, p=weights))
        cust = cust_map[c_id]
        addr = addr_map[c_id]
        dev = dev_map[c_id]

        # Order timestamp
        sec_offset = int(rng.integers(0, total_span_seconds))
        ord_time = start_date + datetime.timedelta(seconds=sec_offset)
        # Ensure order_time is after customer registration
        if ord_time < cust.created_at:
            ord_time = cust.created_at + datetime.timedelta(
                hours=int(rng.integers(1, 48))
            )

        # Channel selection: 55% COD, 45% PayPal
        channel = "cod" if rng.random() < 0.55 else "paypal"
        is_cod = 1 if channel == "cod" else 0

        # Category and value
        cat = rng.choice(CATEGORIES)
        aov = max(250.0, float(rng.normal(cat["aov_mean"], cat["aov_std"])))
        order_value = round(aov, 2)
        item_count = int(rng.integers(1, 4))

        # Checkout speed: typical 45 to 300 seconds
        checkout_speed_sec = round(float(rng.uniform(45.0, 300.0)), 1)

        order = SyntheticOrder(
            id=order_id,
            merchant_id=merchant_id,
            customer_id=c_id,
            address_id=addr.id,
            device_id=dev.id,
            channel=channel,
            is_cod=is_cod,
            order_value=order_value,
            item_count=item_count,
            category=cat["name"],
            category_risk=cat["base_risk"],
            checkout_speed_sec=checkout_speed_sec,
            order_time=ord_time,
        )

        # Baseline outcomes:
        # Legitimate COD has small chance of natural courier RTO (delivery failure)
        # Legitimate PayPal has almost zero natural abuse (clean delivery)
        if channel == "cod":
            # Natural RTO based on pincode rate (~12-35%)
            is_natural_rto = rng.random() < (addr.base_rto_rate * 0.7)
            pay, ship, lbl = simulate_order_shipment_and_label(
                rng,
                order,
                is_abuse=is_natural_rto,
                abuse_type="rto" if is_natural_rto else None,
            )
        else:
            pay, ship, lbl = simulate_order_shipment_and_label(
                rng, order, is_abuse=False
            )

        orders.append(order)
        payments.append(pay)
        shipments.append(ship)
        labels.append(lbl)

    return orders, payments, shipments, labels


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

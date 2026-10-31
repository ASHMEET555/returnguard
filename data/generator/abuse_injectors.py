"""Abuse pattern injectors for ReturnGuard synthetic data generation."""

import datetime

import numpy as np

from data.generator.seed import deterministic_hash
from data.generator.world import (
    CATEGORIES,
    PINCODE_CATALOG,
    SyntheticAddress,
    SyntheticCustomer,
    SyntheticDevice,
    SyntheticLabel,
    SyntheticOrder,
    SyntheticPayment,
    SyntheticShipment,
    simulate_order_shipment_and_label,
)


def inject_serial_rto(
    rng: np.random.Generator,
    merchant_id: str,
    customers: list[SyntheticCustomer],
    addresses: list[SyntheticAddress],
    devices: list[SyntheticDevice],
    start_order_idx: int,
    n_abusers: int = 40,
    orders_per_abuser: int = 5,
    start_date: datetime.datetime = datetime.datetime(2026, 1, 15, tzinfo=datetime.UTC),
) -> tuple[
    list[SyntheticOrder],
    list[SyntheticPayment],
    list[SyntheticShipment],
    list[SyntheticLabel],
    int,
]:
    """Archetype 1: Serial RTO on COD.

    Customer orders exclusively on COD and rejects 80-100% of deliveries at the doorstep.
    """
    {c.id: c for c in customers}
    addr_map = {a.customer_id: a for a in addresses}
    dev_map = {d.customer_id: d for d in devices}

    abuser_custs = rng.choice(customers, size=n_abusers, replace=False)
    orders, payments, shipments, labels = [], [], [], []
    current_idx = start_order_idx

    for cust in abuser_custs:
        addr = addr_map[cust.id]
        dev = dev_map[cust.id]
        base_time = max(cust.created_at, start_date)

        for step in range(orders_per_abuser):
            current_idx += 1
            ord_id = f"ord_{current_idx:06d}"
            ord_time = base_time + datetime.timedelta(
                days=step * int(rng.integers(3, 10)),
                hours=int(rng.integers(1, 12)),
            )

            cat = rng.choice(CATEGORIES)
            val = round(
                max(400.0, float(rng.normal(cat["aov_mean"], cat["aov_std"]))), 2
            )

            order = SyntheticOrder(
                id=ord_id,
                merchant_id=merchant_id,
                customer_id=cust.id,
                address_id=addr.id,
                device_id=dev.id,
                channel="cod",
                is_cod=1,
                order_value=val,
                item_count=int(rng.integers(1, 3)),
                category=cat["name"],
                category_risk=cat["base_risk"],
                checkout_speed_sec=round(float(rng.uniform(20.0, 90.0)), 1),
                order_time=ord_time,
            )

            # 90% chance of RTO abuse, 10% overlap to avoid trivial separability
            is_abuse = rng.random() < 0.90
            pay, ship, lbl = simulate_order_shipment_and_label(
                rng,
                order,
                is_abuse=is_abuse,
                abuse_type="rto_serial" if is_abuse else None,
            )

            orders.append(order)
            payments.append(pay)
            shipments.append(ship)
            labels.append(lbl)

    return orders, payments, shipments, labels, current_idx


def inject_address_farm_ring(
    rng: np.random.Generator,
    merchant_id: str,
    customers: list[SyntheticCustomer],
    addresses: list[SyntheticAddress],
    devices: list[SyntheticDevice],
    start_order_idx: int,
    n_rings: int = 12,
    ring_size: int = 5,
    start_date: datetime.datetime = datetime.datetime(2026, 2, 1, tzinfo=datetime.UTC),
) -> tuple[
    list[SyntheticOrder],
    list[SyntheticPayment],
    list[SyntheticShipment],
    list[SyntheticLabel],
    int,
]:
    """Archetype 2: Address-farm ring.

    Multiple customer accounts sharing identical normalized address and/or device hash.
    Places repeated COD orders with high collective RTO rate.
    """
    orders, payments, shipments, labels = [], [], [], []
    current_idx = start_order_idx

    # Pick non-overlapping groups of customers
    cust_pool = list(customers[-(n_rings * ring_size) :])

    for ring_i in range(n_rings):
        ring_id = f"R{ring_i + 1:02d}"
        ring_members = cust_pool[ring_i * ring_size : (ring_i + 1) * ring_size]

        # Shared address & device across ring
        geo = rng.choice(PINCODE_CATALOG)
        shared_street = f"Plot {100 + ring_i}, Ring Farm Industrial Area"
        shared_hash = deterministic_hash(f"{shared_street.lower()}|{geo['pincode']}")
        shared_device_hash = deterministic_hash(f"shared_ring_device_{ring_id}")

        for m_idx, cust in enumerate(ring_members):
            cust_addr = SyntheticAddress(
                id=f"addr_ring_{ring_id}_{m_idx}",
                customer_id=cust.id,
                line1=f"{shared_street}, Unit {m_idx + 1}",
                locality="Farm Cluster",
                city=geo["city"],
                state=geo["state"],
                pincode=geo["pincode"],
                country="India",
                normalized_hash=shared_hash,
                base_rto_rate=geo["base_rto"],
                completeness=1.0,
            )
            cust_dev = SyntheticDevice(
                id=f"dev_ring_{ring_id}_{m_idx}",
                customer_id=cust.id,
                device_hash=shared_device_hash,
                ip_address="103.21.244.15",
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36",
            )
            addresses.append(cust_addr)
            devices.append(cust_dev)

            # Each member places 2-3 orders
            for ord_step in range(int(rng.integers(2, 4))):
                current_idx += 1
                ord_id = f"ord_{current_idx:06d}"
                ord_time = start_date + datetime.timedelta(
                    days=int(rng.integers(0, 45)),
                    hours=int(rng.integers(0, 23)),
                )

                cat = rng.choice(CATEGORIES)
                val = round(
                    max(300.0, float(rng.normal(cat["aov_mean"], cat["aov_std"]))), 2
                )

                order = SyntheticOrder(
                    id=ord_id,
                    merchant_id=merchant_id,
                    customer_id=cust.id,
                    address_id=cust_addr.id,
                    device_id=cust_dev.id,
                    channel="cod",
                    is_cod=1,
                    order_value=val,
                    item_count=int(rng.integers(1, 4)),
                    category=cat["name"],
                    category_risk=cat["base_risk"],
                    checkout_speed_sec=round(float(rng.uniform(15.0, 60.0)), 1),
                    order_time=ord_time,
                )

                is_abuse = rng.random() < 0.85
                pay, ship, lbl = simulate_order_shipment_and_label(
                    rng,
                    order,
                    is_abuse=is_abuse,
                    abuse_type="rto_ring" if is_abuse else None,
                )

                orders.append(order)
                payments.append(pay)
                shipments.append(ship)
                labels.append(lbl)

    return orders, payments, shipments, labels, current_idx


def inject_velocity_spike(
    rng: np.random.Generator,
    merchant_id: str,
    customers: list[SyntheticCustomer],
    addresses: list[SyntheticAddress],
    devices: list[SyntheticDevice],
    start_order_idx: int,
    n_bursts: int = 25,
    start_date: datetime.datetime = datetime.datetime(2026, 3, 1, tzinfo=datetime.UTC),
) -> tuple[
    list[SyntheticOrder],
    list[SyntheticPayment],
    list[SyntheticShipment],
    list[SyntheticLabel],
    int,
]:
    """Archetype 3: Velocity spike week.

    Sudden burst of 6-12 orders placed within a 24-48 hour window with high COD share.
    """
    {c.id: c for c in customers}
    addr_map = {a.customer_id: a for a in addresses}
    dev_map = {d.customer_id: d for d in devices}

    burst_custs = rng.choice(customers[:200], size=n_bursts, replace=False)
    orders, payments, shipments, labels = [], [], [], []
    current_idx = start_order_idx

    for cust in burst_custs:
        addr = addr_map[cust.id]
        dev = dev_map[cust.id]
        burst_start = start_date + datetime.timedelta(days=int(rng.integers(0, 60)))
        burst_count = int(rng.integers(6, 12))

        for step in range(burst_count):
            current_idx += 1
            ord_id = f"ord_{current_idx:06d}"
            # Burst within 24-36 hours
            ord_time = burst_start + datetime.timedelta(
                hours=int(step * rng.integers(1, 4))
            )

            cat = rng.choice(CATEGORIES)
            val = round(
                max(200.0, float(rng.normal(cat["aov_mean"], cat["aov_std"]))), 2
            )

            order = SyntheticOrder(
                id=ord_id,
                merchant_id=merchant_id,
                customer_id=cust.id,
                address_id=addr.id,
                device_id=dev.id,
                channel="cod",
                is_cod=1,
                order_value=val,
                item_count=1,
                category=cat["name"],
                category_risk=cat["base_risk"],
                checkout_speed_sec=round(float(rng.uniform(10.0, 45.0)), 1),
                order_time=ord_time,
            )

            is_abuse = rng.random() < 0.80
            pay, ship, lbl = simulate_order_shipment_and_label(
                rng,
                order,
                is_abuse=is_abuse,
                abuse_type="rto_spike" if is_abuse else None,
            )

            orders.append(order)
            payments.append(pay)
            shipments.append(ship)
            labels.append(lbl)

    return orders, payments, shipments, labels, current_idx


def inject_high_value_first_order(
    rng: np.random.Generator,
    merchant_id: str,
    customers: list[SyntheticCustomer],
    addresses: list[SyntheticAddress],
    devices: list[SyntheticDevice],
    start_order_idx: int,
    n_orders: int = 50,
    start_date: datetime.datetime = datetime.datetime(2026, 2, 10, tzinfo=datetime.UTC),
) -> tuple[
    list[SyntheticOrder],
    list[SyntheticPayment],
    list[SyntheticShipment],
    list[SyntheticLabel],
    int,
]:
    """Archetype 4: High-value first-order COD.

    First-time customer ordering expensive electronics/apparel on COD in high-risk pincode.
    """
    {c.id: c for c in customers}
    addr_map = {a.customer_id: a for a in addresses}
    dev_map = {d.customer_id: d for d in devices}

    target_custs = rng.choice(customers[200:400], size=n_orders, replace=False)
    orders, payments, shipments, labels = [], [], [], []
    current_idx = start_order_idx

    for cust in target_custs:
        current_idx += 1
        ord_id = f"ord_{current_idx:06d}"
        addr = addr_map[cust.id]
        dev = dev_map[cust.id]
        ord_time = start_date + datetime.timedelta(days=int(rng.integers(0, 90)))

        # 3.5x to 5x standard order value
        val = round(float(rng.uniform(6500.0, 14000.0)), 2)

        order = SyntheticOrder(
            id=ord_id,
            merchant_id=merchant_id,
            customer_id=cust.id,
            address_id=addr.id,
            device_id=dev.id,
            channel="cod",
            is_cod=1,
            order_value=val,
            item_count=int(rng.integers(3, 7)),
            category="Electronics",
            category_risk=0.08,
            checkout_speed_sec=round(float(rng.uniform(25.0, 80.0)), 1),
            order_time=ord_time,
        )

        is_abuse = rng.random() < 0.75
        pay, ship, lbl = simulate_order_shipment_and_label(
            rng,
            order,
            is_abuse=is_abuse,
            abuse_type="rto_high_value" if is_abuse else None,
        )

        orders.append(order)
        payments.append(pay)
        shipments.append(ship)
        labels.append(lbl)

    return orders, payments, shipments, labels, current_idx


def inject_clean_loyal_prepaid(
    rng: np.random.Generator,
    merchant_id: str,
    customers: list[SyntheticCustomer],
    addresses: list[SyntheticAddress],
    devices: list[SyntheticDevice],
    start_order_idx: int,
    n_customers: int = 50,
    orders_per_customer: int = 6,
    start_date: datetime.datetime = datetime.datetime(2026, 1, 5, tzinfo=datetime.UTC),
) -> tuple[
    list[SyntheticOrder],
    list[SyntheticPayment],
    list[SyntheticShipment],
    list[SyntheticLabel],
    int,
]:
    """Archetype 5 (Negative Control): Clean loyal prepaid shoppers.

    High order counts, long delivery streaks, consistent prepaid payment, 0% abuse (y=0).
    """
    {c.id: c for c in customers}
    addr_map = {a.customer_id: a for a in addresses}
    dev_map = {d.customer_id: d for d in devices}

    loyal_custs = rng.choice(customers[400:600], size=n_customers, replace=False)
    orders, payments, shipments, labels = [], [], [], []
    current_idx = start_order_idx

    for cust in loyal_custs:
        addr = addr_map[cust.id]
        dev = dev_map[cust.id]
        base_time = start_date

        for step in range(orders_per_customer):
            current_idx += 1
            ord_id = f"ord_{current_idx:06d}"
            ord_time = base_time + datetime.timedelta(
                days=step * int(rng.integers(10, 25)),
                hours=int(rng.integers(1, 12)),
            )

            cat = rng.choice(CATEGORIES)
            val = round(
                max(500.0, float(rng.normal(cat["aov_mean"], cat["aov_std"]))), 2
            )

            order = SyntheticOrder(
                id=ord_id,
                merchant_id=merchant_id,
                customer_id=cust.id,
                address_id=addr.id,
                device_id=dev.id,
                channel="paypal",
                is_cod=0,
                order_value=val,
                item_count=int(rng.integers(1, 3)),
                category=cat["name"],
                category_risk=cat["base_risk"],
                checkout_speed_sec=round(float(rng.uniform(60.0, 240.0)), 1),
                order_time=ord_time,
            )

            # Strictly 0% abuse (clean delivery)
            pay, ship, lbl = simulate_order_shipment_and_label(
                rng, order, is_abuse=False
            )

            orders.append(order)
            payments.append(pay)
            shipments.append(ship)
            labels.append(lbl)

    return orders, payments, shipments, labels, current_idx


def inject_paypal_refund_after_delivery(
    rng: np.random.Generator,
    merchant_id: str,
    customers: list[SyntheticCustomer],
    addresses: list[SyntheticAddress],
    devices: list[SyntheticDevice],
    start_order_idx: int,
    n_abusers: int = 35,
    orders_per_abuser: int = 4,
    start_date: datetime.datetime = datetime.datetime(2026, 2, 1, tzinfo=datetime.UTC),
) -> tuple[
    list[SyntheticOrder],
    list[SyntheticPayment],
    list[SyntheticShipment],
    list[SyntheticLabel],
    int,
]:
    """Archetype 6: PayPal refund-after-delivery repeat.

    Customer orders via PayPal sandbox, order is fulfilled and delivered with tracking proof,
    but buyer repeatedly files refund requests or fraudulent claims without returning the physical item (y=1).
    """
    addr_map = {a.customer_id: a for a in addresses}
    dev_map = {d.customer_id: d for d in devices}

    abuser_custs = rng.choice(customers[600:800], size=n_abusers, replace=False)
    orders, payments, shipments, labels = [], [], [], []
    current_idx = start_order_idx

    for cust in abuser_custs:
        addr = addr_map[cust.id]
        dev = dev_map[cust.id]
        base_time = max(cust.created_at, start_date)

        for step in range(orders_per_abuser):
            current_idx += 1
            ord_id = f"ord_{current_idx:06d}"
            ord_time = base_time + datetime.timedelta(
                days=step * int(rng.integers(7, 18)),
                hours=int(rng.integers(1, 14)),
            )

            cat = rng.choice(CATEGORIES)
            val = round(
                max(600.0, float(rng.normal(cat["aov_mean"], cat["aov_std"]))), 2
            )

            order = SyntheticOrder(
                id=ord_id,
                merchant_id=merchant_id,
                customer_id=cust.id,
                address_id=addr.id,
                device_id=dev.id,
                channel="paypal",
                is_cod=0,
                order_value=val,
                item_count=int(rng.integers(1, 4)),
                category=cat["name"],
                category_risk=cat["base_risk"],
                checkout_speed_sec=round(float(rng.uniform(30.0, 120.0)), 1),
                order_time=ord_time,
            )

            # 85% abuse rate, 15% overlap/clean to preserve realistic variance
            is_abuse = rng.random() < 0.85
            pay, ship, lbl = simulate_order_shipment_and_label(
                rng,
                order,
                is_abuse=is_abuse,
                abuse_type="paypal_refund_abuse" if is_abuse else None,
            )

            orders.append(order)
            payments.append(pay)
            shipments.append(ship)
            labels.append(lbl)

    return orders, payments, shipments, labels, current_idx


def inject_paypal_dispute_legit_control(
    rng: np.random.Generator,
    merchant_id: str,
    customers: list[SyntheticCustomer],
    addresses: list[SyntheticAddress],
    devices: list[SyntheticDevice],
    start_order_idx: int,
    n_orders: int = 40,
    start_date: datetime.datetime = datetime.datetime(2026, 2, 15, tzinfo=datetime.UTC),
) -> tuple[
    list[SyntheticOrder],
    list[SyntheticPayment],
    list[SyntheticShipment],
    list[SyntheticLabel],
    int,
]:
    """Archetype 7 (Negative Control): PayPal dispute on legitimate delivered order.

    Normal buyer opens an informational inquiry (e.g., inquiry on sizing or billing query)
    that resolves without fraud or abusive chargeback. Genuine customer, y=0.
    """
    addr_map = {a.customer_id: a for a in addresses}
    dev_map = {d.customer_id: d for d in devices}

    legit_custs = rng.choice(customers[800:1000], size=n_orders, replace=False)
    orders, payments, shipments, labels = [], [], [], []
    current_idx = start_order_idx

    for cust in legit_custs:
        current_idx += 1
        ord_id = f"ord_{current_idx:06d}"
        addr = addr_map[cust.id]
        dev = dev_map[cust.id]
        ord_time = start_date + datetime.timedelta(days=int(rng.integers(0, 100)))

        cat = rng.choice(CATEGORIES)
        val = round(max(500.0, float(rng.normal(cat["aov_mean"], cat["aov_std"]))), 2)

        order = SyntheticOrder(
            id=ord_id,
            merchant_id=merchant_id,
            customer_id=cust.id,
            address_id=addr.id,
            device_id=dev.id,
            channel="paypal",
            is_cod=0,
            order_value=val,
            item_count=int(rng.integers(1, 3)),
            category=cat["name"],
            category_risk=cat["base_risk"],
            checkout_speed_sec=round(float(rng.uniform(50.0, 200.0)), 1),
            order_time=ord_time,
        )

        # Negative control: is_abuse = False (y = 0)
        pay, ship, lbl = simulate_order_shipment_and_label(
            rng, order, is_abuse=False, abuse_type="paypal_legit_inquiry"
        )

        orders.append(order)
        payments.append(pay)
        shipments.append(ship)
        labels.append(lbl)

    return orders, payments, shipments, labels, current_idx

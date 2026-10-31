# Phase A Research Notes — ReturnGuard

## 1. Synthetic Data Design for Return-Abuse and RTO
- **Customer & Address Realism**: Generate customer entities with power-law order distributions (most customers place 1–3 orders; a long tail of repeat customers). Normalize addresses into tokens (street, locality, pincode, city, state) and associate multiple customer accounts with overlapping device hashes or physical address tokens to mirror realistic multi-accounting.
- **Non-Trivial Abuse Injection**: Avoid synthetic "giveaways" (e.g. perfect 1.0 abuse labels or identical fake names). Abusers must exhibit realistic behavioral overlap with legitimate customers:
  - Legitimate customers occasionally experience RTO (e.g. 5–8% baseline due to genuine delivery failures, door locked, incorrect pincode).
  - Serial abusers place normal-looking early orders before defecting or rotating accounts.
  - Ring nodes share subtle identifiers (e.g., matching normalized phone or address suffix) while varying email prefixes and order times.

## 2. Indian COD and RTO Context
- **COD Share**: In Indian e-commerce (particularly independent D2C brands), Cash on Delivery accounts for 50%–60% of total volume, rising up to 65%–70% in Tier-2/Tier-3 cities (Sources: Unicommerce D2C Trends Report, Shiprocket Logistics Insights).
- **RTO Rates**:
  - COD orders experience a 25%–40% RTO rate without pre-dispatch intervention.
  - Prepaid orders experience a significantly lower 5%–8% RTO rate.
- **Pincode & Category Drivers**: Tier-2/3 pincodes and remote service zones exhibit higher RTO due to courier coverage gaps and buyer remorse. High-risk product categories (apparel, footwear) suffer 30%+ return rates compared to electronics (<10%).
- *Assumptions*: Pincode baseline risk bucketed into low (10%), medium (22%), high (38%) RTO probabilities. Average forward + reverse logistics loss per RTO assumed at ₹180 based on standard 500g e-commerce courier rates.

## 3. PayPal Sandbox Facts
- **Sandbox Base URL**: `https://api-m.sandbox.paypal.com` (Verified on developer.paypal.com).
- **Test Accounts**: Managed in PayPal Developer Dashboard (`developer.paypal.com` -> Testing Tools -> Sandbox Accounts). Provides sandbox Merchant (Business) and Buyer (Personal) accounts with mock balances and payment methods.
- **Authorization Hold Window**:
  - Authorizations (`intent=AUTHORIZE`) hold funds for up to **29 days**.
  - **Honor Period**: First 3 business days guarantee 100% of authorized funds upon capture. Captures beyond 3 days remain possible up to 29 days but depend on account risk and re-authorization.
  - Captures after day 3 can be reauthorized generating a new Authorization ID.
  - *Recommendation*: Capture within 3 days or hold pending review up to review SLA.
- **Disputes API Base Endpoint**: `POST /v1/customer/disputes/{id}/provide-evidence` (Multipart input with evidence type).
- *UNVERIFIED*: Exact dispute resolution latency and specific mock dispute auto-resolution triggers in sandbox environment without manual seller response (depends on PayPal sandbox batch simulation cadence).

## 4. Label Design for the PayPal Channel
- **Prepaid Nuance**: PayPal orders are prepaid; therefore, courier RTO does not directly equate to COD non-acceptance.
- **Abuse Definition (`y = 1`)**:
  1. Refund granted or requested after delivery confirmation without a validated physical return receipt.
  2. Buyer disputes lost on fraud/abuse grounds (e.g., false "item not received" despite carrier delivery proof).
- **Outcome Window**: 30 days post-delivery. Simulate a 3–7 day reporting delay before the merchant receives return/dispute notification.

## 5. Seeding and Determinism
- **RNG Initialization**: Use a single `numpy.random.Generator` initialized via `numpy.random.default_rng(seed)`.
- **Ordering & Types**:
  - Avoid global Python `random`, `hash()`, and unordered set/dict iterations.
  - Sort all tabular data explicitly by `order_time` ascending, breaking ties deterministically by `order_id`.
- **PyArrow / Parquet Reproducibility**:
  - Export with explicit schema definitions and deterministic writer settings (`version="2.6"`, `compression="snappy"`, `write_statistics=True`).
  - Write manifest with SHA-256 hashes of generated datasets.

## 6. Parquet Schema & Split Strategy
- **Temporal Split**:
  - Train: `order_time <= T0` (e.g., initial 70% of timeline).
  - Validation: `T0 < order_time <= T1` (next 15% of timeline).
  - Test: `order_time > T1` (final 15% of timeline).
- **Customer Holdout**:
  - 15% of all unique `customer_id`s randomly partitioned into a pure holdout group prior to temporal slicing, ensuring test set contains unseen customers for generalization evaluation.
- **Column Separation**:
  - Features file: Only columns known strictly as of `order_time`.
  - Labels file / target: Stored separately or joined only in training pipelines, avoiding future leakage.

---

## Commit Plan
1. `docs: phase A research notes` (this document)
2. `feat(db): define order, payment, customer, address, device, shipment tables` (db/models.py initial entities and create script)
3. `feat(db): add payment_event, dispute, evidence_pack, evidence_submission, merchant_audit, audit_score_event` (db/models.py remaining entities)
4. `feat(config): freeze feature dictionary in features/dictionary.yaml` (names and types matching 02-architecture.md exactly)
5. `docs: add fp_cost_assumptions with COD and PayPal constants` (docs/fp_cost_assumptions.md)
6. `feat(generator): seeded RNG and entity factories for merchants, customers, addresses, devices` (data/generator/seed.py, world.py base entities)
7. `feat(generator): COD and PayPal order and shipment simulation with label delay` (data/generator/world.py orders & shipments)
8. `feat(generator): five COD abuse archetypes` (data/generator/abuse_injectors.py COD archetypes)
9. `feat(generator): two PayPal abuse archetypes` (data/generator/abuse_injectors.py PayPal archetypes)
10. `feat(data): export train, val and test parquet with split by order_time and customer holdout` (data/generator runner & parquet exporter)
11. `test(generator): determinism test (same seed -> identical holdout customer IDs and row hashes)`
12. `test(generator): no future-leakage columns in feature-facing files`
13. `docs: data card with row counts, positive rate per channel, split dates, held-out customer count` (docs/data_card.md generated by script)
14. `chore: update phase A checkboxes in 03-phases.md` (checklists verified and ticked)

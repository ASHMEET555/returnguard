# ReturnGuard

**AI-powered payment-risk platform for merchants.** ReturnGuard scores card-not-present payment transactions for fraud risk, applies a transparent five-rule policy, explains each recommendation with SHAP, and keeps an audit trail. Merchants call it from their servers and can embed its risk components in their admin applications.

ReturnGuard recommends. The merchant executes. It never moves money, cancels orders, or files disputes on its own.

**ShopPoint** (`/ShopPoint`) is the reference merchant. It is a demonstration application, not the ReturnGuard product.

Hackathon: Build What's Next with PayPal and AI.

## Status

| Area | Status |
|---|---|
| Risk scoring API, ML layer, policy, SHAP, shadow mode, audit | Working |
| ShopPoint PayPal authorize, capture gate, merchant review | Working in mocked tests; live sandbox run pending |
| ShopPoint PayPal webhook | Working; **signature verification pending** |
| Authentication and multi-tenancy | Not yet built (Phase E). `/v1/score` is currently unauthenticated |
| SDK and React components | Planned (Phases F and G) |
| Evidence Engine | Planned (Phase I) |

See [docs/plan/03-phases.md](docs/plan/03-phases.md) for the full checklist.

## Quick start

Prerequisites: Python 3.13, Node.js (for ShopPoint), MongoDB, an ngrok account for webhooks.

```bash
# ReturnGuard
cd returnguard
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn api.main:app --reload                    # http://127.0.0.1:8000

# Tests
pytest
```

```bash
# ShopPoint
cd ShopPoint
npm install
npm run start:dev                  # backend http://127.0.0.1:5000
cd client && npm install && npm start   # frontend http://localhost:3000
node --test tests/d1_payment.test.js tests/d2_capture_gate.test.js tests/d3_webhooks.test.js
```

Copy `config/config.env.example` to `config/config.env` in ShopPoint and fill in the PayPal sandbox values. Never commit that file.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | ReturnGuard | SQLAlchemy URL. Defaults to SQLite |
| `SHADOW_MODE` | ReturnGuard and ShopPoint | `true` (default) records decisions without enforcing |
| `PAYPAL_CLIENT_ID` | ShopPoint | PayPal sandbox client ID |
| `PAYPAL_CLIENT_SECRET` | ShopPoint | PayPal sandbox secret. Never in ReturnGuard |
| `PAYPAL_WEBHOOK_ID` | ShopPoint | Sandbox webhook ID for signature verification |
| `PAYPAL_ENV` | ShopPoint | `sandbox` |
| `RETURNGUARD_BASE_URL` | ShopPoint | ReturnGuard API base URL |

ReturnGuard's own `.env.example` still lists PayPal credentials. They are scheduled for removal in Phase E.

## Model results

All figures are on held-out test data. Operating thresholds were chosen on validation data only. Costs use the project's cost model: ₹50 per false positive, 50% of the amount per false negative.

**Synthetic (days 50–59, 35,949 transactions, 719 fraud):** LightGBM, threshold 0.40.

| Metric | Value |
|---|---|
| Precision | 0.7847 |
| Recall | 0.8818 (634 of 719) |
| F1 | 0.8304 |
| PR-AUC | 0.9009 |
| ROC-AUC | 0.9684 |
| Expected cost | ₹41,376.78 (amount heuristic: ₹171,069) |

Split: chronological. Train days 0–39, validation 40–49, test 50–59. Reproduced on the frozen artifact in this repository.

**IEEE-CIS (external, test days 140–182, 118,108 transactions):** reported, not reproduced in this repository. The Phase 17 artifact and its predictions are absent.

| Model | Precision | Recall | ROC-AUC | Cost units |
|---|---|---|---|---|
| Phase 17 (τ = 0.35) | 6.31% | 79.80% | 0.7712 | 2,469,531 |
| Candidate v2 (τ = 0.30), not approved for serving | 6.70% | 77.46% | 0.7728 | 2,263,053 |

IEEE currency is not stated in the dataset; its cost figures are in units, not ₹.

### Honest limits

- **IEEE precision is low.** About one true chargeback for every 15 flagged transactions. The IEEE model is a high-recall filter for step-up review, not a blocker. ReturnGuard never auto-declines on it.
- **Public data lacks device and login telemetry.** Production precision depends on merchant signals that this build does not have.
- **Synthetic metrics are not production metrics.** They measure the model on the generator's distribution.
- **One earlier figure is unreconciled.** A table lists synthetic ROC-AUC as 0.984. The reproduced value is 0.9684. The 0.984 figure is not used.

## Architecture

Merchant server ──(API key)──► ReturnGuard API ──► features → LightGBM → policy → SHAP → audit
│ (recommendation only)
│
ShopPoint backend ──► PayPal (authorize, capture, void, webhooks)
│ ▲
└─ decision ──────┘ capture only after the decision check


Details: [docs/plan/02-architecture.md](docs/plan/02-architecture.md).

## Defense pledge

- Shadow mode is the default. Enforcement is an explicit merchant setting.
- Never auto-cancel, void, decline, refund or file a dispute. `BLOCK` routes a case to human review.
- ReturnGuard never holds PayPal credentials and never calls PayPal.
- Every decision and merchant action writes an audit row.
- Evidence packs are drafted from stored records, reviewed by a human, and submitted by the merchant.
- No offense-capable tooling. No scraping of other merchants.

## Documentation

| File | Contents |
|---|---|
| [docs/plan/01-brief.md](docs/plan/01-brief.md) | Product scope, locks, open decisions, Definition of Done |
| [docs/plan/02-architecture.md](docs/plan/02-architecture.md) | Components, flows, ownership, tenancy and auth design |
| [docs/plan/03-phases.md](docs/plan/03-phases.md) | Phase checklists and exit criteria |
| [docs/api/ml_contract.md](docs/api/ml_contract.md) | Score request and response contract |
| [docs/data_mapping.md](docs/data_mapping.md) | PayPal order to transaction mapping |
| [docs/decisions.md](docs/decisions.md) | Recorded decisions |
| [reports/holdout_metrics.md](reports/holdout_metrics.md) | Full holdout report |

## License

See LICENSE.

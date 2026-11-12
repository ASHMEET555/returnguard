# ReturnGuard

> **AI-Powered Payment & Return-Abuse Risk Platform for PayPal Merchants**  
> *Built for the "Build What's Next with PayPal and AI" Hackathon.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/LICENSE)
[![Python 3.13](https://img.shields.io/badge/Python-3.13+-blue.svg)](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/requirements.txt)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/web)
[![AG Grid](https://img.shields.io/badge/AG_Grid-Enterprise_Ready-brightgreen.svg)](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/react)
[![Deploy on Render](https://img.shields.io/badge/Deploy-Render-46E3B7.svg)](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/render.yaml)

---

## 📖 Executive Summary

**ReturnGuard** is an enterprise-grade payment and return-abuse risk intelligence platform designed to protect e-commerce merchants accepting payments via PayPal. By combining machine learning fraud scoring (LightGBM), local explainability via TreeSHAP, deterministic policy guardrails, and cryptographic webhook audit trails, ReturnGuard provides real-time transaction evaluations before capture.

### Core Architectural Philosophy: "ReturnGuard Recommends, The Merchant Executes"
- **Strict Human-in-the-Loop & Decision Isolation:** ReturnGuard never touches customer funds, never holds merchant PayPal credentials, and never cancels orders or files chargeback disputes autonomously.
- **Authoritative Two-Phase Payment Gating:** Integrated directly into the PayPal **Authorize → Decision Gate → Capture / Void** lifecycle. High-risk transactions are routed to manual review rather than failing silently or causing unintended checkout friction.

---

## 💡 How We Used PayPal & AI

### 1. PayPal Integration Architecture
ReturnGuard integrates with PayPal's modern REST APIs and checkout flows via our reference merchant store, **ShopPoint**:
- **Intent: AUTHORIZE (`/v2/checkout/orders`):** Rather than immediate capture at checkout, transactions are created with `intent: "AUTHORIZE"`.
- **Pre-Capture Risk Evaluation Gate:** When an authorization succeeds (`/v2/checkout/orders/{id}/authorize`), the merchant backend immediately submits transaction metadata, device telemetry, and velocity signals to the ReturnGuard Risk API (`POST /v1/score`).
- **Policy Enforcement:**
  - `ALLOW` / `LOW_RISK`: The merchant service captures funds via `/v2/payments/authorizations/{authorization_id}/capture`.
  - `FLAG` / `MANUAL_REVIEW`: The authorization is held, and an investigation item is automatically queued in the ReturnGuard Merchant Portal.
  - `BLOCK` / `DECLINE`: The merchant service voids authorization via `/v2/payments/authorizations/{authorization_id}/void`.
- **Idempotency & Re-entrancy:** Every call leverages `PayPal-Request-Id` and transaction tracking to guarantee zero duplicate captures or race conditions.
- **Cryptographic Webhook Verification:** Full validation of incoming PayPal webhook notifications (`POST /v1/notifications/verify-webhook-signature`) verifying `paypal-auth-algo`, `paypal-cert-url`, `paypal-transmission-id`, `paypal-transmission-sig`, and `paypal-transmission-time`.

### 2. Artificial Intelligence & Machine Learning Architecture
- **LightGBM Gradient Boosting Engine:** Trained on temporal splits (days 0–39 train, 40–49 validation, 50–59 test) to predict return abuse and chargeback probability with high precision and low false positives.
  - **PR-AUC:** `0.9009` | **ROC-AUC:** `0.9684` | **F1 Score:** `0.8304` (Precision: `78.47%`, Recall: `88.18%`).
  - Cost-optimized threshold selection minimizing merchant loss: ₹50 per false positive, 50% amount per false negative.
- **TreeSHAP Explainability Layer (`ShapExplanationService`):**
  - Uses exact TreeSHAP attribution with guaranteed mathematical additivity ($|\sum \phi_i - (f(x) - E[f(x)])| < 10^{-4}$).
  - Extracts the top $k$ positive and negative risk contributors for each decision, humanizing them into actionable reason codes (e.g., velocity spikes, shipping vs billing discrepancies, anomalous basket amounts).
- **Five-Tier Deterministic Policy Engine:** Combines AI probabilities with hard business rules (velocity thresholds, blacklists, high-value limits) to ensure predictable, compliant decisions.

---

## 🛠️ Sponsor Integrations & Technology Stack

| Category | Technology | Usage & Integration Details |
|---|---|---|
| **Payments** | **PayPal REST APIs** | `Orders V2` (Authorize/Capture/Void), Webhook verification, and PayPal JavaScript SDK |
| **Hosting & Cloud** | **Render** | Full multi-service infrastructure codified in [`render.yaml`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/render.yaml) deploying FastAPI backend, Next.js dashboard, and ShopPoint storefront |
| **API Contract & Specs** | **APIMatic & Postman** | OpenAPI 3.1 specification auto-generated via FastAPI (`/openapi.json`), ready for APIMatic SDK generation and Postman Collections for client onboarding |
| **Frontend Framework** | **Next.js 14 / React 18** | High-performance dashboard with Tailwind CSS following Stripe + Linear minimalist aesthetic |
| **Data Grid & Analytics** | **AG Grid Enterprise** | High-density transaction logs, review queues, audit logs, and virtualized data grids |
| **Backend & Machine Learning** | **FastAPI, Python 3.13, LightGBM, SHAP** | Async API backend, real-time feature extraction, model scoring, and explanation pipelines |
| **Database & Persistence** | **SQLite / PostgreSQL / MongoDB** | Relational state management for ReturnGuard (`returnguard.db`) and document store for ShopPoint |
| **Client Libraries** | `@returnguard/sdk` & `@returnguard/react` | First-party TypeScript SDK and drop-in React components for zero-friction merchant integration |

---

## 🚀 Setup & Installation Instructions

### Prerequisites
- **Python:** 3.13+ installed
- **Node.js:** v18.x or v20.x+ & `npm`
- **PayPal Developer Account:** Sandbox client credentials from [PayPal Developer Dashboard](https://developer.paypal.com)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/<your-username>/returnguard.git
cd returnguard
```

---

### Step 2: Set Up ReturnGuard API (Backend)
```bash
# Navigate to returnguard
cd returnguard

# Create and activate Python virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn api.main:app --reload --port 8000
```
- **API Server:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive OpenAPI Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **OpenAPI Schema (for Postman/APIMatic):** [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

---

### Step 3: Set Up ReturnGuard Web Dashboard
Open a new terminal window:
```bash
cd returnguard/web
npm install
npm run dev -- -p 3001
```
- **Dashboard URL:** [http://localhost:3001](http://localhost:3001)

---

### Step 4: Set Up Reference Merchant (ShopPoint)
To test the complete end-to-end PayPal checkout with the pre-capture ReturnGuard risk evaluation:
```bash
cd ../ShopPoint

# Configure environment variables
cp config/config.env.example config/config.env
```
Edit `ShopPoint/config/config.env` with your PayPal Sandbox credentials:
```env
PORT=5000
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
PAYPAL_ENV=sandbox
RETURNGUARD_BASE_URL=http://127.0.0.1:8000
SHADOW_MODE=false
```

Start the ShopPoint backend and client:
```bash
# ShopPoint Backend (port 5000)
npm install
npm run start:dev

# ShopPoint Storefront (port 3000) in a separate terminal:
cd client
npm install
npm start
```

---

## 🧪 Testing & Verification

Run the comprehensive test suites across both Python and Node.js:

```bash
# 1. ReturnGuard Backend & ML Unit Tests
cd returnguard
pytest -v

# 2. ReturnGuard TypeScript SDK Tests
cd returnguard/packages/sdk
npm test

# 3. ShopPoint PayPal Gateway & State Machine Tests
cd ../../../ShopPoint
node --test tests/d1_payment.test.js tests/d2_capture_gate.test.js tests/d3_webhooks.test.js
```

---

## ☁️ Cloud Deployment with Render

ReturnGuard provides a pre-configured Blueprint specification ([`render.yaml`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/render.yaml)) enabling one-click deployment to **Render**:
1. Connect your GitHub repository to [Render](https://render.com).
2. Create a new **Blueprint Instance** pointing to `render.yaml`.
3. Render automatically provisions:
   - `returnguard-api`: Python Docker service hosting the FastAPI scoring backend.
   - `returnguard-dashboard`: Next.js web application.
   - `shoppoint`: Node.js e-commerce demo application with PayPal integration.

---

## 📄 License

This project is licensed under the **MIT License** — an approved [Open Source Initiative (OSI)](https://opensource.org/licenses/MIT) license.  
See the [LICENSE](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/LICENSE) file for complete terms and copyright details.

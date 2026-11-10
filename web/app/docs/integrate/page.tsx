"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "../../../components/Navbar";

export default function IntegrationGuidePage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyCode = (text: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSection(id);
      setTimeout(() => setCopiedSection(null), 2500);
    }
  };

  const sdkTarballUrl = "/downloads/returnguard-sdk.tgz";
  const sdkChecksum = "ebf9b0b4422c503e5f143d4cf90d76a18a472516dc5437ba637a0c208d5444a9";

  const dockerSnippet = `# 1. Pull and run ReturnGuard engine locally
docker run -d \\
  --name returnguard-api \\
  -p 8000:8000 \\
  -e RG_ADMIN_TOKEN="<your-admin-token-at-least-32-chars>" \\
  returnguard:latest`;

  const installSnippet = `# Option A: Install from local tarball download
npm install ./downloads/returnguard-sdk.tgz

# Option B: Install directly from HTTP endpoint
npm install http://localhost:3000/downloads/returnguard-sdk.tgz`;

  const nodeSnippet = `import { ReturnGuardClient, ScorePayload, ScoreResult } from "@returnguard/sdk";

// 1. Initialize client with server-side API key
// NEVER expose this API key in browser bundles!
const client = new ReturnGuardClient({
  baseUrl: process.env.RETURNGUARD_API_URL || "http://127.0.0.1:8000",
  apiKey: process.env.RETURNGUARD_API_KEY || "rg_live_XXXXXXXX",
});

export async function evaluateOrderRisk(orderData: {
  orderId: string;
  customerId: string;
  amount: number;
  currency: string;
}) {
  const payload: ScorePayload = {
    order_id: orderData.orderId,
    transaction_id: \`tx_\${orderData.orderId}\`,
    customer_id: orderData.customerId,
    amount: orderData.amount,
    currency: orderData.currency,
    timestamp: new Date().toISOString(),
  };

  // 2. Score transaction (returns in < 50ms)
  const result: ScoreResult = await client.scoreTransaction(payload);

  console.log(\`[ReturnGuard] Order \${result.order_id} scored: \${result.risk_score} (\${result.severity})\`);
  console.log(\`Recommended Policy Action: \${result.policy_action}\`);

  // 3. Merchant executes action - ReturnGuard NEVER calls PayPal or moves money
  switch (result.policy_action) {
    case "BLOCK":
      // Refuse return label generation or flag order for manual fraud review
      return { allow: false, reason: "Excessive return velocity or collusion pattern" };
    case "REVIEW":
      // Auto-opened investigation in ReturnGuard console
      return { allow: true, reviewPending: true };
    case "WARN":
    case "ALLOW":
    default:
      return { allow: true };
  }
}`;

  const pythonSnippet = `import os
import requests

API_URL = os.getenv("RETURNGUARD_API_URL", "http://127.0.0.1:8000")
API_KEY = os.getenv("RETURNGUARD_API_KEY", "rg_live_XXXXXXXX")

def score_order(order_id: str, customer_id: str, amount: float):
    response = requests.post(
        f"{API_URL}/v1/score",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "order_id": order_id,
            "transaction_id": f"tx_{order_id}",
            "customer_id": customer_id,
            "amount": amount,
            "currency": "USD",
        },
        timeout=2.0,
    )
    response.raise_for_status()
    decision = response.json()
    return decision["policy_action"], decision["risk_score"]`;

  const embedSnippet = `// Server route: mint short-lived embed token (Node.js/Next.js)
export async function GET() {
  const res = await fetch("http://127.0.0.1:8000/v1/auth/embed-tokens", {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${process.env.RETURNGUARD_API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sub: "analyst_sarah@merchant.com", ttl_seconds: 1800 }),
  });
  const { token } = await res.json();
  return Response.json({ token });
}

// Client component: render ReturnGuard console safely
import { ReturnGuardProvider, ReturnGuardDashboard } from "@returnguard/react";
import { ReturnGuardClient } from "@returnguard/sdk";

export function ReviewerPortal() {
  const client = new ReturnGuardClient({
    baseUrl: "http://127.0.0.1:8000",
    tokenProvider: async () => {
      const res = await fetch("/api/get-embed-token");
      const { token } = await res.json();
      return token;
    },
  });

  return (
    <ReturnGuardProvider client={client} defaultTheme="light">
      <ReturnGuardDashboard initialTab="overview" brandTitle="Risk Console" />
    </ReturnGuardProvider>
  );
}`;

  const curlSnippet = `curl -X POST http://127.0.0.1:8000/v1/score \\
  -H "Authorization: Bearer rg_live_XXXXXXXX" \\
  -H "Content-Type: application/json" \\
  -d '{
    "order_id": "ord_9011_live",
    "transaction_id": "tx_9011_live",
    "customer_id": "cust_481",
    "amount": 149.00,
    "currency": "USD"
  }'`;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--rg-bg-canvas)" }}>
      <Navbar currentPath="/docs/integrate" />

      <main style={{ flex: 1, padding: "48px 24px" }}>
        <div className="rg-landing-container" style={{ maxWidth: "960px" }}>
          {/* Header */}
          <div style={{ marginBottom: "40px" }}>
            <div className="rg-section-pill">DEVELOPER INTEGRATION GUIDE</div>
            <h1 style={{ fontSize: "36px", fontWeight: 800, color: "var(--rg-text-primary)", marginBottom: "12px" }}>
              Integrate ReturnGuard SDK
            </h1>
            <p style={{ fontSize: "16px", color: "var(--rg-text-secondary)", lineHeight: 1.6, margin: 0 }}>
              Connect your backend to ReturnGuard in under 15 minutes. Evaluate checkout telemetry, automate return gating, and render reviewer dashboards.
            </p>
          </div>

          {/* DOWNLOAD & VERIFICATION CARD */}
          <div
            className="rg-card"
            style={{
              background: "#ffffff",
              padding: "28px",
              border: "1px solid var(--rg-border-card)",
              boxShadow: "var(--rg-shadow-md)",
              marginBottom: "36px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>
                    Official SDK Package (@returnguard/sdk v0.1.0)
                  </h3>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 7px", borderRadius: "999px", background: "#dbeafe", color: "#1e40af" }}>
                    STANDALONE TARBALL
                  </span>
                </div>
                <p style={{ fontSize: "13.5px", color: "var(--rg-text-secondary)", margin: 0 }}>
                  Pre-compiled CommonJS and ESM package with complete TypeScript declarations. No public npm registry required.
                </p>
              </div>

              <a
                href={sdkTarballUrl}
                download="returnguard-sdk.tgz"
                className="rg-cta-button"
                style={{ padding: "9px 18px", fontSize: "13.5px" }}
              >
                <span>Download returnguard-sdk.tgz</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </a>
            </div>

            {/* Checksum & Installation Code */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#faf9f6", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--rg-border-card)", fontSize: "12.5px" }}>
                <div>
                  <strong style={{ color: "var(--rg-text-primary)" }}>SHA-256 Checksum:</strong>{" "}
                  <code style={{ fontFamily: "monospace", color: "#2563eb" }}>{sdkChecksum}</code>
                </div>
                <button
                  type="button"
                  onClick={() => copyCode(sdkChecksum, "checksum")}
                  style={{ background: "transparent", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer", fontSize: "12px" }}
                >
                  {copiedSection === "checksum" ? "Copied!" : "Copy Hash"}
                </button>
              </div>

              <div style={{ background: "#18181b", color: "#f4f4f5", borderRadius: "10px", padding: "16px", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderBottom: "1px solid #27272a", paddingBottom: "6px" }}>
                  <span style={{ fontSize: "11px", color: "#a1a1aa", fontFamily: "monospace" }}>Installation Command</span>
                  <button
                    type="button"
                    onClick={() => copyCode(installSnippet, "install")}
                    style={{ background: "transparent", border: "none", color: "#60a5fa", fontSize: "12px", cursor: "pointer" }}
                  >
                    {copiedSection === "install" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre style={{ margin: 0, fontSize: "13px", fontFamily: "monospace", overflowX: "auto" }}>
                  <code>{installSnippet}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* STEP 1: RUN ENGINE LOCALLY */}
          <div style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>
              1. Run ReturnGuard Locally with Docker
            </h2>
            <p style={{ fontSize: "14.5px", color: "var(--rg-text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
              ReturnGuard runs as a self-contained container. Configure <code style={{ fontFamily: "monospace" }}>RG_ADMIN_TOKEN</code> with at least 32 characters to enable administrative key management.
            </p>
            <div style={{ background: "#18181b", color: "#f4f4f5", borderRadius: "10px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", color: "#a1a1aa", fontFamily: "monospace" }}>Terminal / Bash</span>
                <button
                  type="button"
                  onClick={() => copyCode(dockerSnippet, "docker")}
                  style={{ background: "transparent", border: "none", color: "#60a5fa", fontSize: "12px", cursor: "pointer" }}
                >
                  {copiedSection === "docker" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre style={{ margin: 0, fontSize: "13px", fontFamily: "monospace", overflowX: "auto" }}>
                <code>{dockerSnippet}</code>
              </pre>
            </div>
          </div>

          {/* STEP 2: GENERATE API KEY */}
          <div style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>
              2. Generate a Merchant API Key
            </h2>
            <p style={{ fontSize: "14.5px", color: "var(--rg-text-secondary)", marginBottom: "12px", lineHeight: 1.6 }}>
              Open <Link href="/settings" style={{ color: "#2563eb", fontWeight: 700 }}>Settings &amp; Key Management</Link> to generate an API key for your merchant tenant. API keys start with prefix <code style={{ fontFamily: "monospace" }}>rg_live_</code>.
            </p>
            <div style={{ padding: "12px 16px", borderRadius: "8px", background: "#fef9c3", border: "1px solid #fde047", fontSize: "13px", color: "#854d0e" }}>
              <strong>Security Rule:</strong> Server API keys are strictly for backend communication. Never bundle them into browser or mobile apps.
            </div>
          </div>

          {/* STEP 3: SERVER-SIDE SCORING (NODE / TYPESCRIPT) */}
          <div style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>
              3. Server-Side Scoring (Node.js &amp; TypeScript)
            </h2>
            <p style={{ fontSize: "14.5px", color: "var(--rg-text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
              Evaluate orders upon checkout completion or return request initiation. The engine returns calibrated tiers (<code style={{ fontFamily: "monospace" }}>ALLOW</code>, <code style={{ fontFamily: "monospace" }}>WARN</code>, <code style={{ fontFamily: "monospace" }}>REVIEW</code>, <code style={{ fontFamily: "monospace" }}>BLOCK</code>).
            </p>
            <div style={{ background: "#18181b", color: "#f4f4f5", borderRadius: "10px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", color: "#a1a1aa", fontFamily: "monospace" }}>orderService.ts</span>
                <button
                  type="button"
                  onClick={() => copyCode(nodeSnippet, "node")}
                  style={{ background: "transparent", border: "none", color: "#60a5fa", fontSize: "12px", cursor: "pointer" }}
                >
                  {copiedSection === "node" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre style={{ margin: 0, fontSize: "13px", fontFamily: "monospace", overflowX: "auto" }}>
                <code>{nodeSnippet}</code>
              </pre>
            </div>
          </div>

          {/* STEP 4: BROWSER-SIDE CONSOLE EMBED */}
          <div style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>
              4. Safe Browser Embed (Zero Key Leakage)
            </h2>
            <p style={{ fontSize: "14.5px", color: "var(--rg-text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
              To display reviewer queues or customer dossiers within your merchant portal, mint a short-lived embed token on your backend and provide it to <code style={{ fontFamily: "monospace" }}>@returnguard/react</code>:
            </p>
            <div style={{ background: "#18181b", color: "#f4f4f5", borderRadius: "10px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", color: "#a1a1aa", fontFamily: "monospace" }}>portalEmbed.tsx</span>
                <button
                  type="button"
                  onClick={() => copyCode(embedSnippet, "embed")}
                  style={{ background: "transparent", border: "none", color: "#60a5fa", fontSize: "12px", cursor: "pointer" }}
                >
                  {copiedSection === "embed" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre style={{ margin: 0, fontSize: "13px", fontFamily: "monospace", overflowX: "auto" }}>
                <code>{embedSnippet}</code>
              </pre>
            </div>
          </div>

          {/* STEP 5: PYTHON BACKEND ALTERNATIVE */}
          <div style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>
              5. Python Alternative (requests / httpx)
            </h2>
            <p style={{ fontSize: "14.5px", color: "var(--rg-text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
              For Django, FastAPI, or Flask backends, call the HTTP REST API directly:
            </p>
            <div style={{ background: "#18181b", color: "#f4f4f5", borderRadius: "10px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", color: "#a1a1aa", fontFamily: "monospace" }}>risk_client.py</span>
                <button
                  type="button"
                  onClick={() => copyCode(pythonSnippet, "python")}
                  style={{ background: "transparent", border: "none", color: "#60a5fa", fontSize: "12px", cursor: "pointer" }}
                >
                  {copiedSection === "python" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre style={{ margin: 0, fontSize: "13px", fontFamily: "monospace", overflowX: "auto" }}>
                <code>{pythonSnippet}</code>
              </pre>
            </div>
          </div>

          {/* STEP 6: DIRECT CURL VERIFICATION */}
          <div style={{ marginBottom: "48px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>
              6. Direct Verification with cURL
            </h2>
            <p style={{ fontSize: "14.5px", color: "var(--rg-text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
              Verify your running instance and API key with a direct terminal request:
            </p>
            <div style={{ background: "#18181b", color: "#f4f4f5", borderRadius: "10px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", color: "#a1a1aa", fontFamily: "monospace" }}>curl</span>
                <button
                  type="button"
                  onClick={() => copyCode(curlSnippet, "curl")}
                  style={{ background: "transparent", border: "none", color: "#60a5fa", fontSize: "12px", cursor: "pointer" }}
                >
                  {copiedSection === "curl" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre style={{ margin: 0, fontSize: "13px", fontFamily: "monospace", overflowX: "auto" }}>
                <code>{curlSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

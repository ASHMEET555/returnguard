"use client";

import React, { useState, useEffect } from "react";

const steps = [
  {
    num: "01",
    tag: "INGESTION",
    title: "Event Telemetry Ingestion",
    desc: "Captures checkout, return request, shipping status, and device metadata over high-throughput REST or the @returnguard/sdk client in < 5ms.",
    details: [
      "Zero money-movement credentials required",
      "Point-in-time velocity and device ring calculations",
      "Strict merchant tenant isolation",
    ],
    codeSnippet: `// 1. Merchant backend notifies ReturnGuard
const decision = await client.score({
  transactionId: "tx_8f91c3",
  orderId: "ord_2026_9011",
  amount: 289.50,
  currency: "USD",
  customerId: "cust_772a",
  deviceFingerprint: "fp_90e3...",
});`,
  },
  {
    num: "02",
    tag: "INFERENCE",
    title: "Dual-Engine ML & SHAP Reasoning",
    desc: "Evaluates risk through hard deterministic rules and calibrated LightGBM binary classification with real-time TreeExplainer SHAP contributions.",
    details: [
      "Instant inference (< 50ms latency SLA)",
      "Exact feature attribution (top 5 positive & negative drivers)",
      "Strict non-interference with audit trails",
    ],
    codeSnippet: `// 2. Score output with explainability
{
  "risk_score": 0.874,
  "risk_tier": "CRITICAL",
  "recommended_action": "BLOCK",
  "shap_drivers": [
    { "feature": "return_velocity_7d", "impact": +0.34 },
    { "feature": "device_reuse_count", "impact": +0.28 }
  ]
}`,
  },
  {
    num: "03",
    tag: "ORCHESTRATION",
    title: "Policy & Reviewer Orchestration",
    desc: "Critical alerts auto-open structured investigations. Human risk reviewers access deep dossier analysis with advisory LLM narrative summaries.",
    details: [
      "Advisory-only LLM reasoning (never autonomous)",
      "Deterministic 7-state investigation machine",
      "Two-person signoff for high-value disputes",
    ],
    codeSnippet: `// 3. Reviewer Workflow & Audit State
{
  "investigation_id": "inv_c7809a",
  "state": "IN_REVIEW",
  "source": "AUTO_CRITICAL",
  "assigned_reviewer": "ops_jane@merchant.com",
  "llm_summary": "LLM assessment, advisory: High ring recurrence detected across 3 addresses."
}`,
  },
  {
    num: "04",
    tag: "DISPUTE DEFENSE",
    title: "Cryptographic Evidence Vault",
    desc: "Packages complete timeline, tracking records, and buyer communication into a SHA-256 tamper-evident packet ready for payment dispute submission.",
    details: [
      "SHA-256 sealed provenance manifest",
      "One-click PDF & JSON dispute bundle export",
      "ReturnGuard never calls PayPal: merchant submits directly",
    ],
    codeSnippet: `// 4. Evidence Package Sealed
{
  "evidence_id": "ev_4410cd",
  "status": "APPROVED",
  "sha256_seal": "e3b0c44298fc1c149afbf4c8996fb92427...",
  "dispute_ready": true,
  "export_format": "PDF_AND_JSON"
}`,
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="how-it-works" className="rg-section" style={{ backgroundColor: "var(--rg-bg-subtle)" }}>
      <div className="rg-landing-container">
        <div className="rg-section-header">
          <div className="rg-section-pill">Interactive Architecture</div>
          <h2 className="rg-section-title">How ReturnGuard Works</h2>
          <p className="rg-section-subtitle">
            From checkout telemetry to cryptographic dispute defense, ReturnGuard provides end-to-end intelligence while keeping the merchant in full control of money movement.
          </p>
        </div>

        {/* Step Selector Tabs (Butler / modern inspired) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            marginBottom: "36px",
          }}
        >
          {steps.map((s, idx) => {
            const isActive = activeStep === idx;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setActiveStep(idx)}
                style={{
                  textAlign: "left",
                  padding: "20px",
                  borderRadius: "16px",
                  background: isActive ? "#ffffff" : "#f0ede4",
                  border: isActive ? "2px solid #2563eb" : "1px solid var(--rg-border-card)",
                  boxShadow: isActive ? "var(--rg-shadow-md)" : "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: isActive ? "#2563eb" : "var(--rg-text-muted)" }}>
                    STEP {s.num}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      background: isActive ? "#dbeafe" : "#e5e2da",
                      color: isActive ? "#1e40af" : "var(--rg-text-secondary)",
                    }}
                  >
                    {s.tag}
                  </span>
                </div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--rg-text-primary)" }}>
                  {s.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Showcase Card */}
        <div
          className="rg-card"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "36px",
            padding: "36px",
            background: "#ffffff",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-block",
                fontSize: "12px",
                fontWeight: 700,
                color: "#2563eb",
                letterSpacing: "0.05em",
                marginBottom: "8px",
              }}
            >
              STEP {steps[activeStep].num} — {steps[activeStep].tag}
            </div>
            <h3 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "16px", color: "var(--rg-text-primary)" }}>
              {steps[activeStep].title}
            </h3>
            <p style={{ fontSize: "15.5px", color: "var(--rg-text-secondary)", lineHeight: 1.6, marginBottom: "24px" }}>
              {steps[activeStep].desc}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {steps[activeStep].details.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "var(--rg-text-primary)" }}>
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "#dcfce7",
                      color: "#166534",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </div>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "#18181b",
              color: "#f4f4f5",
              borderRadius: "14px",
              padding: "20px",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "12.5px",
              lineHeight: 1.55,
              overflowX: "auto",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", borderBottom: "1px solid #27272a", paddingBottom: "8px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#eab308", display: "inline-block" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              <span style={{ marginLeft: "8px", color: "#71717a", fontSize: "11px" }}>telemetry_payload.json</span>
            </div>
            <pre style={{ margin: 0 }}>
              <code>{steps[activeStep].codeSnippet}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

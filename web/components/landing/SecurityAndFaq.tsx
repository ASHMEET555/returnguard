"use client";

import React, { useState } from "react";
import Link from "next/link";

interface FAQItem {
  q: string;
  a: string;
}

const faqs: FAQItem[] = [
  {
    q: "Does ReturnGuard call PayPal, process payments, or move money?",
    a: "No. ReturnGuard never calls PayPal, never initiates refunds, and holds zero banking or payment credentials. ReturnGuard is purely an intelligence and evidence-generation layer. All financial execution is performed strictly by the merchant's existing payment workflows.",
  },
  {
    q: "How does ReturnGuard integrate with our e-commerce stack?",
    a: "Integration takes less than 30 minutes via the official @returnguard/sdk (Node.js/TypeScript) or Python client. When checkout completes or a return is initiated, your backend calls POST /v1/score to receive a calibrated risk score, recommended policy action, and SHAP feature drivers.",
  },
  {
    q: "Can ReturnGuard be self-hosted in our VPC or on-premise cloud?",
    a: "Yes. ReturnGuard runs as a self-contained, high-performance container with standard PostgreSQL or SQLite storage. It has zero external cloud phone-home requirements, ensuring full sovereign data control.",
  },
  {
    q: "Are the LLM investigation assessments autonomous?",
    a: "No. Every LLM summary is advisory only and explicitly watermarked 'LLM assessment, advisory'. All investigation state transitions and closures require explicit human reviewer rationale and recorded notes.",
  },
  {
    q: "What is the model accuracy on real-world transaction data?",
    a: "On external real payment fraud data (IEEE CIS benchmark), our LightGBM model reaches 0.8874 ROC-AUC with 79.80% recall and 6.31% precision. It operates as a high-recall filter for manual review queues (~1 fraud per 15 alerts), preventing silent leakages while ensuring zero arbitrary checkout blocking.",
  },
];

export function SecurityAndFaq() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* SECTION 8: SECURITY & TRUST ARCHITECTURE */}
      <section className="rg-section" style={{ backgroundColor: "#faf9f6", borderTop: "1px solid var(--rg-border-subtle)" }}>
        <div className="rg-landing-container">
          <div className="rg-section-header">
            <div className="rg-section-pill">Defense-in-Depth</div>
            <h2 className="rg-section-title">Cryptographic Security &amp; Isolation</h2>
            <p className="rg-section-subtitle">
              Built to withstand external audit, regulatory scrutiny, and adversarial tampering at every architectural boundary.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
              marginBottom: "48px",
            }}
          >
            <div className="rg-card" style={{ background: "#ffffff", padding: "24px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px", color: "var(--rg-text-primary)" }}>
                SHA-256 Provenance Chain
              </div>
              <p style={{ fontSize: "13.5px", color: "var(--rg-text-secondary)", lineHeight: 1.6 }}>
                Every score, decision, evidence approval, and review note forms an immutable, cryptographically chained audit row.
              </p>
            </div>

            <div className="rg-card" style={{ background: "#ffffff", padding: "24px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px", color: "var(--rg-text-primary)" }}>
                Zero Plaintext Key Storage
              </div>
              <p style={{ fontSize: "13.5px", color: "var(--rg-text-secondary)", lineHeight: 1.6 }}>
                API keys are shown strictly once upon generation. Only truncated prefixes and salted SHA-256 hashes are persisted in the database.
              </p>
            </div>

            <div className="rg-card" style={{ background: "#ffffff", padding: "24px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px", color: "var(--rg-text-primary)" }}>
                Timing-Attack Resistance
              </div>
              <p style={{ fontSize: "13.5px", color: "var(--rg-text-secondary)", lineHeight: 1.6 }}>
                All credential validations and token checks use constant-time cryptographic comparisons, eliminating side-channel leakage.
              </p>
            </div>

            <div className="rg-card" style={{ background: "#ffffff", padding: "24px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px", color: "var(--rg-text-primary)" }}>
                Scoped Embed Tokens
              </div>
              <p style={{ fontSize: "13.5px", color: "var(--rg-text-secondary)", lineHeight: 1.6 }}>
                Frontend consoles authenticate via short-lived (15m - 1hr) HMAC-signed JWTs, ensuring server credentials are never exposed in browser code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: FREQUENTLY ASKED QUESTIONS */}
      <section className="rg-section">
        <div className="rg-landing-container" style={{ maxWidth: "860px" }}>
          <div className="rg-section-header">
            <div className="rg-section-pill">Clarifications &amp; Boundaries</div>
            <h2 className="rg-section-title">Frequently Asked Questions</h2>
            <p className="rg-section-subtitle">
              Everything you need to know about ReturnGuard architecture, data safety, and integration boundaries.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {faqs.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  style={{
                    borderRadius: "14px",
                    border: "1px solid var(--rg-border-card)",
                    background: "#ffffff",
                    overflow: "hidden",
                    transition: "border-color 0.15s ease",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "20px 24px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "16px",
                    }}
                  >
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--rg-text-primary)" }}>
                      {f.q}
                    </span>
                    <span
                      style={{
                        fontSize: "20px",
                        fontWeight: 400,
                        color: "var(--rg-text-muted)",
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 24px 20px 24px", fontSize: "14.5px", color: "var(--rg-text-secondary)", lineHeight: 1.65 }}>
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 10: CALL TO ACTION & FOOTER */}
      <section
        style={{
          backgroundColor: "#18181b",
          color: "#f4f4f5",
          padding: "72px 0 36px 0",
          borderTop: "1px solid #27272a",
        }}
      >
        <div className="rg-landing-container">
          <div
            style={{
              textAlign: "center",
              maxWidth: "680px",
              margin: "0 auto 64px auto",
            }}
          >
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#ffffff", marginBottom: "16px" }}>
              Ready to Halt Return Abuse?
            </h2>
            <p style={{ fontSize: "16px", color: "#a1a1aa", marginBottom: "32px", lineHeight: 1.6 }}>
              Provision your merchant keys, integrate the TypeScript or Python SDK, and monitor fraud patterns with mathematical precision.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
              <Link
                href="/dashboard"
                style={{
                  padding: "12px 24px",
                  borderRadius: "10px",
                  background: "#2563eb",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "15px",
                }}
              >
                Launch Dashboard →
              </Link>
              <Link
                href="/docs/integrate"
                style={{
                  padding: "12px 24px",
                  borderRadius: "10px",
                  background: "#27272a",
                  color: "#fafafa",
                  fontWeight: 600,
                  fontSize: "15px",
                  border: "1px solid #3f3f46",
                }}
              >
                SDK Integration Guide
              </Link>
              <Link
                href="/settings"
                style={{
                  padding: "12px 24px",
                  borderRadius: "10px",
                  background: "#27272a",
                  color: "#fafafa",
                  fontWeight: 600,
                  fontSize: "15px",
                  border: "1px solid #3f3f46",
                }}
              >
                Manage API Keys
              </Link>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid #27272a",
              paddingTop: "32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
              fontSize: "13px",
              color: "#71717a",
            }}
          >
            <div>
              © 2026 ReturnGuard AI. All rights reserved. B2B payment intelligence engine.
            </div>
            <div style={{ display: "flex", gap: "20px" }}>
              <Link href="/docs/integrate" style={{ color: "#a1a1aa" }}>Documentation</Link>
              <Link href="/settings" style={{ color: "#a1a1aa" }}>Key Management</Link>
              <Link href="/dashboard" style={{ color: "#a1a1aa" }}>Console</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

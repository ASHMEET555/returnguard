"use client";

import React from "react";
import Link from "next/link";

export function HeroAndOverview() {
  return (
    <>
      {/* SECTION 1: HERO */}
      <section className="rg-section" style={{ paddingTop: "72px", paddingBottom: "56px" }}>
        <div className="rg-landing-container" style={{ textAlign: "center" }}>
          {/* Tagline Pill */}
          <div className="rg-section-pill">
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />
            <span>B2B Payment-Abuse Intelligence Engine</span>
          </div>

          <h1
            className="rg-section-title"
            style={{
              fontSize: "clamp(36px, 5.5vw, 56px)",
              maxWidth: "880px",
              margin: "0 auto 20px auto",
              lineHeight: 1.15,
            }}
          >
            Return Fraud Defense <br />
            <span style={{ color: "#2563eb" }}>Before Disputes Begin</span>
          </h1>

          <p
            className="rg-section-subtitle"
            style={{
              maxWidth: "680px",
              margin: "0 auto 36px auto",
              fontSize: "clamp(16px, 2vw, 18.5px)",
            }}
          >
            A high-recall risk engine that evaluates post-order telemetry, models returns abuse with explainable SHAP reasoning, and arms merchants with tamper-evident evidence packets.
          </p>

          {/* Action CTAs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
              flexWrap: "wrap",
              marginBottom: "48px",
            }}
          >
            <Link href="/dashboard" className="rg-cta-button" style={{ padding: "12px 26px", fontSize: "15px" }}>
              <span>Open Dashboard</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/docs/integrate"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 22px",
                fontSize: "15px",
                fontWeight: 600,
                borderRadius: "12px",
                backgroundColor: "#ffffff",
                color: "var(--rg-text-primary)",
                border: "1px solid var(--rg-border-card)",
                boxShadow: "var(--rg-shadow-sm)",
                minHeight: "44px",
                transition: "all 0.15s ease",
              }}
            >
              <span>Integrate SDK</span>
            </Link>
            <Link
              href="/settings"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 22px",
                fontSize: "15px",
                fontWeight: 600,
                borderRadius: "12px",
                backgroundColor: "#f4f2ec",
                color: "var(--rg-text-secondary)",
                border: "1px solid var(--rg-border-card)",
                minHeight: "44px",
                transition: "all 0.15s ease",
              }}
            >
              <span>Manage Keys</span>
            </Link>
          </div>

          {/* Trust & Boundary Badges */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "24px",
              flexWrap: "wrap",
              justifyContent: "center",
              padding: "12px 24px",
              borderRadius: "999px",
              background: "#ffffff",
              border: "1px solid var(--rg-border-card)",
              boxShadow: "var(--rg-shadow-sm)",
              fontSize: "13px",
              color: "var(--rg-text-secondary)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#059669", fontWeight: 700 }}>✓</span>
              <span>Zero money-movement credentials</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#059669", fontWeight: 700 }}>✓</span>
              <span>Never calls PayPal</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#059669", fontWeight: 700 }}>✓</span>
              <span>Advisory-only LLM reasoning</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: WHAT RETURNGUARD IS & IS NOT */}
      <section id="product" className="rg-section" style={{ borderTop: "1px solid var(--rg-border-subtle)" }}>
        <div className="rg-landing-container">
          <div className="rg-section-header">
            <div className="rg-section-pill">Core Architecture &amp; Boundaries</div>
            <h2 className="rg-section-title">What ReturnGuard Is (and Is Not)</h2>
            <p className="rg-section-subtitle">
              ReturnGuard is an intelligence and evidence layer. We believe risk engines must never take irreversible financial actions autonomously.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "24px",
            }}
          >
            {/* What It IS */}
            <div
              className="rg-card"
              style={{
                borderLeft: "4px solid #16a34a",
                background: "#ffffff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#dcfce7",
                    color: "#166534",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "14px",
                  }}
                >
                  ✓
                </span>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--rg-text-primary)" }}>
                  What ReturnGuard Is
                </h3>
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", fontSize: "14.5px", color: "var(--rg-text-secondary)" }}>
                <li style={{ display: "flex", gap: "10px" }}>
                  <strong style={{ color: "var(--rg-text-primary)" }}>• Pre-Dispute Risk Engine:</strong> Evaluates checkout velocity, return frequency, and device collusion in real time.
                </li>
                <li style={{ display: "flex", gap: "10px" }}>
                  <strong style={{ color: "var(--rg-text-primary)" }}>• Policy Recommendation:</strong> Outputs calibrated tiers (SAFE, WARN, REVIEW, BLOCK) with exact SHAP feature drivers.
                </li>
                <li style={{ display: "flex", gap: "10px" }}>
                  <strong style={{ color: "var(--rg-text-primary)" }}>• Reviewer Workspace:</strong> Equips human risk analysts with structured audit dossiers and advisory narrative summaries.
                </li>
                <li style={{ display: "flex", gap: "10px" }}>
                  <strong style={{ color: "var(--rg-text-primary)" }}>• Cryptographic Vault:</strong> Builds immutable, SHA-256 sealed evidence packets for payment representment.
                </li>
              </ul>
            </div>

            {/* What It IS NOT */}
            <div
              className="rg-card"
              style={{
                borderLeft: "4px solid #dc2626",
                background: "#ffffff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#fee2e2",
                    color: "#991b1b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "14px",
                  }}
                >
                  ✕
                </span>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--rg-text-primary)" }}>
                  What ReturnGuard Is Not
                </h3>
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", fontSize: "14.5px", color: "var(--rg-text-secondary)" }}>
                <li style={{ display: "flex", gap: "10px" }}>
                  <strong style={{ color: "var(--rg-text-primary)" }}>• Never Moves Money:</strong> ReturnGuard does not possess merchant banking, payout, or debit permissions.
                </li>
                <li style={{ display: "flex", gap: "10px" }}>
                  <strong style={{ color: "var(--rg-text-primary)" }}>• Never Calls PayPal:</strong> We never initiate refunds, reverse transactions, or communicate with payment gateways directly.
                </li>
                <li style={{ display: "flex", gap: "10px" }}>
                  <strong style={{ color: "var(--rg-text-primary)" }}>• Merchant Executes Actions:</strong> The merchant’s order-management system decides when and how to block or approve.
                </li>
                <li style={{ display: "flex", gap: "10px" }}>
                  <strong style={{ color: "var(--rg-text-primary)" }}>• No Autonomous LLM Closure:</strong> AI summaries are strictly advisory; all state closures require recorded reviewer rationale.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: THE PROBLEM */}
      <section className="rg-section" style={{ backgroundColor: "#f6f5ef" }}>
        <div className="rg-landing-container">
          <div className="rg-section-header">
            <div className="rg-section-pill">The Industry Crisis</div>
            <h2 className="rg-section-title">The $101B Return Fraud Gap</h2>
            <p className="rg-section-subtitle">
              E-commerce merchants face escalating losses from return abuse, wardrobing, and friendly fraud. Standard payment fraud tools only inspect the checkout moment.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            <div className="rg-card" style={{ background: "#ffffff", padding: "24px" }}>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#dc2626", marginBottom: "6px" }}>30-90 Days</div>
              <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>Dispute Latency Lag</div>
              <p style={{ fontSize: "13.5px", color: "var(--rg-text-secondary)", lineHeight: 1.5 }}>
                Chargebacks arrive months after return labels are consumed, when tracking telemetry is purged and warehouse staff have lost context.
              </p>
            </div>

            <div className="rg-card" style={{ background: "#ffffff", padding: "24px" }}>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#d97706", marginBottom: "6px" }}>13.7%</div>
              <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>Merchandise Lost to Abuse</div>
              <p style={{ fontSize: "13.5px", color: "var(--rg-text-secondary)", lineHeight: 1.5 }}>
                Wardrobing, empty box returns, and claimed non-receipt bleed operating margins while checkout fraud engines report clean scores.
              </p>
            </div>

            <div className="rg-card" style={{ background: "#ffffff", padding: "24px" }}>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#2563eb", marginBottom: "6px" }}>$15-$45</div>
              <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>Per-Dispute Bank Penalty</div>
              <p style={{ fontSize: "13.5px", color: "var(--rg-text-secondary)", lineHeight: 1.5 }}>
                Payment processors penalize merchants with excessive dispute fees and risk threshold reviews without proper representment proof.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

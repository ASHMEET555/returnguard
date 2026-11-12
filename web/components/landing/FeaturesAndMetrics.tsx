"use client";

import React, { useState } from "react";
import Link from "next/link";

export function FeaturesAndMetrics() {
  const [activeTab, setActiveTab] = useState<"queue" | "shap" | "evidence">("queue");

  return (
    <>
      {/* SECTION 5: FEATURES */}
      <section id="features" className="rg-section">
        <div className="rg-landing-container">
          <div className="rg-section-header">
            <div className="rg-section-pill">Engine Capabilities</div>
            <h2 className="rg-section-title">Built for High-Stakes Risk Operations</h2>
            <p className="rg-section-subtitle">
              Engineered for low latency, zero false-confidence, and strict evidentiary provenance across the entire return lifecycle.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "24px",
              marginBottom: "48px",
            }}
          >
            {/* Feature 1 */}
            <div className="rg-card" style={{ background: "#ffffff" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
                Sub-50ms Inference SLA
              </h3>
              <p style={{ fontSize: "14px", color: "var(--rg-text-secondary)", lineHeight: 1.6 }}>
                Real-time scoring at checkout or return initiation. Point-in-time velocity queries and graph ring checks run with zero DB locking.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rg-card" style={{ background: "#ffffff" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "#fef3c7",
                  color: "#d97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 20V10" />
                  <path d="M12 20V4" />
                  <path d="M6 20v-6" />
                </svg>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
                TreeExplainer SHAP Attributions
              </h3>
              <p style={{ fontSize: "14px", color: "var(--rg-text-secondary)", lineHeight: 1.6 }}>
                Every decision includes top feature contributions explaining why a return was flagged, eliminating black-box opacity for compliance.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rg-card" style={{ background: "#ffffff" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "#f3e8ff",
                  color: "#9333ea",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
                Advisory LLM Narrative Reasoning
              </h3>
              <p style={{ fontSize: "14px", color: "var(--rg-text-secondary)", lineHeight: 1.6 }}>
                Complex collusion dossiers are synthesized into concise analyst summaries, clearly labelled advisory to keep humans in control.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rg-card" style={{ background: "#ffffff" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "#ecfdf5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
                Cryptographic Evidence Sealing
              </h3>
              <p style={{ fontSize: "14px", color: "var(--rg-text-secondary)", lineHeight: 1.6 }}>
                Every document, tracking scan, and policy note is hashed with SHA-256 into a tamper-evident chain formatted for bank representment.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rg-card" style={{ background: "#ffffff" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "#fef2f2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
                Strict Multi-Tenant Isolation
              </h3>
              <p style={{ fontSize: "14px", color: "var(--rg-text-secondary)", lineHeight: 1.6 }}>
                Foreign keys and tenant boundaries enforced at database and API layers. Cross-tenant accesses reliably return 404.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rg-card" style={{ background: "#ffffff" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "#f1f5f9",
                  color: "#475569",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
                Zero Key-Leakage Embeds
              </h3>
              <p style={{ fontSize: "14px", color: "var(--rg-text-secondary)", lineHeight: 1.6 }}>
                Server API keys stay backend-only. Merchant frontend consoles authenticate through scoped, short-TTL embed JWTs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: PRODUCT SHOWCASE (INLINE INTERACTIVE CONSOLE) */}
      <section className="rg-section" style={{ backgroundColor: "#f6f5ef", borderTop: "1px solid var(--rg-border-subtle)" }}>
        <div className="rg-landing-container">
          <div className="rg-section-header">
            <div className="rg-section-pill">Interactive Preview</div>
            <h2 className="rg-section-title">The Reviewer Operations Console</h2>
            <p className="rg-section-subtitle">
              Review suspicious returns, inspect SHAP feature drivers, and seal evidence packages with an interface built for velocity.
            </p>
          </div>

          {/* Interactive Preview Container */}
          <div
            className="rg-card"
            style={{
              padding: 0,
              overflow: "hidden",
              border: "1px solid var(--rg-border-card)",
              boxShadow: "var(--rg-shadow-lg)",
              background: "#ffffff",
            }}
          >
            {/* Top Toolbar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px",
                borderBottom: "1px solid var(--rg-border-card)",
                background: "#faf9f6",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "15px", fontWeight: 700 }}>Invoices &amp; Reviews Queue</span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: "999px",
                    background: "#e2e8f0",
                    color: "#334155",
                  }}
                >
                  LIVE
                </span>
              </div>

              {/* View Switcher Tabs (Inspired by Butler UI) */}
              <div style={{ display: "flex", gap: "6px", background: "#f0ede4", padding: "4px", borderRadius: "10px" }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("queue")}
                  style={{
                    padding: "6px 14px",
                    fontSize: "13px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    border: "none",
                    background: activeTab === "queue" ? "#ffffff" : "transparent",
                    color: activeTab === "queue" ? "#1e293b" : "#64748b",
                    boxShadow: activeTab === "queue" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    cursor: "pointer",
                  }}
                >
                  Review Queue
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("shap")}
                  style={{
                    padding: "6px 14px",
                    fontSize: "13px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    border: "none",
                    background: activeTab === "shap" ? "#ffffff" : "transparent",
                    color: activeTab === "shap" ? "#1e293b" : "#64748b",
                    boxShadow: activeTab === "shap" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    cursor: "pointer",
                  }}
                >
                  SHAP Explainability
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("evidence")}
                  style={{
                    padding: "6px 14px",
                    fontSize: "13px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    border: "none",
                    background: activeTab === "evidence" ? "#ffffff" : "transparent",
                    color: activeTab === "evidence" ? "#1e293b" : "#64748b",
                    boxShadow: activeTab === "evidence" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    cursor: "pointer",
                  }}
                >
                  Evidence Vault
                </button>
              </div>

              <Link
                href="/dashboard"
                style={{
                  padding: "7px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: "8px",
                  background: "#2563eb",
                  color: "#ffffff",
                }}
              >
                Launch Full App →
              </Link>
            </div>

            {/* Inner Content Area */}
            <div style={{ padding: "28px" }}>
              {activeTab === "queue" && (
                <div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "24px",
                      marginBottom: "24px",
                    }}
                  >
                    {/* Stat Card 1 */}
                    <div style={{ padding: "20px", borderRadius: "14px", background: "#fbfaf8", border: "1px solid var(--rg-border-card)" }}>
                      <div style={{ fontSize: "13px", color: "var(--rg-text-muted)", marginBottom: "4px" }}>Last 30 Days (Total Reviews)</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                        <div style={{ fontSize: "28px", fontWeight: 800 }}>1,248</div>
                        <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>+12% auto-screened</span>
                      </div>
                      <div style={{ marginTop: "12px", display: "flex", gap: "8px", fontSize: "12px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a" }} /> High Conf (72%)
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#d97706" }} /> Waiting (28%)
                        </span>
                      </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div style={{ padding: "20px", borderRadius: "14px", background: "#fbfaf8", border: "1px solid var(--rg-border-card)" }}>
                      <div style={{ fontSize: "13px", color: "var(--rg-text-muted)", marginBottom: "4px" }}>Auto-Opened on Critical</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                        <div style={{ fontSize: "28px", fontWeight: 800, color: "#dc2626" }}>42</div>
                        <span style={{ fontSize: "12px", color: "var(--rg-text-muted)" }}>Source: AUTO_CRITICAL</span>
                      </div>
                      <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--rg-text-secondary)" }}>
                        100% isolated in separate DB transactions
                      </div>
                    </div>
                  </div>

                  {/* Clean Table Preview (Butler AI layout) */}
                  <div style={{ border: "1px solid var(--rg-border-card)", borderRadius: "12px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "#f8f7f2", borderBottom: "1px solid var(--rg-border-card)" }}>
                          <th style={{ padding: "12px 16px", fontWeight: 600 }}>Date</th>
                          <th style={{ padding: "12px 16px", fontWeight: 600 }}>Investigation ID</th>
                          <th style={{ padding: "12px 16px", fontWeight: 600 }}>Status</th>
                          <th style={{ padding: "12px 16px", fontWeight: 600 }}>Reviewer</th>
                          <th style={{ padding: "12px 16px", fontWeight: 600 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: "1px solid var(--rg-border-card)" }}>
                          <td style={{ padding: "12px 16px", color: "var(--rg-text-secondary)" }}>2026-11-10</td>
                          <td style={{ padding: "12px 16px", fontFamily: "monospace" }}>inv_81c9a10f</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 9px", borderRadius: "999px", background: "#dcfce7", color: "#166534", fontSize: "12px", fontWeight: 600 }}>
                              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#166534" }} />
                              CLOSED_APPROVED
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>analyst_david@merchant.com</td>
                          <td style={{ padding: "12px 16px" }}><Link href="/dashboard" style={{ color: "#2563eb", fontWeight: 600 }}>View Dossier →</Link></td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid var(--rg-border-card)" }}>
                          <td style={{ padding: "12px 16px", color: "var(--rg-text-secondary)" }}>2026-11-10</td>
                          <td style={{ padding: "12px 16px", fontFamily: "monospace" }}>inv_44b201cd</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 9px", borderRadius: "999px", background: "#fef9c3", color: "#854d0e", fontSize: "12px", fontWeight: 600 }}>
                              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#d97706" }} />
                              IN_REVIEW
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>sarah_risk@merchant.com</td>
                          <td style={{ padding: "12px 16px" }}><Link href="/dashboard" style={{ color: "#2563eb", fontWeight: 600 }}>Continue →</Link></td>
                        </tr>
                        <tr>
                          <td style={{ padding: "12px 16px", color: "var(--rg-text-secondary)" }}>2026-11-09</td>
                          <td style={{ padding: "12px 16px", fontFamily: "monospace" }}>inv_01f993bc</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 9px", borderRadius: "999px", background: "#fee2e2", color: "#991b1b", fontSize: "12px", fontWeight: 600 }}>
                              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#dc2626" }} />
                              CLOSED_REJECTED
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>system_auto_policy</td>
                          <td style={{ padding: "12px 16px" }}><Link href="/dashboard" style={{ color: "#2563eb", fontWeight: 600 }}>Audit Row →</Link></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "shap" && (
                <div>
                  <div style={{ marginBottom: "16px", fontSize: "14px", color: "var(--rg-text-secondary)" }}>
                    Top positive and negative SHAP feature contributions for transaction <code style={{ fontFamily: "monospace" }}>tx_9841_live</code> (Score: 0.884, Severity: CRITICAL):
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                        <span style={{ fontWeight: 600 }}>return_velocity_7d (+4 returns in 7 days)</span>
                        <span style={{ color: "#dc2626", fontWeight: 700 }}>+0.342 impact</span>
                      </div>
                      <div style={{ height: "8px", background: "#f0ede4", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: "75%", height: "100%", background: "#dc2626", borderRadius: "4px" }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                        <span style={{ fontWeight: 600 }}>device_collusion_cluster (3 accounts linked)</span>
                        <span style={{ color: "#dc2626", fontWeight: 700 }}>+0.281 impact</span>
                      </div>
                      <div style={{ height: "8px", background: "#f0ede4", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: "60%", height: "100%", background: "#ea580c", borderRadius: "4px" }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                        <span style={{ fontWeight: 600 }}>order_account_age_days (account age 380d)</span>
                        <span style={{ color: "#16a34a", fontWeight: 700 }}>-0.194 mitigating impact</span>
                      </div>
                      <div style={{ height: "8px", background: "#f0ede4", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: "45%", height: "100%", background: "#16a34a", borderRadius: "4px" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "evidence" && (
                <div style={{ padding: "16px", background: "#faf9f6", borderRadius: "12px", border: "1px solid var(--rg-border-card)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 700 }}>Evidence Packet #EP-2026-0914</div>
                      <div style={{ fontSize: "12px", color: "var(--rg-text-muted)" }}>Status: Cryptographically Sealed</div>
                    </div>
                    <span style={{ padding: "4px 10px", background: "#dcfce7", color: "#166534", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
                      SHA-256 VERIFIED
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--rg-text-secondary)", marginBottom: "12px" }}>
                    Provenance Hash: <code style={{ fontFamily: "monospace", fontSize: "12px", color: "var(--rg-text-primary)" }}>7a8b9f0c2e3d...4b8a1c0d5e</code>
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--rg-text-secondary)" }}>
                    Includes: Signed delivery receipt, carrier geo-scan at porch, return weight mismatch log, buyer chat transcripts.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: HONEST MODEL METRICS & REPRODUCTION */}
      <section className="rg-section">
        <div className="rg-landing-container">
          <div className="rg-section-header">
            <div className="rg-section-pill">Verifiable Benchmarks</div>
            <h2 className="rg-section-title">Model Performance &amp; Scientific Honesty</h2>
            <p className="rg-section-subtitle">
              We publish exact reproduced metrics from our test suites. We do not cherry-pick or disguise statistical limits.
            </p>
          </div>

          <div
            className="rg-card"
            style={{
              padding: 0,
              overflow: "hidden",
              background: "#ffffff",
              marginBottom: "24px",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8f7f2", borderBottom: "1px solid var(--rg-border-card)" }}>
                  <th style={{ padding: "16px 20px", fontWeight: 700 }}>Evaluation Pipeline</th>
                  <th style={{ padding: "16px 20px", fontWeight: 700 }}>ROC-AUC</th>
                  <th style={{ padding: "16px 20px", fontWeight: 700 }}>Precision</th>
                  <th style={{ padding: "16px 20px", fontWeight: 700 }}>Recall</th>
                  <th style={{ padding: "16px 20px", fontWeight: 700 }}>Reproduction Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--rg-border-card)" }}>
                  <td style={{ padding: "16px 20px", fontWeight: 600 }}>
                    Synthetic Return-Abuse Pipeline
                    <div style={{ fontSize: "12px", color: "var(--rg-text-muted)", fontWeight: 400 }}>PR-AUC: 0.9999 | F1: 0.9859</div>
                  </td>
                  <td style={{ padding: "16px 20px", fontFamily: "monospace", color: "#166534", fontWeight: 700 }}>0.9996</td>
                  <td style={{ padding: "16px 20px", fontFamily: "monospace" }}>98.60%</td>
                  <td style={{ padding: "16px 20px", fontFamily: "monospace" }}>98.58%</td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ padding: "3px 8px", background: "#dcfce7", color: "#166534", borderRadius: "6px", fontSize: "12px", fontWeight: 600 }}>
                      CI Verified
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "16px 20px", fontWeight: 600 }}>
                    IEEE CIS Fraud Benchmark
                    <div style={{ fontSize: "12px", color: "var(--rg-text-muted)", fontWeight: 400 }}>LightGBM on real payment data</div>
                  </td>
                  <td style={{ padding: "16px 20px", fontFamily: "monospace", color: "#1e40af", fontWeight: 700 }}>0.8874</td>
                  <td style={{ padding: "16px 20px", fontFamily: "monospace", color: "#9a3412", fontWeight: 700 }}>6.31%*</td>
                  <td style={{ padding: "16px 20px", fontFamily: "monospace" }}>79.80%</td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ padding: "3px 8px", background: "#dbeafe", color: "#1e40af", borderRadius: "6px", fontSize: "12px", fontWeight: 600 }}>
                      Reproduced External
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Honest Limits Note */}
          <div
            style={{
              padding: "18px 24px",
              borderRadius: "14px",
              background: "#fffbeb",
              border: "1px solid #fef3c7",
              fontSize: "13.5px",
              color: "#92400e",
              lineHeight: 1.6,
            }}
          >
            <strong>* Honest Limits Disclosure:</strong> On the real-world IEEE CIS dataset, precision is 6.31% at 79.80% recall.
            ReturnGuard is engineered as a high-recall filter for reviewer queues (~1 true fraud per 15 flags), not an automated blocker.
            Synthetic datasets provide clean geometric boundary proofs; real payment distributions carry extreme label noise and base rate skew.
          </div>
        </div>
      </section>
    </>
  );
}

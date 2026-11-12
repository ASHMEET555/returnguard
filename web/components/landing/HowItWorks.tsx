"use client";

import React from "react";
import styles from "./landing.module.css";

export function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Authorize & Ingress",
      desc: "Merchant intercepts customer checkout order. Payment details and telemetry pass through ReturnGuard before capture occurs.",
      tag: "API Ingress",
    },
    {
      num: "02",
      title: "Real-time Scoring & Rules",
      desc: "Deterministic rule chains and LightGBM model score transaction velocity, device fingerprints, and refund history under 50ms.",
      tag: "ML Inference",
    },
    {
      num: "03",
      title: "Decision & State Machine",
      desc: "Automated ALLOW, STEP_UP_VERIFY, or MANUAL_REVIEW decision. In-flight transactions are held or captured with full idempotency.",
      tag: "Decision Gate",
    },
    {
      num: "04",
      title: "Audit & Dispute Defense",
      desc: "Every step is journaled in an append-only timeline. If chargebacks occur, download one-click evidence packs for bank arbitration.",
      tag: "Evidence Pack",
    },
  ];

  return (
    <section id="how-it-works" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.pill}>Workflow Lifecycle</div>
          <h2 className={styles.title} style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>
            How ReturnGuard Operates
          </h2>
          <p className={styles.subtitle}>
            A fail-safe dual-path architecture combining lightning-fast automated scoring with human-in-the-loop review capabilities.
          </p>
        </div>

        <div className={styles.grid4}>
          {steps.map((step) => (
            <div key={step.num} className={styles.card} style={{ position: "relative" }}>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "800",
                  color: "#3b82f6",
                  fontFamily: "var(--rg-font-mono)",
                  marginBottom: "12px",
                  opacity: 0.9,
                }}
              >
                {step.num}
              </div>
              <span
                style={{
                  alignSelf: "flex-start",
                  fontSize: "11px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  background: "rgba(59, 130, 246, 0.12)",
                  color: "#60a5fa",
                  marginBottom: "14px",
                }}
              >
                {step.tag}
              </span>
              <h3 className={styles.cardTitle}>{step.title}</h3>
              <p className={styles.cardDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;

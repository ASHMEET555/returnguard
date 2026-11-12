"use client";

import React from "react";
import styles from "./landing.module.css";

export function FeaturesAndMetrics() {
  const features = [
    {
      title: "Real-time Policy Evaluation",
      desc: "Execute customized risk rules and thresholds per merchant tenant. Intercept high-velocity serial returners instantly.",
      badge: "Edge Execution",
    },
    {
      title: "Explainable Risk Factors",
      desc: "Visual SHAP waterfall contributions. Fraud investigators immediately understand the primary drivers behind each score.",
      badge: "XAI",
    },
    {
      title: "Isolated Tenant Architecture",
      desc: "Zero cross-tenant data leakage. Every transaction, model weight, and investigation log is strictly scoped by merchant ID.",
      badge: "Security",
    },
    {
      title: "Transactional Outbox & Replay",
      desc: "Guaranteed event delivery across networks. Leased worker claims, bounded backoffs, and deterministic idempotency keys.",
      badge: "Reliability",
    },
    {
      title: "AG Grid High-Volume Console",
      desc: "Enterprise AG Grid tables built for querying millions of transactions with sorting, filtering, and custom column views.",
      badge: "Dashboard",
    },
    {
      title: "Cryptographic Evidence Export",
      desc: "Download complete evidence dossiers in JSON or formatted Markdown for chargeback arbitration and legal proceedings.",
      badge: "Compliance",
    },
  ];

  return (
    <section id="features" className={styles.section} style={{ background: "rgba(15, 23, 42, 0.4)" }}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.pill}>Platform Highlights</div>
          <h2 className={styles.title} style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>
            Engineered for Fraud Operations
          </h2>
          <p className={styles.subtitle}>
            Everything merchants need to eliminate return abuse without degrading checkout conversion for good customers.
          </p>
        </div>

        <div className={styles.grid3}>
          {features.map((feat) => (
            <div key={feat.title} className={styles.card}>
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
                {feat.badge}
              </span>
              <h3 className={styles.cardTitle}>{feat.title}</h3>
              <p className={styles.cardDesc}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesAndMetrics;

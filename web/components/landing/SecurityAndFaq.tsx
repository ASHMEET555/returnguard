"use client";

import React, { useState } from "react";
import styles from "./landing.module.css";

export function SecurityAndFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does ReturnGuard integrate with existing checkout pipelines?",
      a: "ReturnGuard provides both an npm SDK (@returnguard/sdk) and REST APIs. You intercept the checkout authorization step, transmit order telemetry to /v1/score, and receive an instant decision (<50ms). If approved, capture funds; if high-risk, hold in the review queue.",
    },
    {
      q: "Is customer payment information stored in ReturnGuard?",
      a: "No. ReturnGuard never handles or persists raw credit card numbers or banking credentials. It operates strictly on pseudonymized hashes, tokenized IDs, and behavioral signals.",
    },
    {
      q: "Can multiple merchants share the same ReturnGuard deployment safely?",
      a: "Yes. ReturnGuard enforces strict tenant isolation at the database, repository, API, and outbox worker levels. Every query enforces WHERE merchant_id = :id, preventing cross-tenant inspection.",
    },
    {
      q: "How are API keys generated and validated?",
      a: "API keys are generated using cryptographically secure random bytes (secrets.token_urlsafe). Only a one-way SHA-256 hash is persisted in the database. When calls are made, keys are compared using constant-time digest comparison to prevent timing attacks.",
    },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.pill}>Security & Governance</div>
          <h2 className={styles.title} style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>
            Frequently Asked Questions
          </h2>
          <p className={styles.subtitle}>
            Enterprise-grade cryptographic protections, tenant isolation guarantees, and operational FAQs.
          </p>
        </div>

        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.q}
                className={styles.card}
                style={{ padding: "20px 24px", cursor: "pointer" }}
                onClick={() => setOpenIdx(isOpen ? null : idx)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: "16.5px", fontWeight: "700", color: "var(--rg-mkt-text-head)", margin: 0 }}>
                    {faq.q}
                  </h3>
                  <span style={{ fontSize: "20px", color: "#60a5fa", transform: isOpen ? "rotate(45deg)" : "none", transition: "transform 0.2s ease" }}>
                    +
                  </span>
                </div>
                {isOpen && (
                  <p style={{ marginTop: "14px", fontSize: "14.5px", color: "var(--rg-mkt-text-body)", lineHeight: 1.6, borderTop: "1px solid var(--rg-mkt-border)", paddingTop: "14px" }}>
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default SecurityAndFaq;

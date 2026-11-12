"use client";

import React from "react";
import Link from "next/link";
import styles from "./landing.module.css";

export function HeroAndOverview() {
  return (
    <>
      {/* SECTION 1: HERO */}
      <section className={styles.section} style={{ paddingTop: "72px", paddingBottom: "56px" }}>
        <div className={styles.container} style={{ textAlign: "center" }}>
          {/* Tagline Pill */}
          <div className={styles.pill}>
            <span className={styles.pillDot} />
            <span>B2B Payment-Abuse Intelligence Engine</span>
          </div>

          <h1 className={styles.title}>
            Return Fraud Defense <br />
            <span className={styles.titleGradient}>Before Disputes Begin</span>
          </h1>

          <p className={styles.subtitle}>
            A high-recall risk engine that evaluates post-order telemetry, models returns abuse with explainable SHAP reasoning, and arms merchants with tamper-evident evidence packets.
          </p>

          {/* Action CTAs */}
          <div className={styles.actions}>
            <Link href="/dashboard" className={styles.primaryBtn}>
              <span>Open Dashboard</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
            <Link href="/docs/integrate" className={styles.secondaryBtn}>
              <span>Integrate SDK</span>
            </Link>
            <Link href="/settings" className={styles.secondaryBtn}>
              <span>Manage API Keys</span>
            </Link>
          </div>

          {/* Stats Banner */}
          <div className={styles.grid4} style={{ marginTop: "40px" }}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>&lt; 50ms</div>
              <div className={styles.statLabel}>Risk Decision Latency</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>99.4%</div>
              <div className={styles.statLabel}>Audit Replay Consistency</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>100%</div>
              <div className={styles.statLabel}>Tenant-Isolated Scopes</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>SHA-256</div>
              <div className={styles.statLabel}>Hashed API Key Secrets</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: ARCHITECTURAL OVERVIEW */}
      <section id="product" className={styles.section} style={{ background: "rgba(15, 23, 42, 0.4)" }}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.pill}>System Capabilities</div>
            <h2 className={styles.title} style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>
              End-to-End Abuse Interception
            </h2>
            <p className={styles.subtitle}>
              Designed for high-volume merchants, platforms, and marketplaces operating multi-tenant payment pipelines.
            </p>
          </div>

          <div className={styles.grid3}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Payment Interception</h3>
              <p className={styles.cardDesc}>
                Real-time authorization hooks evaluate risk before funds capture. Synchronize with PayPal and major payment gateways using idempotent state machines.
              </p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>SHAP Explainability</h3>
              <p className={styles.cardDesc}>
                Every risk score is backed by exact feature contribution factors. Operators see why an order triggered a step-up or hold with zero black-box mystery.
              </p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Evidence Pack Generation</h3>
              <p className={styles.cardDesc}>
                Export cryptographic JSON and Markdown evidence packages for dispute arbitration, chargeback representations, and compliance filings.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default HeroAndOverview;

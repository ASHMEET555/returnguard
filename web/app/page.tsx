"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "../components/Navbar";

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar currentPath="/" />

      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <section className="rg-section" style={{ paddingTop: "80px", paddingBottom: "60px", textAlign: "center" }}>
          <div className="rg-landing-container">
            <div className="rg-section-pill">
              <span>B2B Payment-Abuse Intelligence</span>
            </div>
            <h1 className="rg-section-title" style={{ fontSize: "52px", maxWidth: "860px", margin: "0 auto 20px auto", lineHeight: 1.15 }}>
              Precision Fraud &amp; Abuse Defense for Modern Commerce
            </h1>
            <p className="rg-section-subtitle" style={{ maxWidth: "680px", margin: "0 auto 36px auto", fontSize: "19px" }}>
              Pre-dispute intelligence engine that evaluates transaction telemetry, models returns abuse, and coordinates reviewer decisions with full audit provenance.
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
              <Link href="/dashboard" className="rg-cta-button" style={{ padding: "12px 24px", fontSize: "16px" }}>
                <span>Open Dashboard</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                  padding: "12px 24px",
                  fontSize: "16px",
                  fontWeight: 600,
                  borderRadius: "12px",
                  backgroundColor: "#ffffff",
                  color: "var(--rg-text-primary)",
                  border: "1px solid var(--rg-border-card)",
                  boxShadow: "var(--rg-shadow-sm)",
                  minHeight: "44px",
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
                  padding: "12px 24px",
                  fontSize: "16px",
                  fontWeight: 600,
                  borderRadius: "12px",
                  backgroundColor: "#f4f2ec",
                  color: "var(--rg-text-secondary)",
                  border: "1px solid var(--rg-border-card)",
                  minHeight: "44px",
                }}
              >
                <span>Settings &amp; Keys</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

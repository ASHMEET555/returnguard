"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { ReturnGuardProvider, ReturnGuardDashboard } from "@returnguard/react";
import { ReturnGuardClient } from "@returnguard/sdk";

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

export default function DashboardPage() {
  const [token, setToken] = useState<string>("rg_embed_test_token");
  const [initialTab, setInitialTab] = useState<string>("overview");
  const [brandTitle, setBrandTitle] = useState<string>("ReturnGuard — ShopPoint");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("token");
      if (urlToken) {
        setToken(urlToken);
      }
      const urlTab = params.get("tab");
      if (urlTab) {
        setInitialTab(urlTab);
      }
      const urlBrand = params.get("brand");
      if (urlBrand) {
        setBrandTitle(urlBrand);
      }
    }
  }, []);

  const client = useMemo(() => {
    return new ReturnGuardClient({
      baseUrl: process.env.NEXT_PUBLIC_RETURNGUARD_API_URL || "http://127.0.0.1:8000",
      tokenProvider: async () => {
        return token;
      },
    });
  }, [token]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          background: "#18181b",
          color: "#fafafa",
          borderBottom: "1px solid #27272a",
          fontSize: "14px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 600,
              color: "#fafafa",
              textDecoration: "none",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#3b82f6",
              }}
            />
            ReturnGuard
          </Link>
          <span style={{ color: "#71717a" }}>|</span>
          <span style={{ color: "#a1a1aa", fontSize: "13px" }}>Operations Console</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link
            href="/settings"
            style={{
              color: "#d4d4d8",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              background: "#27272a",
              fontSize: "13px",
            }}
          >
            Settings & Keys
          </Link>
          <Link
            href="/docs/integrate"
            style={{
              color: "#d4d4d8",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              background: "#27272a",
              fontSize: "13px",
            }}
          >
            Integrate SDK
          </Link>
          <Link
            href="/"
            style={{
              color: "#93c5fd",
              textDecoration: "none",
              fontSize: "13px",
            }}
          >
            ← Back to Landing
          </Link>
        </div>
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ReturnGuardProvider client={client} defaultTheme="dark">
          <ReturnGuardDashboard key={token + initialTab} initialTab={initialTab} brandTitle={brandTitle} />
        </ReturnGuardProvider>
      </div>
    </div>
  );
}

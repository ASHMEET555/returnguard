"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { ReturnGuardProvider, ReturnGuardDashboard } from "@returnguard/react";
import { ReturnGuardClient } from "@returnguard/sdk";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { useAuth } from "../../lib/authContext";

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [token, setToken] = useState<string>("rg_embed_test_token");
  const [initialTab, setInitialTab] = useState<string>("overview");

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

  const brandTitle = user ? `ReturnGuard — ${user.merchant_name}` : "ReturnGuard Risk Operations";

  return (
    <ProtectedRoute>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 20px",
            background: "#090d16",
            color: "#fafafa",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
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
            <span style={{ color: "#a1a1aa", fontSize: "13px" }}>{user?.merchant_name || "Console"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link
              href="/settings"
              style={{
                color: "#d4d4d8",
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                background: "rgba(255, 255, 255, 0.06)",
                fontSize: "13px",
              }}
            >
              API Keys
            </Link>
            <Link
              href="/docs/integrate"
              style={{
                color: "#d4d4d8",
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                background: "rgba(255, 255, 255, 0.06)",
                fontSize: "13px",
              }}
            >
              Integrate SDK
            </Link>
            <button
              type="button"
              onClick={logout}
              style={{
                background: "rgba(239, 68, 68, 0.12)",
                color: "#f87171",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                borderRadius: "6px",
                padding: "5px 12px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Log out
            </button>
          </div>
        </header>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ReturnGuardProvider client={client} defaultTheme="dark">
            <ReturnGuardDashboard key={token + initialTab} initialTab={initialTab} brandTitle={brandTitle} />
          </ReturnGuardProvider>
        </div>
      </div>
    </ProtectedRoute>
  );
}

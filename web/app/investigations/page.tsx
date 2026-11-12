"use client";

import React, { useMemo } from "react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { ReturnGuardProvider, DashboardShell, InvestigationsPage } from "@returnguard/react";
import { ReturnGuardClient } from "@returnguard/sdk";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { useAuth } from "../../lib/authContext";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function InvestigationsRoute() {
  const { user } = useAuth();

  const client = useMemo(() => {
    return new ReturnGuardClient({
      baseUrl: process.env.NEXT_PUBLIC_RETURNGUARD_API_URL || "http://127.0.0.1:8000",
      tokenProvider: async () => {
        return "rg_embed_test_token";
      },
    });
  }, []);

  const brandTitle = user ? `ReturnGuard — ${user.merchant_name}` : "ReturnGuard";

  return (
    <ProtectedRoute>
      <ReturnGuardProvider client={client} defaultTheme="dark">
        <DashboardShell currentTab="investigations" onTabChange={() => {}} brandTitle={brandTitle}>
          <InvestigationsPage />
        </DashboardShell>
      </ReturnGuardProvider>
    </ProtectedRoute>
  );
}

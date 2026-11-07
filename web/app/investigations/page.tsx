"use client";

import React, { useMemo } from "react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { ReturnGuardProvider, DashboardShell, InvestigationsPage } from "@returnguard/react";
import { ReturnGuardClient } from "@returnguard/sdk";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function InvestigationsRoute() {
  const client = useMemo(() => {
    return new ReturnGuardClient({
      baseUrl: "http://127.0.0.1:8000",
      tokenProvider: async () => {
        return "rg_embed_test_token";
      },
    });
  }, []);

  return (
    <ReturnGuardProvider client={client} defaultTheme="dark">
      <DashboardShell currentTab="investigations" onTabChange={() => {}} brandTitle="ReturnGuard">
        <InvestigationsPage />
      </DashboardShell>
    </ReturnGuardProvider>
  );
}

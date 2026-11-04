"use client";

import React, { useMemo } from "react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { ReturnGuardProvider, ReturnGuardDashboard } from "@returnguard/react";
import { ReturnGuardClient } from "@returnguard/sdk";

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

export default function Home() {
  const client = useMemo(() => {
    return new ReturnGuardClient({
      baseUrl: "http://127.0.0.1:8000",
      tokenProvider: async () => {
        // Embed token or test token
        return "rg_embed_test_token";
      },
    });
  }, []);

  return (
    <ReturnGuardProvider client={client} defaultTheme="dark">
      <ReturnGuardDashboard brandTitle="ReturnGuard" />
    </ReturnGuardProvider>
  );
}

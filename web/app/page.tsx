"use client";

import React, { useMemo, useState, useEffect } from "react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { ReturnGuardProvider, ReturnGuardDashboard } from "@returnguard/react";
import { ReturnGuardClient } from "@returnguard/sdk";

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

export default function Home() {
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
    <ReturnGuardProvider client={client} defaultTheme="dark">
      <ReturnGuardDashboard key={token + initialTab} initialTab={initialTab} brandTitle={brandTitle} />
    </ReturnGuardProvider>
  );
}

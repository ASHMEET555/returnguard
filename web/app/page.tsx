"use client";

import React, { useMemo } from "react";
import { ReturnGuardProvider, ReturnGuardDashboard } from "@returnguard/react";
import { ReturnGuardClient } from "@returnguard/sdk";

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

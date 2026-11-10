"use client";

import React from "react";
import { Navbar } from "../components/Navbar";
import { HeroAndOverview } from "../components/landing/HeroAndOverview";
import { HowItWorks } from "../components/landing/HowItWorks";

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar currentPath="/" />
      <main style={{ flex: 1 }}>
        <HeroAndOverview />
        <HowItWorks />
      </main>
    </div>
  );
}

"use client";

import React from "react";
import { Navbar } from "../components/Navbar";
import { HeroAndOverview } from "../components/landing/HeroAndOverview";
import { HowItWorks } from "../components/landing/HowItWorks";
import { FeaturesAndMetrics } from "../components/landing/FeaturesAndMetrics";
import { SecurityAndFaq } from "../components/landing/SecurityAndFaq";

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar currentPath="/" />
      <main style={{ flex: 1 }}>
        <HeroAndOverview />
        <HowItWorks />
        <FeaturesAndMetrics />
        <SecurityAndFaq />
      </main>
    </div>
  );
}

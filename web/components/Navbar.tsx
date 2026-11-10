"use client";

import React, { useState } from "react";
import Link from "next/link";

interface NavbarProps {
  currentPath?: string;
}

export function Navbar({ currentPath }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="rg-navbar-wrapper">
      <div className="rg-navbar-container">
        {/* Logo and Brand */}
        <Link href="/" className="rg-brand-link">
          <div className="rg-brand-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <span className="rg-brand-name">ReturnGuard</span>
          <span className="rg-brand-badge">v0.1.0</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="rg-desktop-nav" aria-label="Main Navigation">
          <Link href="/#product" className="rg-nav-link">Product</Link>
          <Link href="/#how-it-works" className="rg-nav-link">How it works</Link>
          <Link href="/#features" className="rg-nav-link">Features</Link>
          <Link href="/docs/integrate" className={`rg-nav-link ${currentPath === "/docs/integrate" ? "active" : ""}`}>
            Integrate
          </Link>
          <Link href="/settings" className={`rg-nav-link ${currentPath === "/settings" ? "active" : ""}`}>
            Settings
          </Link>
        </nav>

        {/* Action Button & Mobile Toggle */}
        <div className="rg-nav-actions">
          <Link href="/dashboard" className="rg-cta-button">
            <span>Open dashboard</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>

          {/* Hamburger toggle for mobile with >= 44px target */}
          <button
            type="button"
            className="rg-mobile-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="rg-mobile-menu">
          <Link href="/#product" className="rg-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Product</Link>
          <Link href="/#how-it-works" className="rg-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>How it works</Link>
          <Link href="/#features" className="rg-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Features</Link>
          <Link href="/docs/integrate" className="rg-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Integrate SDK</Link>
          <Link href="/settings" className="rg-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Settings & Keys</Link>
          <Link href="/dashboard" className="rg-mobile-cta" onClick={() => setMobileMenuOpen(false)}>Open dashboard →</Link>
        </div>
      )}
    </header>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../lib/authContext";
import styles from "./Navbar.module.css";

interface NavbarProps {
  currentPath?: string;
}

export function Navbar({ currentPath }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className={styles.navbarWrapper}>
      <div className={styles.navbarContainer}>
        {/* Logo and Brand */}
        <Link href="/" className={styles.brandLink}>
          <div className={styles.brandLogoIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <span className={styles.brandName}>ReturnGuard</span>
          <span className={styles.brandBadge}>v0.1.0</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className={styles.desktopNav} aria-label="Main Navigation">
          <Link href="/#product" className={styles.navLink}>Product</Link>
          <Link href="/#how-it-works" className={styles.navLink}>How it works</Link>
          <Link href="/#features" className={styles.navLink}>Features</Link>
          <Link
            href="/docs/integrate"
            className={`${styles.navLink} ${currentPath === "/docs/integrate" ? styles.navLinkActive : ""}`}
          >
            Integrate
          </Link>
          {user && (
            <>
              <Link
                href="/dashboard"
                className={`${styles.navLink} ${currentPath === "/dashboard" ? styles.navLinkActive : ""}`}
              >
                Dashboard
              </Link>
              <Link
                href="/investigations"
                className={`${styles.navLink} ${currentPath === "/investigations" ? styles.navLinkActive : ""}`}
              >
                Investigations
              </Link>
              <Link
                href="/settings"
                className={`${styles.navLink} ${currentPath === "/settings" ? styles.navLinkActive : ""}`}
              >
                API Keys
              </Link>
            </>
          )}
        </nav>

        {/* Action Button & User Profile */}
        <div className={styles.navActions}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#ffffff" }}>
                  {user.full_name}
                </span>
                <span style={{ fontSize: "11px", color: "var(--rg-mkt-text-muted)" }}>
                  {user.merchant_name}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                style={{
                  background: "rgba(239, 68, 68, 0.12)",
                  color: "#f87171",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Log out
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Link
                href="/login"
                style={{
                  color: "var(--rg-mkt-text-body)",
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: "8px 12px",
                  textDecoration: "none",
                }}
              >
                Sign in
              </Link>
              <Link href="/register" className={styles.ctaButton}>
                <span>Get Started</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}

          {/* Hamburger toggle for mobile */}
          <button
            type="button"
            className={styles.mobileToggle}
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

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <Link href="/#product" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
            Product
          </Link>
          <Link href="/#how-it-works" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
            How it works
          </Link>
          <Link href="/#features" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
            Features
          </Link>
          <Link href="/docs/integrate" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
            Integrate
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </Link>
              <Link href="/investigations" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                Investigations
              </Link>
              <Link href="/settings" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                API Keys
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className={styles.mobileCta}
                style={{ background: "#dc2626" }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                Sign in
              </Link>
              <Link href="/register" className={styles.mobileCta} onClick={() => setMobileMenuOpen(false)}>
                Get Started →
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;

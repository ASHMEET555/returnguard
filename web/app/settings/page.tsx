"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "../../components/Navbar";

interface Merchant {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface APIKeyItem {
  key_id: string;
  merchant_id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  is_active: boolean;
}

interface RevealedKey {
  key_id: string;
  key: string;
  name: string;
  prefix: string;
}

export default function SettingsPage() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
  const [adminTokenInput, setAdminTokenInput] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>("");
  const [keys, setKeys] = useState<APIKeyItem[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState<boolean>(false);

  // Modals and dialogs
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newKeyName, setNewKeyName] = useState<string>("");
  const [isCreatingKey, setIsCreatingKey] = useState<boolean>(false);
  const [revealedKey, setRevealedKey] = useState<RevealedKey | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // Confirmations
  const [confirmRevokeKeyId, setConfirmRevokeKeyId] = useState<string | null>(null);
  const [confirmRotateKeyId, setConfirmRotateKeyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_RETURNGUARD_API_URL || "";

  // Check admin session on load
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/v1/admin/session`, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        setIsAdminAuthenticated(true);
      } else {
        setIsAdminAuthenticated(false);
      }
    } catch {
      setIsAdminAuthenticated(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Load merchants once authenticated
  const fetchMerchants = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/v1/admin/merchants`, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data: Merchant[] = await res.json();
        setMerchants(data);
        if (data.length > 0) {
          setSelectedMerchantId((prev) => prev || data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load merchants", err);
    }
  }, [baseUrl]);

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchMerchants();
    }
  }, [isAdminAuthenticated, fetchMerchants]);

  // Load keys for selected merchant
  const fetchKeys = useCallback(async (merchantId: string) => {
    if (!merchantId) return;
    setIsLoadingKeys(true);
    setActionError(null);
    try {
      const res = await fetch(`${baseUrl}/v1/admin/merchants/${merchantId}/api-keys`, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data: APIKeyItem[] = await res.json();
        setKeys(data);
      } else {
        setActionError("Failed to load keys for selected merchant.");
      }
    } catch {
      setActionError("Network error while loading keys.");
    } finally {
      setIsLoadingKeys(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    if (isAdminAuthenticated && selectedMerchantId) {
      fetchKeys(selectedMerchantId);
    }
  }, [isAdminAuthenticated, selectedMerchantId, fetchKeys]);

  // Admin login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminTokenInput.trim()) return;
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch(`${baseUrl}/v1/admin/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: adminTokenInput.trim() }),
      });

      if (res.ok) {
        setIsAdminAuthenticated(true);
        setAdminTokenInput(""); // Never retain token
      } else if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After") || "60";
        setLoginError(`Too many login attempts. Please try again in ${retryAfter} seconds.`);
      } else if (res.status === 401) {
        setLoginError("Invalid administrator credentials. Constant-time verification failed.");
      } else if (res.status === 503) {
        setLoginError("Admin access disabled. Set RG_ADMIN_TOKEN (>= 32 chars) in environment to enable.");
      } else {
        setLoginError(`Authentication failed with status ${res.status}.`);
      }
    } catch {
      setLoginError("Unable to reach the ReturnGuard API. Check that the service is running.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Admin logout handler
  const handleLogout = async () => {
    try {
      await fetch(`${baseUrl}/v1/admin/session`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch {
      // Ignore
    }
    setIsAdminAuthenticated(false);
    setKeys([]);
    setMerchants([]);
  };

  // Create API Key
  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetMerchantId = selectedMerchantId || (merchants.length > 0 ? merchants[0].id : "");
    if (!newKeyName.trim() || !targetMerchantId) return;
    setIsCreatingKey(true);
    setActionError(null);

    try {
      const res = await fetch(`${baseUrl}/v1/admin/merchants/${targetMerchantId}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setRevealedKey({
          key_id: data.key_id,
          key: data.key,
          name: data.name,
          prefix: data.key_prefix,
        });
        setShowCreateModal(false);
        setNewKeyName("");
        fetchKeys(targetMerchantId);
      } else {
        const err = await res.json().catch(() => ({}));
        setActionError(err.detail || "Failed to create API key.");
      }
    } catch {
      setActionError("Network error while creating key.");
    } finally {
      setIsCreatingKey(false);
    }
  };

  // Revoke Key
  const handleRevoke = async (keyId: string) => {
    setActionError(null);
    try {
      const res = await fetch(`${baseUrl}/v1/admin/api-keys/${keyId}/revoke`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setConfirmRevokeKeyId(null);
        fetchKeys(selectedMerchantId);
      } else {
        setActionError("Failed to revoke key.");
      }
    } catch {
      setActionError("Network error while revoking key.");
    }
  };

  // Rotate Key
  const handleRotate = async (keyId: string) => {
    setActionError(null);
    try {
      const res = await fetch(`${baseUrl}/v1/admin/api-keys/${keyId}/rotate`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setConfirmRotateKeyId(null);
        setRevealedKey({
          key_id: data.key_id,
          key: data.key,
          name: data.name,
          prefix: data.key_prefix,
        });
        fetchKeys(selectedMerchantId);
      } else {
        setActionError("Failed to rotate key.");
      }
    } catch {
      setActionError("Network error while rotating key.");
    }
  };

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--rg-bg-canvas)" }}>
      <Navbar currentPath="/settings" />

      <main style={{ flex: 1, padding: "40px 24px" }}>
        <div className="rg-landing-container" style={{ maxWidth: "1080px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--rg-text-primary)" }}>
                  Key Management &amp; Settings
                </h1>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "999px",
                    background: "#f0ede4",
                    border: "1px solid var(--rg-border-card)",
                    color: "var(--rg-text-secondary)",
                  }}
                >
                  ADMIN CONSOLE
                </span>
              </div>
              <p style={{ fontSize: "14.5px", color: "var(--rg-text-secondary)", margin: 0 }}>
                Provision, inspect, rotate, and revoke merchant API keys with zero plaintext persistence.
              </p>
            </div>

            {isAdminAuthenticated && (
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <Link
                  href="/docs/integrate"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: "#ffffff",
                    border: "1px solid var(--rg-border-card)",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "var(--rg-text-primary)",
                  }}
                >
                  Integration Guide →
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "#991b1b",
                    cursor: "pointer",
                  }}
                >
                  End Admin Session
                </button>
              </div>
            )}
          </div>

          {/* ADMIN LOGIN FORM (IF NOT AUTHENTICATED) */}
          {isAdminAuthenticated === false && (
            <div
              className="rg-card"
              style={{
                maxWidth: "520px",
                margin: "40px auto",
                padding: "36px",
                background: "#ffffff",
                boxShadow: "var(--rg-shadow-lg)",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: "#18181b",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px auto",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>
                  Administrator Authentication
                </h2>
                <p style={{ fontSize: "14px", color: "var(--rg-text-secondary)", lineHeight: 1.5 }}>
                  Enter your server <code style={{ fontFamily: "monospace" }}>RG_ADMIN_TOKEN</code> to access key management. Authentication sets an HTTP-only SameSite cookie.
                </p>
              </div>

              {loginError && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    color: "#991b1b",
                    fontSize: "13.5px",
                    marginBottom: "20px",
                    lineHeight: 1.5,
                  }}
                >
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label
                    htmlFor="admin-token"
                    style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "var(--rg-text-primary)" }}
                  >
                    Admin Secret Token
                  </label>
                  <input
                    id="admin-token"
                    type="password"
                    placeholder="Enter RG_ADMIN_TOKEN..."
                    value={adminTokenInput}
                    onChange={(e) => setAdminTokenInput(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: "10px",
                      border: "1px solid var(--rg-border-card)",
                      fontSize: "14px",
                      fontFamily: "monospace",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="rg-cta-button"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    padding: "12px",
                    fontSize: "15px",
                    cursor: isLoggingIn ? "not-allowed" : "pointer",
                    opacity: isLoggingIn ? 0.7 : 1,
                  }}
                >
                  {isLoggingIn ? "Verifying..." : "Authenticate Session"}
                </button>
              </form>

              <div style={{ marginTop: "20px", fontSize: "12px", color: "var(--rg-text-muted)", textAlign: "center", lineHeight: 1.5 }}>
                Protected by sliding-window rate limiting (5 attempts/min).
              </div>
            </div>
          )}

          {/* AUTHENTICATED KEY MANAGEMENT VIEW */}
          {isAdminAuthenticated && (
            <div>
              {actionError && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    color: "#991b1b",
                    fontSize: "13.5px",
                    marginBottom: "24px",
                  }}
                >
                  {actionError}
                </div>
              )}

              {/* Merchant Summary Bar (Inspired by Butler UI) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "20px",
                  marginBottom: "28px",
                }}
              >
                {/* Merchant Selector Card */}
                <div className="rg-card" style={{ background: "#ffffff", padding: "20px" }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--rg-text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                    Select Merchant Tenant
                  </div>
                  <select
                    value={selectedMerchantId}
                    onChange={(e) => setSelectedMerchantId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--rg-border-card)",
                      fontSize: "14px",
                      fontWeight: 600,
                      background: "#faf9f6",
                      color: "var(--rg-text-primary)",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tenant ID Quick Card */}
                {selectedMerchant && (
                  <div className="rg-card" style={{ background: "#ffffff", padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--rg-text-muted)", textTransform: "uppercase" }}>
                        Merchant ID
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedMerchant.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#2563eb",
                          cursor: "pointer",
                        }}
                      >
                        Copy ID
                      </button>
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: "15px", fontWeight: 700, color: "var(--rg-text-primary)" }}>
                      {selectedMerchant.id}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--rg-text-muted)", marginTop: "4px" }}>
                      Contact: {selectedMerchant.email}
                    </div>
                  </div>
                )}
              </div>

              {/* API Keys Table & Actions */}
              <div
                className="rg-card"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  background: "#ffffff",
                }}
              >
                {/* Header within card */}
                <div
                  style={{
                    padding: "20px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid var(--rg-border-card)",
                    background: "#faf9f6",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0 }}>
                      Active &amp; Historical API Keys
                    </h3>
                    <div style={{ fontSize: "12.5px", color: "var(--rg-text-muted)", marginTop: "2px" }}>
                      Only prefix &amp; SHA-256 hashes are stored. Plaintext keys are never viewable after initial creation.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="rg-cta-button"
                    style={{ padding: "8px 16px", fontSize: "13.5px" }}
                  >
                    <span>+ Generate API Key</span>
                  </button>
                </div>

                {/* Table */}
                {isLoadingKeys ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "var(--rg-text-muted)", fontSize: "14px" }}>
                    Loading keys...
                  </div>
                ) : keys.length === 0 ? (
                  <div style={{ padding: "48px 24px", textAlign: "center" }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "6px" }}>No API Keys Generated Yet</div>
                    <p style={{ fontSize: "13.5px", color: "var(--rg-text-secondary)", marginBottom: "16px" }}>
                      Generate an API key for {selectedMerchant?.name || "this merchant"} to begin scoring transactions.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      className="rg-cta-button"
                      style={{ padding: "8px 18px", fontSize: "13.5px" }}
                    >
                      Create First Key
                    </button>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "#f8f7f2", borderBottom: "1px solid var(--rg-border-card)" }}>
                          <th style={{ padding: "12px 18px", fontWeight: 700 }}>Label</th>
                          <th style={{ padding: "12px 18px", fontWeight: 700 }}>Key Prefix</th>
                          <th style={{ padding: "12px 18px", fontWeight: 700 }}>Created</th>
                          <th style={{ padding: "12px 18px", fontWeight: 700 }}>Status</th>
                          <th style={{ padding: "12px 18px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keys.map((k) => (
                          <tr key={k.key_id} style={{ borderBottom: "1px solid var(--rg-border-card)" }}>
                            <td style={{ padding: "14px 18px", fontWeight: 600 }}>
                              {k.name}
                              <div style={{ fontSize: "11px", color: "var(--rg-text-muted)", fontFamily: "monospace" }}>
                                {k.key_id}
                              </div>
                            </td>
                            <td style={{ padding: "14px 18px", fontFamily: "monospace", color: "var(--rg-text-secondary)" }}>
                              {k.key_prefix}
                            </td>
                            <td style={{ padding: "14px 18px", color: "var(--rg-text-secondary)", fontSize: "13px" }}>
                              {new Date(k.created_at).toLocaleDateString()}
                            </td>
                            <td style={{ padding: "14px 18px" }}>
                              {k.is_active ? (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "3px 9px",
                                    borderRadius: "999px",
                                    background: "#dcfce7",
                                    color: "#166534",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                  }}
                                >
                                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#166534" }} />
                                  Active
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "3px 9px",
                                    borderRadius: "999px",
                                    background: "#fee2e2",
                                    color: "#991b1b",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                  }}
                                >
                                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#dc2626" }} />
                                  Revoked
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "14px 18px", textAlign: "right" }}>
                              {k.is_active ? (
                                <div style={{ display: "inline-flex", gap: "8px" }}>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmRotateKeyId(k.key_id)}
                                    style={{
                                      padding: "6px 12px",
                                      borderRadius: "6px",
                                      background: "#f0ede4",
                                      border: "1px solid var(--rg-border-card)",
                                      fontSize: "12.5px",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                    }}
                                  >
                                    Rotate
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmRevokeKeyId(k.key_id)}
                                    style={{
                                      padding: "6px 12px",
                                      borderRadius: "6px",
                                      background: "#fee2e2",
                                      border: "1px solid #fca5a5",
                                      fontSize: "12.5px",
                                      fontWeight: 600,
                                      color: "#991b1b",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Revoke
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: "12px", color: "var(--rg-text-muted)" }}>Revoked</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination footer (Butler UI style) */}
                <div
                  style={{
                    padding: "12px 20px",
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: "12px",
                    fontSize: "12.5px",
                    color: "var(--rg-text-muted)",
                    background: "#faf9f6",
                    borderTop: "1px solid var(--rg-border-card)",
                  }}
                >
                  <span>1-{keys.length} of {keys.length}</span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button type="button" disabled style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--rg-border-card)", background: "#ffffff", opacity: 0.5, cursor: "not-allowed" }}>‹</button>
                    <button type="button" disabled style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--rg-border-card)", background: "#ffffff", opacity: 0.5, cursor: "not-allowed" }}>›</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CREATE KEY MODAL */}
          {showCreateModal && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 200,
                padding: "20px",
              }}
            >
              <div
                className="rg-card"
                style={{
                  width: "100%",
                  maxWidth: "460px",
                  background: "#ffffff",
                  padding: "28px",
                  boxShadow: "var(--rg-shadow-lg)",
                }}
              >
                <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>
                  Generate New API Key
                </h3>
                <p style={{ fontSize: "13.5px", color: "var(--rg-text-secondary)", marginBottom: "20px", lineHeight: 1.5 }}>
                  Provision an API key for <strong style={{ color: "var(--rg-text-primary)" }}>{selectedMerchant?.name}</strong>. The plaintext key will be shown strictly once.
                </p>

                <form onSubmit={handleCreateKey}>
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      htmlFor="key-label"
                      style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}
                    >
                      Key Label / Description
                    </label>
                    <input
                      id="key-label"
                      type="text"
                      placeholder="e.g. Production Shopify Checkout"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--rg-border-card)",
                        fontSize: "14px",
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "1px solid var(--rg-border-card)",
                        background: "#ffffff",
                        fontSize: "13.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingKey}
                      className="rg-cta-button"
                      style={{ padding: "8px 18px", fontSize: "13.5px" }}
                    >
                      {isCreatingKey ? "Generating..." : "Generate Key"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ONE-TIME KEY REVEAL MODAL */}
          {revealedKey && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 300,
                padding: "20px",
              }}
            >
              <div
                className="rg-card"
                style={{
                  width: "100%",
                  maxWidth: "540px",
                  background: "#ffffff",
                  padding: "32px",
                  boxShadow: "var(--rg-shadow-lg)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "#dcfce7",
                      color: "#166534",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "18px",
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>API Key Generated</h3>
                    <div style={{ fontSize: "13px", color: "var(--rg-text-muted)" }}>Label: {revealedKey.name}</div>
                  </div>
                </div>

                {/* Explicit Security Warning Banner */}
                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius: "10px",
                    background: "#fffbeb",
                    border: "1px solid #fef3c7",
                    color: "#92400e",
                    fontSize: "13.5px",
                    lineHeight: 1.55,
                    marginBottom: "20px",
                  }}
                >
                  <strong>Copy this key now.</strong> You will not be able to see it again. Never commit it to version control or bundle it in client code.
                </div>

                {/* Key Display & Copy Button */}
                <div
                  style={{
                    background: "#18181b",
                    color: "#60a5fa",
                    padding: "16px",
                    borderRadius: "10px",
                    fontFamily: "monospace",
                    fontSize: "13.5px",
                    wordBreak: "break-all",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "24px",
                  }}
                >
                  <span>{revealedKey.key}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(revealedKey.key)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: copiedKey ? "#166534" : "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    {copiedKey ? "Copied!" : "Copy Key"}
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setRevealedKey(null);
                      setCopiedKey(false);
                    }}
                    className="rg-cta-button"
                    style={{ padding: "9px 24px" }}
                  >
                    I have safely copied my key
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONFIRM REVOKE DIALOG */}
          {confirmRevokeKeyId && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 200,
                padding: "20px",
              }}
            >
              <div
                className="rg-card"
                style={{
                  width: "100%",
                  maxWidth: "440px",
                  background: "#ffffff",
                  padding: "28px",
                }}
              >
                <h3 style={{ fontSize: "19px", fontWeight: 800, marginBottom: "12px", color: "#dc2626" }}>
                  Revoke API Key?
                </h3>
                <p style={{ fontSize: "14px", color: "var(--rg-text-secondary)", lineHeight: 1.5, marginBottom: "20px" }}>
                  Revoking this key immediately blocks all score requests using it. This cannot be undone.
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setConfirmRevokeKeyId(null)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "1px solid var(--rg-border-card)",
                      background: "#ffffff",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRevoke(confirmRevokeKeyId)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      background: "#dc2626",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Revoke Immediately
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONFIRM ROTATE DIALOG */}
          {confirmRotateKeyId && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 200,
                padding: "20px",
              }}
            >
              <div
                className="rg-card"
                style={{
                  width: "100%",
                  maxWidth: "440px",
                  background: "#ffffff",
                  padding: "28px",
                }}
              >
                <h3 style={{ fontSize: "19px", fontWeight: 800, marginBottom: "12px", color: "var(--rg-text-primary)" }}>
                  Rotate API Key?
                </h3>
                <p style={{ fontSize: "14px", color: "var(--rg-text-secondary)", lineHeight: 1.5, marginBottom: "20px" }}>
                  Rotating creates a new key and immediately revokes the current one in a single atomic transaction.
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setConfirmRotateKeyId(null)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "1px solid var(--rg-border-card)",
                      background: "#ffffff",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRotate(confirmRotateKeyId)}
                    className="rg-cta-button"
                    style={{ padding: "8px 18px", fontSize: "13.5px" }}
                  >
                    Rotate &amp; Generate New
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

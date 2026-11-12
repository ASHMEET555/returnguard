"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "../../components/Navbar";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { useAuth } from "../../lib/authContext";
import styles from "./settings.module.css";

interface APIKeyItem {
  key_id: string;
  merchant_id: string;
  name: string;
  environment: string;
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
  environment: string;
  key_prefix: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<APIKeyItem[]>([]);
  const [loadingKeys, setLoadingKeys] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Creation modal state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newKeyName, setNewKeyName] = useState<string>("");
  const [newKeyEnv, setNewKeyEnv] = useState<string>("live");
  const [creatingKey, setCreatingKey] = useState<boolean>(false);
  const [revealedKey, setRevealedKey] = useState<RevealedKey | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // Confirmation dialogs
  const [confirmRevokeKeyId, setConfirmRevokeKeyId] = useState<string | null>(null);
  const [confirmRotateKeyId, setConfirmRotateKeyId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const baseUrl = process.env.NEXT_PUBLIC_RETURNGUARD_API_URL || "http://127.0.0.1:8000";

  const fetchKeys = useCallback(async () => {
    setLoadingKeys(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl}/v1/merchant/api-keys`, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || "Failed to load API keys.");
      }
    } catch {
      setError("Network error while connecting to ReturnGuard API.");
    } finally {
      setLoadingKeys(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    if (user) {
      fetchKeys();
    }
  }, [user, fetchKeys]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setCreatingKey(true);
    try {
      const res = await fetch(`${baseUrl}/v1/merchant/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newKeyName.trim(),
          environment: newKeyEnv,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRevealedKey(data);
        setShowCreateModal(false);
        setNewKeyName("");
        fetchKeys();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || "Failed to generate API key.");
      }
    } catch {
      setError("Network error while creating API key.");
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${baseUrl}/v1/merchant/api-keys/${keyId}/revoke`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setConfirmRevokeKeyId(null);
        fetchKeys();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || "Failed to revoke API key.");
      }
    } catch {
      setError("Network error while revoking API key.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRotateKey = async (keyId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${baseUrl}/v1/merchant/api-keys/${keyId}/rotate`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setRevealedKey(data);
        setConfirmRotateKeyId(null);
        fetchKeys();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || "Failed to rotate API key.");
      }
    } catch {
      setError("Network error while rotating API key.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <ProtectedRoute>
      <div className={styles.settingsWrapper}>
        <Navbar currentPath="/settings" />
        <main className={styles.mainContainer}>
          {/* Header section */}
          <div className={styles.header}>
            <div>
              <div className={styles.orgBadge}>
                Organization: <strong>{user?.merchant_name}</strong> ({user?.merchant_id})
              </div>
              <h1 className={styles.title}>API Key Credentials</h1>
              <p className={styles.subtitle}>
                Manage high-entropy Bearer credentials for server-to-server risk evaluations with ReturnGuard.
              </p>
            </div>
            <button
              type="button"
              className={styles.createBtn}
              onClick={() => setShowCreateModal(true)}
            >
              + Create New API Key
            </button>
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          {/* Keys Table Container */}
          <div className={styles.tableCard}>
            {loadingKeys ? (
              <div className={styles.emptyState}>Loading organization credentials...</div>
            ) : keys.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>No API Keys Generated</h3>
                <p>Create an API key to connect your payment pipeline or e-commerce store.</p>
                <button
                  type="button"
                  className={styles.createBtn}
                  style={{ marginTop: "16px" }}
                  onClick={() => setShowCreateModal(true)}
                >
                  Create API Key
                </button>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Key Name</th>
                    <th>Environment</th>
                    <th>Key Prefix</th>
                    <th>Created</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => (
                    <tr key={k.key_id}>
                      <td style={{ fontWeight: 600 }}>{k.name}</td>
                      <td>
                        <span className={k.environment === "live" ? styles.badgeLive : styles.badgeTest}>
                          {k.environment}
                        </span>
                      </td>
                      <td>
                        <span className={styles.monoPrefix}>{k.key_prefix}</span>
                      </td>
                      <td>{new Date(k.created_at).toLocaleDateString()}</td>
                      <td>
                        {k.is_active ? (
                          <span className={styles.statusActive}>● Active</span>
                        ) : (
                          <span className={styles.statusRevoked}>● Revoked</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {k.is_active && (
                          <div style={{ display: "inline-flex", gap: "8px" }}>
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => setConfirmRotateKeyId(k.key_id)}
                            >
                              Rotate
                            </button>
                            <button
                              type="button"
                              className={styles.revokeBtn}
                              onClick={() => setConfirmRevokeKeyId(k.key_id)}
                            >
                              Revoke
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>

        {/* Modal: Create API Key */}
        {showCreateModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalCard}>
              <h3 className={styles.modalTitle}>Create New API Key</h3>
              <p className={styles.modalSubtitle}>
                This key will be scoped strictly to <strong>{user?.merchant_name}</strong>.
              </p>
              <form onSubmit={handleCreateKey} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label className={styles.modalLabel}>Key Name / Description</label>
                  <input
                    type="text"
                    required
                    className={styles.modalInput}
                    placeholder="e.g. Production ShopPoint Gateway"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <div>
                  <label className={styles.modalLabel}>Environment</label>
                  <select
                    className={styles.modalInput}
                    value={newKeyEnv}
                    onChange={(e) => setNewKeyEnv(e.target.value)}
                  >
                    <option value="live">Live (rg_live_...)</option>
                    <option value="test">Test (rg_test_...)</option>
                  </select>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingKey}
                    className={styles.createBtn}
                  >
                    {creatingKey ? "Generating..." : "Generate Secret Key"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: One-Time Key Reveal Dialog */}
        {revealedKey && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalCard} style={{ maxWidth: "560px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#10b981", marginBottom: "8px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <h3 className={styles.modalTitle} style={{ margin: 0 }}>API Key Generated Successfully</h3>
              </div>
              <div className={styles.warningBox}>
                <strong>Important:</strong> This secret will never be displayed again. Please copy and store it in your backend environment variables immediately.
              </div>
              <div style={{ marginTop: "16px" }}>
                <label className={styles.modalLabel}>{revealedKey.name} ({revealedKey.environment})</label>
                <div className={styles.revealRow}>
                  <input
                    type="text"
                    readOnly
                    className={styles.revealInput}
                    value={revealedKey.key}
                  />
                  <button
                    type="button"
                    className={styles.copyBtn}
                    onClick={() => handleCopy(revealedKey.key)}
                  >
                    {copiedKey ? "Copied! ✓" : "Copy Secret"}
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                <button
                  type="button"
                  className={styles.createBtn}
                  onClick={() => setRevealedKey(null)}
                >
                  I have saved this secret
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirm Revoke */}
        {confirmRevokeKeyId && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalCard}>
              <h3 className={styles.modalTitle} style={{ color: "#f87171" }}>Revoke API Key?</h3>
              <p className={styles.modalSubtitle}>
                Any server or client using this credential will immediately receive <strong>401 Unauthorized</strong>. This action is permanent and cannot be undone.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setConfirmRevokeKeyId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  className={styles.revokeBtn}
                  style={{ padding: "8px 16px" }}
                  onClick={() => handleRevokeKey(confirmRevokeKeyId)}
                >
                  {actionLoading ? "Revoking..." : "Confirm Revocation"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirm Rotate */}
        {confirmRotateKeyId && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalCard}>
              <h3 className={styles.modalTitle}>Rotate API Key?</h3>
              <p className={styles.modalSubtitle}>
                Rotating will atomically invalidate the current key and generate a fresh secret for the same name and organization.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setConfirmRotateKeyId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  className={styles.createBtn}
                  onClick={() => handleRotateKey(confirmRotateKeyId)}
                >
                  {actionLoading ? "Rotating..." : "Rotate Key Now"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useCustomers, useCustomerProfile } from '../hooks';
import { RiskBadge } from './RiskBadge';
import { CloseIcon, RefreshIcon, ChevronRightIcon } from './icons';

export const CustomersPage: React.FC = () => {
  const { items, loading, error, hasMore, nextPage, refetch } = useCustomers(50);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const { profile, loading: profileLoading, error: profileError } = useCustomerProfile(selectedCustomerId);

  const [copiedId, setCopiedId] = useState<boolean>(false);

  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Store trigger element when drawer opens and focus close button
  useEffect(() => {
    if (selectedCustomerId) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;

      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [selectedCustomerId]);

  // Restore focus safely on unmount or close
  const restoreFocus = useCallback(() => {
    const el = previousActiveElementRef.current;
    if (el && typeof el.focus === 'function' && document.contains(el)) {
      el.focus();
    }
  }, []);

  const handleClose = useCallback(() => {
    restoreFocus();
    setSelectedCustomerId(null);
  }, [restoreFocus]);

  // Focus trap and Escape key handler
  useEffect(() => {
    if (!selectedCustomerId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === 'Tab') {
        const container = drawerRef.current;
        if (!container) return;

        const focusableElements = container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCustomerId, handleClose]);

  // Copy customer ID handler
  const handleCopyId = useCallback((id: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(id).then(() => {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 1500);
      }).catch(() => {});
    }
  }, []);

  // Format date helper
  const formatDate = useCallback((isoString?: string | null): string => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  }, []);

  // Compute Transaction Outcome Breakdown
  const outcomeBreakdown = useMemo(() => {
    if (!profile || !profile.order_history || profile.order_history.length === 0) {
      return null;
    }
    const total = profile.order_history.length;
    let allowCount = 0;
    let reviewCount = 0;
    let blockCount = 0;
    let unscoredCount = 0;

    profile.order_history.forEach((ord) => {
      const action = (ord.policy_action || '').toUpperCase();
      if (action === 'ALLOW') allowCount++;
      else if (action === 'REVIEW') reviewCount++;
      else if (action === 'BLOCK') blockCount++;
      else unscoredCount++;
    });

    return {
      total,
      allow: { count: allowCount, pct: ((allowCount / total) * 100).toFixed(1) },
      review: { count: reviewCount, pct: ((reviewCount / total) * 100).toFixed(1) },
      block: { count: blockCount, pct: ((blockCount / total) * 100).toFixed(1) },
      unscored: { count: unscoredCount, pct: ((unscoredCount / total) * 100).toFixed(1) },
    };
  }, [profile]);

  // Compute Customer Lifecycle Timeline
  const timelineEvents = useMemo(() => {
    if (!profile) return [];
    const events: Array<{
      id: string;
      date: Date;
      timestamp: string;
      title: string;
      desc: string;
      dotColor: string;
    }> = [];

    if (profile.created_at) {
      const d = new Date(profile.created_at);
      if (!isNaN(d.getTime())) {
        events.push({
          id: `account-${profile.customer_id}`,
          date: d,
          timestamp: profile.created_at,
          title: 'Account created',
          desc: `Customer registered on platform (${profile.customer_id})`,
          dotColor: 'var(--rg-low-text)',
        });
      }
    }

    (profile.linked_devices || []).forEach((dev, idx) => {
      if (dev.created_at) {
        const d = new Date(dev.created_at);
        if (!isNaN(d.getTime())) {
          events.push({
            id: `dev-${dev.id || idx}`,
            date: d,
            timestamp: dev.created_at,
            title: 'Device linked',
            desc: `Hash: ${dev.device_hash.slice(0, 16)}...${dev.ip_address ? ` • IP: ${dev.ip_address}` : ''}`,
            dotColor: 'var(--rg-accent)',
          });
        }
      }
    });

    (profile.linked_addresses || []).forEach((addr, idx) => {
      if (addr.created_at) {
        const d = new Date(addr.created_at);
        if (!isNaN(d.getTime())) {
          events.push({
            id: `addr-${addr.id || idx}`,
            date: d,
            timestamp: addr.created_at,
            title: 'Address added',
            desc: `${addr.city}, ${addr.state} ${addr.pincode} (${addr.country})`,
            dotColor: 'var(--rg-accent)',
          });
        }
      }
    });

    (profile.order_history || []).forEach((ord, idx) => {
      if (ord.order_time) {
        const d = new Date(ord.order_time);
        if (!isNaN(d.getTime())) {
          const action = (ord.policy_action || '').toUpperCase();
          const dotColor = action === 'BLOCK'
            ? 'var(--rg-high-text)'
            : action === 'REVIEW'
            ? 'var(--rg-med-text)'
            : 'var(--rg-low-text)';
          events.push({
            id: `ord-${ord.order_id || idx}`,
            date: d,
            timestamp: ord.order_time,
            title: 'Order recorded',
            desc: `Order ${ord.order_id} • ${ord.currency} ${ord.order_value.toFixed(2)}${ord.policy_action ? ` • Policy: ${ord.policy_action}` : ''}`,
            dotColor,
          });
        }
      }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime() || a.id.localeCompare(b.id));
  }, [profile]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 6px 0', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Customer Risk Directory
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--rg-text-secondary)', lineHeight: 1.5 }}>
          Tenant-scoped customer profiles, linked hardware devices, physical delivery locations, and order risk history.
        </p>
      </div>

      {/* Loading State */}
      {loading && items.length === 0 && (
        <div className="rg-loading-state" role="status" aria-live="polite">
          Loading customer directory...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rg-error-state" role="alert">
          <h4>Failed to load customer directory</h4>
          <p>{error.message}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rg-retry-btn"
          >
            <RefreshIcon size={14} aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && items.length === 0 && (
        <div className="rg-empty-state" role="status">
          <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: 'var(--rg-text-primary)' }}>
            No customer records found.
          </p>
          <span style={{ fontSize: 13, color: 'var(--rg-text-muted)' }}>
            New customer profiles will automatically appear here once transactions are evaluated.
          </span>
        </div>
      )}

      {/* Customer Card Grid */}
      {items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {items.map((cust) => {
            const isSelected = selectedCustomerId === cust.customer_id;
            return (
              <div
                key={cust.customer_id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`Customer ${cust.customer_id}, maximum risk score ${(cust.max_risk_score * 100).toFixed(0)}`}
                className={`rg-customer-card ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedCustomerId(cust.customer_id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedCustomerId(cust.customer_id);
                  }
                }}
              >
                <div className="rg-customer-card-header">
                  <span className="rg-customer-id">{cust.customer_id}</span>
                  <RiskBadge score={cust.max_risk_score} />
                </div>
                <div className="rg-customer-card-body">
                  <div className="rg-customer-contact-line">
                    <span className="rg-customer-contact-label">Email:</span>
                    <span className="rg-customer-contact-val">{cust.email}</span>
                  </div>
                  <div className="rg-customer-contact-line">
                    <span className="rg-customer-contact-label">Phone:</span>
                    <span className="rg-customer-contact-val">{cust.phone}</span>
                  </div>
                </div>
                <div className="rg-customer-card-footer">
                  <span>
                    Orders: <strong className="rg-customer-metric-val">{cust.total_orders}</strong>
                  </span>
                  <span>
                    Spent: <strong className="rg-customer-metric-val">{cust.currency} {cust.total_spent.toFixed(2)}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {hasMore && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            type="button"
            onClick={nextPage}
            disabled={loading}
            className="rg-load-more-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span>{loading ? 'Loading...' : 'Load More Customers'}</span>
            {!loading && <ChevronRightIcon size={14} aria-hidden="true" />}
          </button>
        </div>
      )}

      {/* Selected Customer Profile Slide Sheet (Accessible Drawer) */}
      {selectedCustomerId && (
        <div
          className="rg-drawer-overlay"
          onClick={handleClose}
          aria-hidden="true"
        >
          <aside
            ref={drawerRef}
            className="rg-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-drawer-title"
            aria-describedby="customer-drawer-desc"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="rg-drawer-header">
              <div className="rg-drawer-header-info">
                <span id="customer-drawer-desc" className="rg-drawer-subtitle">
                  Customer Risk Profile
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <h3 id="customer-drawer-title" className="rg-drawer-title">
                    {selectedCustomerId}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCopyId(selectedCustomerId)}
                    className="rg-copy-btn"
                    aria-label={`Copy customer ID ${selectedCustomerId}`}
                    title="Copy Customer ID"
                  >
                    <span>{copiedId ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={handleClose}
                className="rg-drawer-close-btn"
                aria-label="Close customer profile drawer"
              >
                <CloseIcon size={14} aria-hidden="true" />
                <span>Close</span>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="rg-drawer-body">
              {profileLoading && (
                <div className="rg-drawer-section" role="status" aria-live="polite">
                  <div style={{ color: 'var(--rg-text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                    Loading profile details...
                  </div>
                </div>
              )}

              {profileError && (
                <div className="rg-error-state" role="alert" style={{ margin: 16 }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: 14, fontWeight: 600 }}>Failed to load profile</h4>
                  <p style={{ margin: 0, fontSize: 13 }}>{profileError.message}</p>
                </div>
              )}

              {profile && (
                <>
                  {/* 1. Customer Identity & Risk Summary */}
                  <div className="rg-drawer-section">
                    <div className="rg-drawer-section-title">Customer Risk Summary</div>
                    <div className="rg-context-grid">
                      <div className="rg-context-item">
                        <span className="rg-context-label">Masked Email</span>
                        <span className="rg-context-value">{profile.email}</span>
                      </div>
                      <div className="rg-context-item">
                        <span className="rg-context-label">Masked Phone</span>
                        <span className="rg-context-value">{profile.phone}</span>
                      </div>
                      <div className="rg-context-item">
                        <span className="rg-context-label">Registration Date</span>
                        <span className="rg-context-value">{formatDate(profile.created_at)}</span>
                      </div>
                      <div className="rg-context-item">
                        <span className="rg-context-label">Lifetime Orders</span>
                        <span className="rg-context-value">{profile.total_orders}</span>
                      </div>
                      <div className="rg-context-item">
                        <span className="rg-context-label">Lifetime Spend</span>
                        <span className="rg-context-value">{profile.currency} {profile.total_spent.toFixed(2)}</span>
                      </div>
                      <div className="rg-context-item">
                        <span className="rg-context-label">Max Risk Score</span>
                        <div style={{ marginTop: 2 }}>
                          <RiskBadge score={profile.max_risk_score} />
                        </div>
                      </div>
                      <div className="rg-context-item">
                        <span className="rg-context-label">Average Risk Score</span>
                        <span className="rg-context-value">
                          {(profile.average_risk_score * 100).toFixed(0)} <span style={{ fontSize: 11, color: 'var(--rg-text-muted)' }}>/ 100</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Transaction Outcome Breakdown */}
                  {outcomeBreakdown && (
                    <div className="rg-drawer-section">
                      <div className="rg-drawer-section-title">Transaction Outcome Breakdown</div>
                      <div style={{ fontSize: 12, color: 'var(--rg-text-secondary)', marginBottom: 8 }}>
                        Policy decision distribution across {outcomeBreakdown.total} evaluated order{outcomeBreakdown.total > 1 ? 's' : ''}:
                      </div>

                      {/* Segmented Horizontal Meter Bar */}
                      <div className="rg-segmented-bar" role="progressbar" aria-label="Transaction outcome distribution">
                        {parseFloat(outcomeBreakdown.allow.pct) > 0 && (
                          <div
                            className="rg-segmented-bar-segment"
                            style={{
                              width: `${outcomeBreakdown.allow.pct}%`,
                              backgroundColor: 'var(--rg-low-text)',
                            }}
                            title={`ALLOW: ${outcomeBreakdown.allow.count} (${outcomeBreakdown.allow.pct}%)`}
                          />
                        )}
                        {parseFloat(outcomeBreakdown.review.pct) > 0 && (
                          <div
                            className="rg-segmented-bar-segment"
                            style={{
                              width: `${outcomeBreakdown.review.pct}%`,
                              backgroundColor: 'var(--rg-med-text)',
                            }}
                            title={`REVIEW: ${outcomeBreakdown.review.count} (${outcomeBreakdown.review.pct}%)`}
                          />
                        )}
                        {parseFloat(outcomeBreakdown.block.pct) > 0 && (
                          <div
                            className="rg-segmented-bar-segment"
                            style={{
                              width: `${outcomeBreakdown.block.pct}%`,
                              backgroundColor: 'var(--rg-high-text)',
                            }}
                            title={`BLOCK: ${outcomeBreakdown.block.count} (${outcomeBreakdown.block.pct}%)`}
                          />
                        )}
                        {parseFloat(outcomeBreakdown.unscored.pct) > 0 && (
                          <div
                            className="rg-segmented-bar-segment"
                            style={{
                              width: `${outcomeBreakdown.unscored.pct}%`,
                              backgroundColor: 'var(--rg-text-muted)',
                            }}
                            title={`UNSCORED: ${outcomeBreakdown.unscored.count} (${outcomeBreakdown.unscored.pct}%)`}
                          />
                        )}
                      </div>

                      {/* Outcome Breakdown Legend */}
                      <div className="rg-outcome-legend">
                        <div className="rg-outcome-legend-item">
                          <span className="rg-risk-dot rg-risk-dot-low" aria-hidden="true" />
                          <span>ALLOW: <strong>{outcomeBreakdown.allow.count}</strong> ({outcomeBreakdown.allow.pct}%)</span>
                        </div>
                        <div className="rg-outcome-legend-item">
                          <span className="rg-risk-dot rg-risk-dot-medium" aria-hidden="true" />
                          <span>REVIEW: <strong>{outcomeBreakdown.review.count}</strong> ({outcomeBreakdown.review.pct}%)</span>
                        </div>
                        <div className="rg-outcome-legend-item">
                          <span className="rg-risk-dot rg-risk-dot-high" aria-hidden="true" />
                          <span>BLOCK: <strong>{outcomeBreakdown.block.count}</strong> ({outcomeBreakdown.block.pct}%)</span>
                        </div>
                        {parseFloat(outcomeBreakdown.unscored.pct) > 0 && (
                          <div className="rg-outcome-legend-item">
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rg-text-muted)', display: 'inline-block' }} aria-hidden="true" />
                            <span>UNSCORED: <strong>{outcomeBreakdown.unscored.count}</strong> ({outcomeBreakdown.unscored.pct}%)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. Risk & Activity Exposure */}
                  <div className="rg-drawer-section">
                    <div className="rg-drawer-section-title">Risk & Activity Exposure</div>
                    {profile.order_history.length >= 2 ? (
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--rg-text-secondary)', marginBottom: 12 }}>
                          Chronological risk score progression across {profile.order_history.length} orders:
                        </div>
                        <svg width="100%" height="48" viewBox="0 0 240 48" style={{ overflow: 'visible' }}>
                          {/* Sparkline curve */}
                          <polyline
                            fill="none"
                            stroke="var(--rg-accent)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={profile.order_history
                              .slice()
                              .reverse()
                              .map((o, i, arr) => {
                                const x = arr.length > 1 ? (i / (arr.length - 1)) * 220 + 10 : 120;
                                const score = o.risk_score ?? profile.average_risk_score ?? 0;
                                const y = 40 - Math.min(Math.max(score, 0), 1) * 32;
                                return `${x},${y}`;
                              })
                              .join(' ')}
                          />
                          {profile.order_history
                            .slice()
                            .reverse()
                            .map((o, i, arr) => {
                              const x = arr.length > 1 ? (i / (arr.length - 1)) * 220 + 10 : 120;
                              const score = o.risk_score ?? profile.average_risk_score ?? 0;
                              const y = 40 - Math.min(Math.max(score, 0), 1) * 32;
                              return (
                                <circle
                                  key={o.order_id || i}
                                  cx={x}
                                  cy={y}
                                  r="3"
                                  fill="var(--rg-bg-card)"
                                  stroke="var(--rg-accent)"
                                  strokeWidth="2"
                                />
                              );
                            })}
                        </svg>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: 'var(--rg-text-secondary)' }}>Current Risk Assessment</span>
                          <RiskBadge score={profile.max_risk_score} />
                        </div>
                        <div className="rg-meter-track">
                          <div
                            className="rg-meter-fill"
                            style={{
                              width: `${Math.min(Math.max(profile.max_risk_score * 100, 2), 100)}%`,
                              backgroundColor: profile.max_risk_score >= 0.8
                                ? 'var(--rg-crit-text)'
                                : profile.max_risk_score >= 0.4
                                ? 'var(--rg-high-text)'
                                : profile.max_risk_score >= 0.15
                                ? 'var(--rg-med-text)'
                                : 'var(--rg-low-text)',
                            }}
                          />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--rg-text-muted)' }}>
                          Single recorded evaluation on record ({profile.total_orders} order). Historical score trend activates once multiple orders accumulate.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. Hardware & Network Footprint */}
                  <div className="rg-drawer-section">
                    <div className="rg-drawer-section-title">
                      Hardware & Network Footprint ({profile.linked_devices.length})
                    </div>
                    {profile.linked_devices.length === 0 ? (
                      <div className="rg-drawer-empty-text">No linked device fingerprints recorded.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {profile.linked_devices.map((d) => (
                          <div
                            key={d.id}
                            style={{
                              background: 'var(--rg-bg-tertiary)',
                              border: '1px solid var(--rg-border)',
                              borderRadius: 'var(--rg-radius-sm)',
                              padding: '10px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className="rg-font-mono" style={{ fontSize: 12, fontWeight: 500, color: 'var(--rg-text-primary)' }}>
                                {d.device_hash.slice(0, 20)}...
                              </span>
                              <span className="rg-meta-tag" style={{ fontSize: 11 }}>
                                IP: {d.ip_address || 'Unrecorded'}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--rg-text-muted)' }}>
                              Registered: {formatDate(d.created_at)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 5. Delivery Locations */}
                  <div className="rg-drawer-section">
                    <div className="rg-drawer-section-title">
                      Delivery Locations ({profile.linked_addresses.length})
                    </div>
                    {profile.linked_addresses.length === 0 ? (
                      <div className="rg-drawer-empty-text">No normalized addresses on file.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {profile.linked_addresses.map((a) => (
                          <div
                            key={a.id}
                            style={{
                              background: 'var(--rg-bg-tertiary)',
                              border: '1px solid var(--rg-border)',
                              borderRadius: 'var(--rg-radius-sm)',
                              padding: '10px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4,
                            }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--rg-text-primary)' }}>
                              {a.city}, {a.state} {a.pincode}
                            </span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--rg-text-muted)' }}>
                              <span>Country: {a.country}</span>
                              <span>Added: {formatDate(a.created_at)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 6. Customer Lifecycle Timeline */}
                  <div className="rg-drawer-section">
                    <div className="rg-drawer-section-title">Customer Lifecycle Timeline</div>
                    {timelineEvents.length === 0 ? (
                      <div className="rg-drawer-empty-text">No lifecycle event records available.</div>
                    ) : (
                      <div className="rg-timeline-list">
                        {timelineEvents.map((ev) => (
                          <div key={ev.id} className="rg-timeline-item">
                            <div className="rg-timeline-connector" />
                            <div
                              className="rg-timeline-dot"
                              style={{ borderColor: ev.dotColor }}
                              aria-hidden="true"
                            />
                            <div className="rg-timeline-title">{ev.title}</div>
                            <div className="rg-timeline-desc">{ev.desc}</div>
                            <div className="rg-timeline-time">{formatDate(ev.timestamp)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 7. Order History & Decisions */}
                  <div className="rg-drawer-section">
                    <div className="rg-drawer-section-title">
                      Order History & Decisions ({profile.order_history.length})
                    </div>
                    {profile.order_history.length === 0 ? (
                      <div className="rg-drawer-empty-text">No orders on record.</div>
                    ) : (
                      <div className="rg-table-container">
                        <table className="rg-data-table">
                          <thead>
                            <tr>
                              <th>Order ID</th>
                              <th>Channel</th>
                              <th>Amount</th>
                              <th>Status</th>
                              <th>Decision</th>
                              <th>Order Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profile.order_history.map((ord) => (
                              <tr key={ord.order_id}>
                                <td className="rg-font-mono" style={{ fontWeight: 600 }}>{ord.order_id}</td>
                                <td>
                                  <span className="rg-meta-tag" style={{ textTransform: 'uppercase' }}>
                                    {ord.channel}
                                  </span>
                                </td>
                                <td>
                                  <strong>{ord.currency} {ord.order_value.toFixed(2)}</strong>
                                </td>
                                <td>
                                  <span style={{ fontSize: 12, color: 'var(--rg-text-secondary)', textTransform: 'capitalize' }}>
                                    {ord.status}
                                  </span>
                                </td>
                                <td>
                                  {ord.risk_score !== null && ord.risk_score !== undefined ? (
                                    <RiskBadge score={ord.risk_score} action={ord.policy_action || undefined} />
                                  ) : (
                                    <span style={{ fontSize: 12, color: 'var(--rg-text-muted)' }}>Unscored</span>
                                  )}
                                </td>
                                <td style={{ fontSize: 12, color: 'var(--rg-text-muted)' }}>
                                  {formatDate(ord.order_time)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

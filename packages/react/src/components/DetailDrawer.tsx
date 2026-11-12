import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useTransactionRisk } from '../hooks';
import { RiskBadge } from './RiskBadge';
import { CloseIcon } from './icons';
import {
  formatCurrency,
  addMonetaryAmounts,
  multiplyMonetaryAmount,
  parseMonetaryDecimal,
  decimalToString,
} from '../utils/currency';

/**
 * Line item representation for order context and risk evaluation.
 *
 * MONETARY INPUT CONTRACT:
 * Decimal strings (e.g. "0.10", "99999999999999999.99") are canonical.
 * Non-integer numbers (e.g. 0.1, 1.005) and unsafe integers (> MAX_SAFE_INTEGER) are rejected.
 * Safe integer numbers (e.g. 100, 0) are accepted for backward compatibility.
 */
export interface PaymentLineItem {
  id?: string;
  name?: string;
  description?: string;
  quantity: number | string;
  unit_price: number | string;
  total_amount?: number | string;
  sku?: string;
  currency?: string;
}

export interface DetailDrawerProps {
  decisionId: string | null;
  onClose: () => void;
  lineItems?: PaymentLineItem[];
  currency?: string;
}

/**
 * Modernized accessible investigation sheet for transaction details, payment line items,
 * and SHAP explanations. Conforms to Stripe + Linear visual standards with strict keyboard
 * focus trapping, accessible ARIA dialog roles, focus restoration, and dynamic currency presentation.
 */
export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  decisionId,
  onClose,
  lineItems: propLineItems,
  currency: propCurrency,
}) => {
  const { decision, audit, loading, error } = useTransactionRisk(decisionId);

  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Store trigger element when drawer opens
  useEffect(() => {
    if (decisionId) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;

      // Focus the close button once drawer renders
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [decisionId]);

  // Restore focus safely on unmount or close
  const restoreFocus = useCallback(() => {
    const el = previousActiveElementRef.current;
    if (el && typeof el.focus === 'function' && document.contains(el)) {
      el.focus();
    }
  }, []);

  const handleClose = useCallback(() => {
    restoreFocus();
    onClose();
  }, [onClose, restoreFocus]);

  // Focus trap and ESC key handler
  useEffect(() => {
    if (!decisionId) return;

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
  }, [decisionId, handleClose]);

  // Resolve transaction currency
  const resolvedCurrency = useMemo(() => {
    if (propCurrency) return propCurrency;
    if (audit?.data?.order_summary?.currency) return audit.data.order_summary.currency;
    if (decision?.currency) return decision.currency;
    return null;
  }, [propCurrency, audit, decision]);

  // Resolve line items
  const resolvedLineItems: PaymentLineItem[] = useMemo(() => {
    if (propLineItems && propLineItems.length > 0) return propLineItems;
    if (audit?.data?.line_items && audit.data.line_items.length > 0) {
      return audit.data.line_items;
    }
    if (audit?.data?.order_summary?.items && audit.data.order_summary.items.length > 0) {
      return audit.data.order_summary.items;
    }
    if (decision?.line_items && decision.line_items.length > 0) {
      return decision.line_items;
    }
    if (decision?.order_summary?.items && decision.order_summary.items.length > 0) {
      return decision.order_summary.items;
    }
    return [];
  }, [propLineItems, audit, decision]);

  // Check if items contain conflicting/mixed currencies
  const hasMixedCurrencies = useMemo(() => {
    if (resolvedLineItems.length <= 1) return false;
    const currencies = new Set(
      resolvedLineItems
        .map((item) => (item.currency || resolvedCurrency || '').toUpperCase().trim())
        .filter(Boolean)
    );
    return currencies.size > 1;
  }, [resolvedLineItems, resolvedCurrency]);

  // Compute line items totals exactly (never aggregate across differing currencies or invalid amounts)
  const itemsTotalAmount = useMemo(() => {
    if (resolvedLineItems.length === 0 || hasMixedCurrencies) return '0.00';
    let total = '0.00';
    for (const item of resolvedLineItems) {
      const qty = item.quantity != null ? item.quantity : 1;
      let lineTotal: string | null = null;
      if (item.total_amount != null) {
        if (parseMonetaryDecimal(item.total_amount) === null) {
          return null; // Invalid monetary total
        }
        lineTotal = typeof item.total_amount === 'string'
          ? item.total_amount
          : decimalToString(parseMonetaryDecimal(item.total_amount)!);
      } else if (item.unit_price != null) {
        if (parseMonetaryDecimal(item.unit_price) === null) {
          return null; // Invalid unit price
        }
        try {
          lineTotal = multiplyMonetaryAmount(item.unit_price, qty);
        } catch {
          return null;
        }
      } else {
        return null;
      }
      try {
        total = addMonetaryAmounts(total, lineTotal);
      } catch {
        return null;
      }
    }
    return total;
  }, [resolvedLineItems, hasMixedCurrencies]);

  const totalQuantity = useMemo(() => {
    return resolvedLineItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  }, [resolvedLineItems]);

  if (!decisionId) return null;

  return (
    <div
      className="rg-drawer-overlay"
      onClick={handleClose}
      aria-hidden="false"
    >
      <aside
        ref={drawerRef}
        className="rg-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rg-drawer-title"
        aria-describedby="rg-drawer-desc"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <header className="rg-drawer-header">
          <div className="rg-drawer-header-info">
            <span id="rg-drawer-desc" className="rg-drawer-subtitle">
              Transaction Investigation
            </span>
            <h2 id="rg-drawer-title" className="rg-drawer-title">
              {decision?.order_id || decisionId}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="rg-drawer-close-btn"
            onClick={handleClose}
            aria-label="Close transaction investigation drawer"
          >
            <CloseIcon size={14} aria-hidden="true" />
            <span>Close</span>
          </button>
        </header>

        {/* Scrollable Body */}
        <div className="rg-drawer-body">
          {loading && (
            <div className="rg-drawer-loading" role="status">
              <span className="rg-loading-spinner" aria-hidden="true" />
              <span>Loading scoring audit and explanation...</span>
            </div>
          )}

          {error && (
            <div className="rg-drawer-error" role="alert">
              <div className="rg-drawer-error-title">Failed to load decision</div>
              <div className="rg-drawer-error-msg">{error.message}</div>
            </div>
          )}

          {decision && (
            <>
              {/* Section 1: Scoring Verdict */}
              <section className="rg-drawer-section">
                <div className="rg-drawer-section-title">ReturnGuard Recommendation</div>
                <div className="rg-verdict-bar">
                  <RiskBadge score={decision.risk_score} />
                  <RiskBadge action={decision.suggested_action} />
                  <span className="rg-verdict-severity">
                    Severity: <strong>{decision.severity || 'unknown'}</strong>
                  </span>
                </div>
                <p className="rg-verdict-note">
                  ReturnGuard evaluates transaction characteristics and recommends an operational hold/action.
                  Actual capture or decline is executed independently by the payment provider.
                </p>
              </section>

              {/* Section 2: Why This Was Flagged / SHAP Factors */}
              <section className="rg-drawer-section">
                <div className="rg-drawer-section-title">Why This Was Flagged</div>
                {decision.reason_codes && decision.reason_codes.length > 0 ? (
                  <div className="rg-reason-grid">
                    {decision.reason_codes.map((rc) => (
                      <div key={rc.feature} className="rg-reason-chip">
                        <span className="rg-reason-feature">{rc.feature}</span>
                        <span className="rg-reason-divider">:</span>
                        <span className="rg-reason-direction">{rc.direction}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rg-drawer-empty-text">
                    No specific rule or anomaly triggers flagged for this transaction.
                  </div>
                )}
              </section>

              {/* Section 3: Purchased Line Items */}
              <section className="rg-drawer-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div className="rg-drawer-section-title" style={{ margin: 0 }}>Purchased Line Items</div>
                  {resolvedLineItems.length > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--rg-text-muted)' }}>
                      {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
                    </span>
                  )}
                </div>

                {resolvedLineItems.length > 0 ? (
                  <div style={{ overflowX: 'auto', border: '1px solid var(--rg-border)', borderRadius: 6, background: 'var(--rg-bg-secondary)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--rg-border)', background: 'var(--rg-bg-tertiary)', color: 'var(--rg-text-secondary)' }}>
                          <th style={{ padding: '8px 10px', fontWeight: 600 }}>Item</th>
                          <th style={{ padding: '8px 10px', fontWeight: 600 }}>SKU</th>
                          <th style={{ padding: '8px 10px', fontWeight: 600, textAlign: 'right' }}>Qty</th>
                          <th style={{ padding: '8px 10px', fontWeight: 600, textAlign: 'right' }}>Unit Price</th>
                          <th style={{ padding: '8px 10px', fontWeight: 600, textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resolvedLineItems.map((item, idx) => {
                          const qty = item.quantity != null ? item.quantity : 1;
                          const qtyDisplay = item.quantity != null ? String(item.quantity) : '1';
                          let itemTotal: string | number | null = null;
                          if (item.total_amount != null) {
                            itemTotal = parseMonetaryDecimal(item.total_amount) !== null ? item.total_amount : null;
                          } else if (item.unit_price != null && parseMonetaryDecimal(item.unit_price) !== null) {
                            try {
                              itemTotal = multiplyMonetaryAmount(item.unit_price, qty);
                            } catch {
                              itemTotal = null;
                            }
                          }
                          const itemCurrency = item.currency || resolvedCurrency;

                          return (
                            <tr
                              key={item.id || item.sku || idx}
                              style={{ borderBottom: idx < resolvedLineItems.length - 1 ? '1px solid var(--rg-border-subtle, rgba(0,0,0,0.06))' : 'none' }}
                            >
                              <td style={{ padding: '8px 10px' }}>
                                <div style={{ fontWeight: 600, color: 'var(--rg-text)' }}>
                                  {item.name || item.description || `Item #${idx + 1}`}
                                </div>
                                {item.description && item.name && (
                                  <div style={{ fontSize: 11, color: 'var(--rg-text-muted)' }}>{item.description}</div>
                                )}
                              </td>
                              <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11, color: 'var(--rg-text-secondary)' }}>
                                {item.sku ? item.sku : '--'}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--rg-text)' }}>
                                {qtyDisplay}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--rg-text)' }}>
                                {formatCurrency(item.unit_price, itemCurrency)}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: 'var(--rg-text)' }}>
                                {itemTotal != null ? formatCurrency(itemTotal, itemCurrency) : '--'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: '2px solid var(--rg-border)', background: 'var(--rg-bg-tertiary)' }}>
                          <td colSpan={2} style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--rg-text)' }}>
                            Total Items ({totalQuantity})
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--rg-text)' }}>
                            {totalQuantity}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--rg-text-muted)' }}>
                            --
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--rg-text)' }}>
                            {hasMixedCurrencies ? '-- (Mixed Currencies)' : (itemsTotalAmount != null ? formatCurrency(itemsTotalAmount, resolvedCurrency) : '--')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="rg-drawer-empty-text">
                    No line items recorded for this order projection.
                  </div>
                )}
              </section>

              {/* Section 4: Payment & Processor Context */}
              <section className="rg-drawer-section">
                <div className="rg-drawer-section-title">Payment & Processor Context</div>
                <div className="rg-context-grid">
                  <div className="rg-context-item">
                    <span className="rg-context-label">Order ID</span>
                    <span className="rg-context-value rg-font-mono">{decision.order_id || '--'}</span>
                  </div>
                  <div className="rg-context-item">
                    <span className="rg-context-label">Channel</span>
                    <span className="rg-context-value">{decision.channel || 'web'}</span>
                  </div>
                  <div className="rg-context-item">
                    <span className="rg-context-label">Currency</span>
                    <span className="rg-context-value">{resolvedCurrency || 'Not Specified'}</span>
                  </div>
                  <div className="rg-context-item">
                    <span className="rg-context-label">ReturnGuard Mode</span>
                    <span className="rg-context-value">
                      {decision.shadow ? 'Shadow (Non-blocking)' : 'Live Policy Enforcement'}
                    </span>
                  </div>
                  <div className="rg-context-item">
                    <span className="rg-context-label">Payment Processor Status</span>
                    <span className="rg-context-value rg-text-muted rg-italic">
                      Not Verified (Owned by Merchant Application)
                    </span>
                  </div>
                </div>
              </section>

              {/* Section 5: Audit Event Timeline & Signals */}
              <section className="rg-drawer-section">
                <div className="rg-drawer-section-title">Audit Trail & Signals</div>
                <div className="rg-audit-container">
                  {audit ? (
                    <div className="rg-audit-grid">
                      <div className="rg-audit-row">
                        <span className="rg-audit-label">Decision ID:</span>
                        <span className="rg-audit-value rg-font-mono">
                          {audit.data?.decision?.decision_id || '--'}
                        </span>
                      </div>
                      <div className="rg-audit-row">
                        <span className="rg-audit-label">Order ID:</span>
                        <span className="rg-audit-value rg-font-mono">
                          {audit.data?.decision?.order_id || '--'}
                        </span>
                      </div>
                      <div className="rg-audit-row">
                        <span className="rg-audit-label">Policy Action:</span>
                        <span className="rg-audit-value">
                          {audit.data?.policy_trace?.policy_action || '--'}
                        </span>
                      </div>
                      <div className="rg-audit-row">
                        <span className="rg-audit-label">Reconstructed Features:</span>
                        <span className="rg-audit-value">
                          {Object.keys(audit.data?.feature_snapshot || {}).length} features verified
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rg-drawer-empty-text">
                      Basic audit event snapshot recorded. Full feature reconstruction stored in tenant repository.
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
};

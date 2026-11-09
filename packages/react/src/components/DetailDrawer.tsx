import React, { useEffect, useRef, useCallback } from 'react';
import { useTransactionRisk } from '../hooks';
import { RiskBadge } from './RiskBadge';
import { CloseIcon } from './icons';

export interface DetailDrawerProps {
  decisionId: string | null;
  onClose: () => void;
}

/**
 * Modernized accessible investigation sheet for transaction details and SHAP explanations.
 * Conforms to Stripe + Linear visual standards with strict keyboard focus trapping,
 * accessible ARIA dialog roles, focus restoration, and zero visual clutter.
 */
export const DetailDrawer: React.FC<DetailDrawerProps> = ({ decisionId, onClose }) => {
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

              {/* Section 3: Payment & Processor Context */}
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
                    <span className="rg-context-label">ReturnGuard Mode</span>
                    <span className="rg-context-value">
                      {decision.shadow ? 'Shadow (Non-blocking)' : 'Live Policy Enforcement'}
                    </span>
                  </div>
                  <div className="rg-context-item">
                    <span className="rg-context-label">Payment Processor Status</span>
                    <span className="rg-context-value rg-text-muted rg-italic">
                      Not Verified (Owned by Merchant / ShopPoint)
                    </span>
                  </div>
                </div>
              </section>

              {/* Section 4: Audit Event Timeline & Signals */}
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

import React from 'react';
import { useRiskTrends } from '../hooks';

export const PaymentPipelinePage: React.FC = () => {
  const { data, loading, error } = useRiskTrends();

  const channels = data?.channel_breakdown || { paypal: 0, cod: 0, other: 0 };
  const disputes = data?.dispute_analytics || { total_disputes: 0, disputed_amount: 0, currency: 'INR', dispute_rate_pct: 0 };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 700 }}>Payment Pipeline & Processor Lifecycle</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--rg-text-secondary)' }}>
          Visualization of payment authorization stages, capture gating, and PayPal dispute outcomes.
        </p>
      </div>

      {loading && <div style={{ color: 'var(--rg-text-muted)' }}>Loading payment pipeline...</div>}
      {error && <div style={{ color: 'var(--rg-high-text)' }}>Failed to load payment analytics: {error.message}</div>}

      {/* Lifecycle Flow */}
      <div className="rg-card" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 600 }}>Decoupled Risk & Payment Execution Lifecycle</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div style={{ background: 'var(--rg-bg-tertiary)', padding: 14, borderRadius: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--rg-accent)', fontWeight: 700 }}>STAGE 1: CHECKOUT</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>Order Placed</div>
            <div style={{ fontSize: 12, color: 'var(--rg-text-muted)', marginTop: 4 }}>PayPal authorization or COD checkout initiated.</div>
          </div>
          <div style={{ background: 'var(--rg-bg-tertiary)', padding: 14, borderRadius: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--rg-low-text)', fontWeight: 700 }}>STAGE 2: RETURNGUARD</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>Risk Scoring</div>
            <div style={{ fontSize: 12, color: 'var(--rg-text-muted)', marginTop: 4 }}>LightGBM inference & rules evaluate transaction.</div>
          </div>
          <div style={{ background: 'var(--rg-bg-tertiary)', padding: 14, borderRadius: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--rg-med-text)', fontWeight: 700 }}>STAGE 3: DECISION</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>Policy Recommendation</div>
            <div style={{ fontSize: 12, color: 'var(--rg-text-muted)', marginTop: 4 }}>ALLOW, REVIEW, or BLOCK recommended to merchant.</div>
          </div>
          <div style={{ background: 'var(--rg-bg-tertiary)', padding: 14, borderRadius: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--rg-high-text)', fontWeight: 700 }}>STAGE 4: MERCHANT</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>Payment Capture</div>
            <div style={{ fontSize: 12, color: 'var(--rg-text-muted)', marginTop: 4 }}>Merchant (ShopPoint) executes capture/void via PayPal.</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Channel Overview */}
        <div className="rg-card">
          <h3 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 600 }}>Channel Pipeline Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>PayPal Orders Processed</span>
              <strong>{channels.paypal.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>COD Orders Processed</span>
              <strong>{channels.cod.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>External Gateway Relays</span>
              <strong>{channels.other.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Dispute Metrics */}
        <div className="rg-card">
          <h3 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 600 }}>PayPal Dispute Analytics</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Recorded Disputes</span>
              <strong style={{ color: 'var(--rg-high-text)' }}>{disputes.total_disputes}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Disputed Value</span>
              <strong>{disputes.currency} {disputes.disputed_amount.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Dispute Rate</span>
              <strong>{disputes.dispute_rate_pct}%</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

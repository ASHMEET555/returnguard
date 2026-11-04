import React, { useState } from 'react';
import { useCustomers, useCustomerProfile } from '../hooks';
import { RiskBadge } from './RiskBadge';

export const CustomersPage: React.FC = () => {
  const { items, loading, error, hasMore, nextPage } = useCustomers(50);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const { profile, loading: profileLoading, error: profileError } = useCustomerProfile(selectedCustomerId);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 700 }}>Customer Risk Directory</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--rg-text-secondary)' }}>
          Tenant-scoped customer profiles, linked hardware devices, physical delivery locations, and order risk history.
        </p>
      </div>

      {loading && items.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--rg-text-muted)' }}>
          Loading customer directory...
        </div>
      )}

      {error && (
        <div style={{ padding: 16, background: 'var(--rg-high-bg)', border: '1px solid var(--rg-high-border)', borderRadius: 6, marginBottom: 16 }}>
          <span style={{ color: 'var(--rg-high-text)' }}>Failed to load customers: {error.message}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {items.map((cust) => (
          <div
            key={cust.customer_id}
            className="rg-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              cursor: 'pointer',
              borderColor: selectedCustomerId === cust.customer_id ? 'var(--rg-accent)' : 'var(--rg-border)',
            }}
            onClick={() => setSelectedCustomerId(cust.customer_id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 13 }}>{cust.customer_id}</span>
              <RiskBadge score={cust.max_risk_score} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--rg-text-secondary)' }}>
              <div>Email: <strong>{cust.email}</strong></div>
              <div style={{ marginTop: 2 }}>Phone: <strong>{cust.phone}</strong></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid var(--rg-border-subtle)', paddingTop: 8 }}>
              <span>Orders: <strong>{cust.total_orders}</strong></span>
              <span>Spent: <strong>{cust.currency} {cust.total_spent.toFixed(2)}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button
            type="button"
            onClick={nextPage}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: 'var(--rg-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Load More Customers →
          </button>
        </div>
      )}

      {/* Selected Customer Profile Modal / Slide Sheet */}
      {selectedCustomerId && (
        <div className="rg-drawer-overlay" onClick={() => setSelectedCustomerId(null)}>
          <div className="rg-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="rg-drawer-header">
              <div>
                <div style={{ fontSize: 11, color: 'var(--rg-text-muted)', textTransform: 'uppercase' }}>Customer Risk Profile</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{selectedCustomerId}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                style={{ background: 'transparent', border: '1px solid var(--rg-border)', color: 'var(--rg-text-primary)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}
              >
                ✕ Close
              </button>
            </div>

            <div className="rg-drawer-body">
              {profileLoading && <div style={{ color: 'var(--rg-text-muted)' }}>Loading profile details...</div>}
              {profileError && <div style={{ color: 'var(--rg-high-text)' }}>{profileError.message}</div>}

              {profile && (
                <>
                  <div className="rg-drawer-section">
                    <div className="rg-drawer-section-title">Customer Risk Summary</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                      <div>Email: <strong>{profile.email}</strong></div>
                      <div>Phone: <strong>{profile.phone}</strong></div>
                      <div>Total Orders: <strong>{profile.total_orders}</strong></div>
                      <div>Total Value: <strong>{profile.currency} {profile.total_spent.toFixed(2)}</strong></div>
                      <div>Max Risk Score: <RiskBadge score={profile.max_risk_score} /></div>
                      <div>Average Score: <strong>{(profile.average_risk_score * 100).toFixed(0)}</strong> / 100</div>
                    </div>
                  </div>

                  <div className="rg-drawer-section">
                    <div className="rg-drawer-section-title">Linked Devices ({profile.linked_devices.length})</div>
                    {profile.linked_devices.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--rg-text-muted)' }}>No linked device fingerprints recorded.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {profile.linked_devices.map((d) => (
                          <div key={d.id} style={{ fontSize: 12, fontFamily: 'monospace', background: 'var(--rg-bg-tertiary)', padding: 6, borderRadius: 4 }}>
                            Hash: {d.device_hash.slice(0, 16)}... | IP: {d.ip_address || 'Unknown'}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rg-drawer-section">
                    <div className="rg-drawer-section-title">Delivery Locations ({profile.linked_addresses.length})</div>
                    {profile.linked_addresses.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--rg-text-muted)' }}>No normalized addresses on file.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {profile.linked_addresses.map((a) => (
                          <div key={a.id} style={{ fontSize: 12, background: 'var(--rg-bg-tertiary)', padding: 6, borderRadius: 4 }}>
                            {a.city}, {a.state} {a.pincode} ({a.country})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rg-drawer-section">
                    <div className="rg-drawer-section-title">Order History & Decisions ({profile.order_history.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {profile.order_history.map((ord) => (
                        <div key={ord.order_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, borderBottom: '1px solid var(--rg-border-subtle)', paddingBottom: 6 }}>
                          <div>
                            <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{ord.order_id}</span>
                            <span style={{ marginLeft: 8, color: 'var(--rg-text-muted)' }}>{ord.channel}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{ord.currency} {ord.order_value.toFixed(2)}</span>
                            {ord.risk_score !== null && ord.risk_score !== undefined ? (
                              <RiskBadge score={ord.risk_score} />
                            ) : (
                              <span style={{ color: 'var(--rg-text-muted)' }}>Unscored</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

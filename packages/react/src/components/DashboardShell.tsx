import React from 'react';
import { useReturnGuard } from '../context';

export interface DashboardShellProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  brandTitle?: string;
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  currentTab,
  onTabChange,
  brandTitle = 'ReturnGuard',
  children,
}) => {
  const { theme, setTheme, currency, setCurrency, dateRange, setDateRange } = useReturnGuard();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'transactions', label: 'Transactions', icon: '💳' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'analytics', label: 'Risk Analytics (M2)', icon: '📈', disabled: true },
    { id: 'rules', label: 'Rules & Detection (M2)', icon: '🛡️', disabled: true },
    { id: 'models', label: 'Model Benchmarks (M2)', icon: '🤖', disabled: true },
  ];

  return (
    <div className="rg-shell">
      <aside className="rg-sidebar">
        <div className="rg-sidebar-header">
          <div className="rg-brand-logo">
            <span>🛡️</span>
            <span>{brandTitle}</span>
            <span className="rg-brand-badge">SaaS</span>
          </div>
        </div>
        <nav className="rg-sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`rg-nav-item ${currentTab === item.id ? 'active' : ''}`}
              onClick={() => !item.disabled && onTabChange(item.id)}
              disabled={item.disabled}
              style={{ opacity: item.disabled ? 0.45 : 1 }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="rg-main">
        <header className="rg-topbar">
          <div className="rg-topbar-left">
            <span style={{ fontSize: 13, color: 'var(--rg-text-muted)' }}>Tenant:</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Active Session</span>
          </div>
          <div className="rg-topbar-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled
                title="Currency filtering is not supported by the backend summary endpoint (aggregates reported in native INR/dataset units)."
                style={{
                  background: 'var(--rg-bg-card)',
                  color: 'var(--rg-text-muted)',
                  border: '1px solid var(--rg-border)',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: 12,
                  cursor: 'not-allowed',
                  opacity: 0.7,
                }}
              >
                <option value="INR">INR (₹) [Active]</option>
                <option value="USD">USD ($) [Unsupported]</option>
              </select>
              <span
                style={{ fontSize: 10, color: 'var(--rg-med-text)', cursor: 'help' }}
                title="Backend returns native currency aggregates; cross-currency filtering disabled to prevent inaccurate conversions."
              >
                ⓘ Fixed
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                disabled
                title="Date window filtering is not supported on /v1/analytics/summary (returns lifetime tenant metrics)."
                style={{
                  background: 'var(--rg-bg-card)',
                  color: 'var(--rg-text-muted)',
                  border: '1px solid var(--rg-border)',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: 12,
                  cursor: 'not-allowed',
                  opacity: 0.7,
                }}
              >
                <option value="all">All-Time [Lifetime Metrics]</option>
              </select>
              <span
                style={{ fontSize: 10, color: 'var(--rg-med-text)', cursor: 'help' }}
                title="Backend provides lifetime tenant summary; time-window bucketing deferred to Milestone 2."
              >
                ⓘ Fixed
              </span>
            </div>

            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{
                background: 'var(--rg-bg-card)',
                color: 'var(--rg-text-primary)',
                border: '1px solid var(--rg-border)',
                borderRadius: 4,
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </header>

        <main className="rg-content">{children}</main>
      </div>
    </div>
  );
};

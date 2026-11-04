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
  const { theme, setTheme } = useReturnGuard();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'transactions', label: 'Transactions', icon: '💳' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'analytics', label: 'Risk Analytics', icon: '📈' },
    { id: 'rules', label: 'Rules & Detection', icon: '🛡️' },
    { id: 'models', label: 'Model Benchmarks', icon: '🤖' },
    { id: 'pipeline', label: 'Payment Pipeline', icon: '🔀' },
    { id: 'reviews', label: 'Alerts & Reviews', icon: '🔔' },
    { id: 'reports', label: 'Reports & Export', icon: '📄' },
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
              onClick={() => onTabChange(item.id)}
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
              <span
                style={{
                  background: 'var(--rg-bg-card)',
                  color: 'var(--rg-text-muted)',
                  border: '1px solid var(--rg-border)',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: 12,
                }}
              >
                Currency: Native Dataset / Provider Specific
              </span>
              <span
                style={{ fontSize: 10, color: 'var(--rg-med-text)', cursor: 'help' }}
                title="Backend provides raw monetary amounts per transaction without guaranteed FX conversion. Global currency filter disabled."
              >
                ⓘ Fixed
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  background: 'var(--rg-bg-card)',
                  color: 'var(--rg-text-muted)',
                  border: '1px solid var(--rg-border)',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: 12,
                }}
              >
                Range: Lifetime Aggregates
              </span>
              <span
                style={{ fontSize: 10, color: 'var(--rg-med-text)', cursor: 'help' }}
                title="Backend /v1/analytics/summary returns all-time scored decisions."
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

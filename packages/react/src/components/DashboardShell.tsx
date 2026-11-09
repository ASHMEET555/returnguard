import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useReturnGuard } from '../context';
import {
  ShieldIcon,
  OverviewIcon,
  TransactionsIcon,
  CustomersIcon,
  AnalyticsIcon,
  RulesIcon,
  ModelsIcon,
  PipelineIcon,
  ReviewsIcon,
  ReportsIcon,
  SunIcon,
  MoonIcon,
  InfoIcon,
} from './icons';

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const firstNavRef = useRef<HTMLButtonElement>(null);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: OverviewIcon },
    { id: 'transactions', label: 'Transactions', icon: TransactionsIcon },
    { id: 'customers', label: 'Customers', icon: CustomersIcon },
    { id: 'analytics', label: 'Risk Analytics', icon: AnalyticsIcon },
    { id: 'rules', label: 'Rules & Detection', icon: RulesIcon },
    { id: 'models', label: 'Model Benchmarks', icon: ModelsIcon },
    { id: 'pipeline', label: 'Payment Pipeline', icon: PipelineIcon },
    { id: 'reviews', label: 'Alerts & Reviews', icon: ReviewsIcon },
    { id: 'reports', label: 'Reports & Export', icon: ReportsIcon },
  ];

  const closeMobileNav = useCallback(() => {
    setMobileOpen(false);
    toggleButtonRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        closeMobileNav();
      }
    },
    [mobileOpen, closeMobileNav]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleMobileNav = () => {
    if (!mobileOpen) {
      setMobileOpen(true);
      // Move focus into the first nav button on open
      setTimeout(() => {
        firstNavRef.current?.focus();
      }, 50);
    } else {
      closeMobileNav();
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="rg-shell">
      {/* Mobile backdrop */}
      <div
        className={`rg-sidebar-backdrop ${mobileOpen ? 'open' : ''}`}
        onClick={closeMobileNav}
        aria-hidden="true"
      />

      <aside
        className={`rg-sidebar ${mobileOpen ? 'open' : ''}`}
        aria-label="Sidebar Navigation"
        aria-modal={mobileOpen ? 'true' : undefined}
      >
        <div className="rg-sidebar-header">
          <div className="rg-brand-logo">
            <div className="rg-brand-icon-wrap" aria-hidden="true">
              <ShieldIcon size={18} />
            </div>
            <span className="rg-brand-title">{brandTitle}</span>
            <span className="rg-brand-badge">SaaS</span>
          </div>
        </div>

        <nav className="rg-sidebar-nav" aria-label="Main Navigation">
          {navItems.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                ref={index === 0 ? firstNavRef : undefined}
                type="button"
                className={`rg-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onTabChange(item.id);
                  if (mobileOpen) {
                    closeMobileNav();
                  }
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="rg-nav-item-icon" aria-hidden="true">
                  <IconComponent size={18} />
                </span>
                <span className="rg-nav-item-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="rg-main">
        <header className="rg-topbar" role="banner">
          <div className="rg-topbar-left">
            <button
              ref={toggleButtonRef}
              type="button"
              className="rg-mobile-toggle"
              onClick={toggleMobileNav}
              aria-label={mobileOpen ? 'Close navigation sidebar' : 'Open navigation sidebar'}
              aria-expanded={mobileOpen}
            >
              <span className="rg-mobile-toggle-bar" />
              <span className="rg-mobile-toggle-bar" />
              <span className="rg-mobile-toggle-bar" />
            </button>

            {/* Truthful, neutral tenant presentation without fake operational claims */}
            <div className="rg-tenant-status">
              <span className="rg-tenant-label">Tenant:</span>
              <span className="rg-tenant-name">Active Session</span>
            </div>
          </div>

          <div className="rg-topbar-right">
            <div className="rg-topbar-meta-item">
              <span className="rg-meta-tag">Currency: Native Dataset / Provider Specific</span>
              <span
                className="rg-meta-info"
                title="Backend provides raw monetary amounts per transaction without guaranteed FX conversion. Global currency filter disabled."
                aria-label="Currency status: Fixed"
                tabIndex={0}
              >
                <InfoIcon size={13} aria-hidden="true" />
                <span>Fixed</span>
              </span>
            </div>

            <div className="rg-topbar-meta-item">
              <span className="rg-meta-tag">Range: Lifetime Aggregates</span>
              <span
                className="rg-meta-info"
                title="Backend /v1/analytics/summary returns all-time scored decisions."
                aria-label="Range status: Fixed"
                tabIndex={0}
              >
                <InfoIcon size={13} aria-hidden="true" />
                <span>Fixed</span>
              </span>
            </div>

            <button
              type="button"
              className="rg-theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <>
                  <SunIcon size={15} aria-hidden="true" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <MoonIcon size={15} aria-hidden="true" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>
        </header>

        <main className="rg-content">{children}</main>
      </div>
    </div>
  );
};

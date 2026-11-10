import React, { useState } from 'react';
import type { ColDef } from 'ag-grid-community';
import type { ScoreResult } from '@returnguard/sdk';
import { useReturnGuard } from '../context';
import { RiskSummary } from './RiskSummary';
import { ReviewQueue } from './ReviewQueue';
import { RiskDecisionGrid } from './RiskDecisionGrid';
import { RiskExplanation } from './RiskExplanation';
import { AuditTimeline } from './AuditTimeline';
import { OverviewPage } from './OverviewPage';
import { TransactionsPage } from './TransactionsPage';
import { ReviewsPage } from './ReviewsPage';
import { RiskAnalyticsPage } from './RiskAnalyticsPage';
import { RulesPage } from './RulesPage';
import { ModelsPage } from './ModelsPage';
import { CustomersPage } from './CustomersPage';
import { InvestigationsPage } from './InvestigationsPage';
import { ReportsPage } from './ReportsPage';
import {
  ShieldIcon,
  OverviewIcon,
  TransactionsIcon,
  ReviewsIcon,
  AnalyticsIcon,
  RulesIcon,
  ModelsIcon,
  CustomersIcon,
  SearchIcon,
  ReportsIcon,
  SunIcon,
  MoonIcon,
} from './icons';

export interface WorkspaceItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number }>;
  component?: React.ComponentType<any>;
}

export interface MerchantDashboardTemplateProps {
  brandTitle?: string;
  merchantName?: string;
  workspaces?: string[] | WorkspaceItem[];
  defaultWorkspace?: string;
  layout?: 'tabs' | 'sidebar' | 'stacked';
  theme?: 'dark' | 'light';
  showBranding?: boolean;
  columns?: ColDef<ScoreResult>[];
  onReviewAction?: (id: string, action: 'APPROVE' | 'REJECT', notes?: string) => Promise<void> | void;
  renderHeaderRight?: () => React.ReactNode;
}

const DEFAULT_WORKSPACE_DEFS: Record<string, WorkspaceItem> = {
  overview: { id: 'overview', label: 'Overview', icon: OverviewIcon, component: OverviewPage },
  reviews: { id: 'reviews', label: 'Review Queue', icon: ReviewsIcon, component: ReviewsPage },
  transactions: { id: 'transactions', label: 'Decisions & Transactions', icon: TransactionsIcon, component: TransactionsPage },
  analytics: { id: 'analytics', label: 'Risk Analytics', icon: AnalyticsIcon, component: RiskAnalyticsPage },
  rules: { id: 'rules', label: 'Rules & Safeguards', icon: RulesIcon, component: RulesPage },
  models: { id: 'models', label: 'ML Benchmarks', icon: ModelsIcon, component: ModelsPage },
  customers: { id: 'customers', label: 'Customers', icon: CustomersIcon, component: CustomersPage },
  investigations: { id: 'investigations', label: 'Investigations', icon: SearchIcon, component: InvestigationsPage },
  reports: { id: 'reports', label: 'Reports & Export', icon: ReportsIcon, component: ReportsPage },
};

export const MerchantDashboardTemplate: React.FC<MerchantDashboardTemplateProps> = ({
  brandTitle = 'ReturnGuard',
  merchantName = 'ShopPoint',
  workspaces: propWorkspaces,
  defaultWorkspace = 'overview',
  layout = 'tabs',
  showBranding = true,
  columns,
  onReviewAction,
  renderHeaderRight,
}) => {
  const { theme, setTheme } = useReturnGuard();
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);

  // Normalize workspace list
  const activeWorkspaces: WorkspaceItem[] = React.useMemo(() => {
    if (!propWorkspaces || propWorkspaces.length === 0) {
      return [
        DEFAULT_WORKSPACE_DEFS.overview,
        DEFAULT_WORKSPACE_DEFS.reviews,
        DEFAULT_WORKSPACE_DEFS.transactions,
        DEFAULT_WORKSPACE_DEFS.analytics,
      ];
    }

    return propWorkspaces.map((ws) => {
      if (typeof ws === 'string') {
        return DEFAULT_WORKSPACE_DEFS[ws] || { id: ws, label: ws };
      }
      return ws;
    });
  }, [propWorkspaces]);

  const [currentTab, setCurrentTab] = useState<string>(
    activeWorkspaces.some((w) => w.id === defaultWorkspace)
      ? defaultWorkspace
      : activeWorkspaces[0]?.id || 'overview'
  );

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`rg-root rg-theme-${theme} rg-merchant-template`} style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Template Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: 'var(--rg-bg-secondary, #1e293b)',
          borderBottom: '1px solid var(--rg-border-primary, #334155)',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <ShieldIcon size={18} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--rg-text-primary)' }}>
              {brandTitle}
            </div>
            <div style={{ fontSize: 11, color: 'var(--rg-text-secondary)' }}>
              Merchant: <strong style={{ color: 'var(--rg-text-primary)' }}>{merchantName}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {renderHeaderRight && renderHeaderRight()}

          <button
            type="button"
            className="rg-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              fontSize: 12,
              borderRadius: 6,
              background: 'var(--rg-bg-tertiary)',
              border: '1px solid var(--rg-border-primary)',
              color: 'var(--rg-text-secondary)',
              cursor: 'pointer',
            }}
          >
            {theme === 'dark' ? (
              <>
                <SunIcon size={14} />
                <span>Light</span>
              </>
            ) : (
              <>
                <MoonIcon size={14} />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Tabs Bar (for 'tabs' layout) */}
      {layout === 'tabs' && activeWorkspaces.length > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '8px 20px',
            background: 'var(--rg-bg-primary, #0f172a)',
            borderBottom: '1px solid var(--rg-border-primary, #334155)',
            overflowX: 'auto',
          }}
        >
          {activeWorkspaces.map((ws) => {
            const isActive = currentTab === ws.id;
            const Icon = ws.icon;
            return (
              <button
                key={ws.id}
                type="button"
                onClick={() => {
                  setCurrentTab(ws.id);
                  setSelectedDecisionId(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  background: isActive ? 'var(--rg-bg-secondary, #1e293b)' : 'transparent',
                  color: isActive ? 'var(--rg-text-primary, #ffffff)' : 'var(--rg-text-secondary, #94a3b8)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                }}
              >
                {Icon && <Icon size={15} />}
                <span>{ws.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Workspace Content */}
      <main style={{ flex: 1, padding: '20px', maxWidth: 1400, width: '100%', margin: '0 auto' }}>
        {layout === 'stacked' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <RiskSummary />
            <ReviewQueue
              onApprove={(id, notes) => onReviewAction && onReviewAction(id, 'APPROVE', notes)}
              onReject={(id, notes) => onReviewAction && onReviewAction(id, 'REJECT', notes)}
              onSelectDecision={setSelectedDecisionId}
            />
            <RiskDecisionGrid
              columns={columns}
              onRowClick={(id) => setSelectedDecisionId(id)}
            />
            {selectedDecisionId && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
                <RiskExplanation decisionId={selectedDecisionId} />
                <AuditTimeline decisionId={selectedDecisionId} />
              </div>
            )}
          </div>
        ) : (
          <div>
            {currentTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <RiskSummary />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
                  <ReviewQueue
                    onApprove={(id, notes) => onReviewAction && onReviewAction(id, 'APPROVE', notes)}
                    onReject={(id, notes) => onReviewAction && onReviewAction(id, 'REJECT', notes)}
                    onSelectDecision={setSelectedDecisionId}
                  />
                  {selectedDecisionId ? (
                    <RiskExplanation decisionId={selectedDecisionId} />
                  ) : (
                    <AuditTimeline />
                  )}
                </div>
                <RiskDecisionGrid
                  columns={columns}
                  onRowClick={(id) => setSelectedDecisionId(id)}
                />
              </div>
            )}

            {currentTab === 'reviews' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <ReviewQueue
                  onApprove={(id, notes) => onReviewAction && onReviewAction(id, 'APPROVE', notes)}
                  onReject={(id, notes) => onReviewAction && onReviewAction(id, 'REJECT', notes)}
                  onSelectDecision={setSelectedDecisionId}
                />
                {selectedDecisionId && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
                    <RiskExplanation decisionId={selectedDecisionId} />
                    <AuditTimeline decisionId={selectedDecisionId} />
                  </div>
                )}
              </div>
            )}

            {currentTab === 'transactions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <RiskDecisionGrid
                  columns={columns}
                  onRowClick={(id) => setSelectedDecisionId(id)}
                />
                {selectedDecisionId && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
                    <RiskExplanation decisionId={selectedDecisionId} />
                    <AuditTimeline decisionId={selectedDecisionId} />
                  </div>
                )}
              </div>
            )}

            {currentTab === 'analytics' && <RiskAnalyticsPage />}
            {currentTab === 'rules' && <RulesPage />}
            {currentTab === 'models' && <ModelsPage />}
            {currentTab === 'customers' && <CustomersPage />}
            {currentTab === 'investigations' && <InvestigationsPage />}
            {currentTab === 'reports' && <ReportsPage />}
          </div>
        )}
      </main>

      {/* Attribution Footer */}
      {showBranding && (
        <footer
          style={{
            padding: '12px 20px',
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--rg-text-muted, #64748b)',
            borderTop: '1px solid var(--rg-border-primary, #334155)',
            background: 'var(--rg-bg-secondary, #1e293b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span>Powered by</span>
          <strong style={{ color: 'var(--rg-text-secondary, #94a3b8)', letterSpacing: '0.02em' }}>
            ReturnGuard
          </strong>
          <span>• AI Risk & Fraud Intelligence</span>
        </footer>
      )}
    </div>
  );
};

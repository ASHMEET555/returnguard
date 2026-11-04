import React from 'react';
import { ReturnGuardClient, ClientOptions, ModelPerformance, ScoreResult, AnalyticsSummary, DecisionAuditReconstruction } from '@returnguard/sdk';

interface ReturnGuardContextValue {
    client: ReturnGuardClient;
    theme: 'dark' | 'light';
    setTheme: (theme: 'dark' | 'light') => void;
    currency: string;
    setCurrency: (currency: string) => void;
    dateRange: string;
    setDateRange: (range: string) => void;
}
interface ReturnGuardProviderProps {
    client?: ReturnGuardClient;
    clientOptions?: ClientOptions;
    defaultTheme?: 'dark' | 'light';
    defaultCurrency?: string;
    children: React.ReactNode;
}
declare const ReturnGuardProvider: React.FC<ReturnGuardProviderProps>;
declare function useReturnGuard(): ReturnGuardContextValue;

declare function useRiskSummary(): {
    data: AnalyticsSummary | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
};
declare function useRiskDecisions(limit?: number): {
    items: ScoreResult[];
    nextCursor: string | null | undefined;
    hasMore: boolean;
    loading: boolean;
    error: Error | null;
    nextPage: () => void;
    resetPage: () => void;
    refetch: () => Promise<void>;
};
declare function useTransactionRisk(decisionId: string | null): {
    decision: ScoreResult | null;
    audit: DecisionAuditReconstruction | null;
    loading: boolean;
    error: Error | null;
};
declare function useModelPerformance(): {
    data: ModelPerformance | null;
    loading: boolean;
    error: Error | null;
};

interface BadgeProps {
    score?: number;
    severity?: string;
    action?: string;
    className?: string;
}
declare const RiskBadge: React.FC<BadgeProps>;

interface DashboardShellProps {
    currentTab: string;
    onTabChange: (tab: string) => void;
    brandTitle?: string;
    children: React.ReactNode;
}
declare const DashboardShell: React.FC<DashboardShellProps>;

declare const OverviewPage: React.FC;

interface TransactionsGridProps {
    items: ScoreResult[];
    loading?: boolean;
    onRowClick?: (id: string) => void;
    quickFilterText?: string;
}
declare const TransactionsGrid: React.FC<TransactionsGridProps>;

declare const TransactionsPage: React.FC;

interface DetailDrawerProps {
    decisionId: string | null;
    onClose: () => void;
}
declare const DetailDrawer: React.FC<DetailDrawerProps>;

declare const CustomersPage: React.FC;

interface ReturnGuardDashboardProps {
    initialTab?: string;
    brandTitle?: string;
}
declare const ReturnGuardDashboard: React.FC<ReturnGuardDashboardProps>;

export { CustomersPage, DashboardShell, DetailDrawer, OverviewPage, type ReturnGuardContextValue, ReturnGuardDashboard, ReturnGuardProvider, type ReturnGuardProviderProps, RiskBadge, TransactionsGrid, TransactionsPage, useModelPerformance, useReturnGuard, useRiskDecisions, useRiskSummary, useTransactionRisk };

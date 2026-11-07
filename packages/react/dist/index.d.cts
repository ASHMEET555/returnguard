import React from 'react';
import * as _returnguard_sdk from '@returnguard/sdk';
import { ReturnGuardClient, ClientOptions, CustomerProfileResponse, ModelPerformance, ScoreResult, AnalyticsSummary, RiskTrendsResponse, DecisionAuditReconstruction, InvestigationDetail, InvestigationAssessment, InvestigationTimelineStep, InvestigationListItem } from '@returnguard/sdk';

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
declare function useRiskTrends(): {
    data: RiskTrendsResponse | null;
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
declare function useCustomers(limit?: number): {
    items: _returnguard_sdk.CustomerListItem[];
    nextCursor: string | null | undefined;
    hasMore: boolean;
    loading: boolean;
    error: Error | null;
    nextPage: () => void;
    refetch: () => Promise<void>;
};
declare function useCustomerProfile(customerId: string | null): {
    profile: CustomerProfileResponse | null;
    loading: boolean;
    error: Error | null;
};
declare function useReviews(limit?: number): {
    items: _returnguard_sdk.ReviewItem[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
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

interface InvestigationsPageProps {
    initialInvestigationId?: string;
    onSelectInvestigation?: (id: string | null) => void;
    testDetail?: InvestigationDetail | null;
    testAssessment?: InvestigationAssessment | null;
    testTimeline?: InvestigationTimelineStep[] | null;
    testItems?: InvestigationListItem[] | null;
    onActionTrigger?: (action: string, payload?: any) => void;
}
declare const InvestigationsPage: React.FC<InvestigationsPageProps>;

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

declare const RiskAnalyticsPage: React.FC;

declare const RulesPage: React.FC;

declare const ModelsPage: React.FC;

declare const PaymentPipelinePage: React.FC;

declare const ReviewsPage: React.FC;

declare const ReportsPage: React.FC;

interface ReturnGuardDashboardProps {
    initialTab?: string;
    brandTitle?: string;
}
declare const ReturnGuardDashboard: React.FC<ReturnGuardDashboardProps>;

export { CustomersPage, DashboardShell, DetailDrawer, InvestigationsPage, ModelsPage, OverviewPage, PaymentPipelinePage, ReportsPage, type ReturnGuardContextValue, ReturnGuardDashboard, ReturnGuardProvider, type ReturnGuardProviderProps, ReviewsPage, RiskAnalyticsPage, RiskBadge, RulesPage, TransactionsGrid, TransactionsPage, useCustomerProfile, useCustomers, useModelPerformance, useReturnGuard, useReviews, useRiskDecisions, useRiskSummary, useRiskTrends, useTransactionRisk };

import React from 'react';
import * as _returnguard_sdk from '@returnguard/sdk';
import { ReturnGuardClient, ClientOptions, CustomerProfileResponse, ModelPerformance, ReviewsListResponse, ScoreResult, AnalyticsSummary, RiskTrendsResponse, DecisionAuditReconstruction, InvestigationDetail, InvestigationAssessment, InvestigationTimelineStep, InvestigationListItem } from '@returnguard/sdk';

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
    refetch: () => Promise<ReviewsListResponse | null>;
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
/**
 * Compact, professional status badge for risk scores, policy actions, and severity levels.
 * Adheres to Stripe & Linear visual restraint, high contrast in light/dark themes, and
 * consistent monospace score values without decorative emojis or oversized bubbles.
 */
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
/**
 * Modernized accessible investigation sheet for transaction details and SHAP explanations.
 * Conforms to Stripe + Linear visual standards with strict keyboard focus trapping,
 * accessible ARIA dialog roles, focus restoration, and zero visual clutter.
 */
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

interface ChartContainerProps {
    children?: React.ReactNode;
    title?: string;
    subtitle?: string;
    height?: number | string;
    minHeight?: number | string;
    className?: string;
    style?: React.CSSProperties;
    loading?: boolean;
    loadingMessage?: string;
    error?: Error | string | null;
    empty?: boolean;
    emptyTitle?: string;
    emptyMessage?: string;
    onRetry?: () => void;
    action?: React.ReactNode;
    ariaLabel?: string;
    ariaDescription?: string;
}
declare const ChartContainer: React.FC<ChartContainerProps>;

interface ChartTooltipPayloadItem {
    name?: string;
    value?: any;
    color?: string;
    fill?: string;
    stroke?: string;
    unit?: string;
    dataKey?: string | number;
    payload?: any;
}
interface ChartTooltipProps {
    active?: boolean;
    payload?: ChartTooltipPayloadItem[];
    label?: string | number;
    formatter?: (value: any, name: string, item: ChartTooltipPayloadItem, index: number) => React.ReactNode;
    labelFormatter?: (label: any) => React.ReactNode;
    valuePrefix?: string;
    valueSuffix?: string;
    showTotal?: boolean;
    totalLabel?: string;
    className?: string;
}
declare const ChartTooltip: React.FC<ChartTooltipProps>;

interface ChartLegendItem {
    value?: string | number;
    id?: string;
    type?: string;
    color?: string;
    inactive?: boolean;
    count?: number;
    percentage?: number;
    formattedValue?: string;
}
interface ChartLegendProps {
    payload?: ChartLegendItem[];
    items?: ChartLegendItem[];
    showValues?: boolean;
    showPercentages?: boolean;
    align?: 'left' | 'center' | 'right';
    className?: string;
}
declare const ChartLegend: React.FC<ChartLegendProps>;

interface ChartEmptyStateProps {
    title?: string;
    message?: string;
    height?: number | string;
    className?: string;
}
declare const ChartEmptyState: React.FC<ChartEmptyStateProps>;
interface ChartLoadingStateProps {
    message?: string;
    height?: number | string;
    className?: string;
}
declare const ChartLoadingState: React.FC<ChartLoadingStateProps>;
interface ChartErrorStateProps {
    title?: string;
    error?: Error | string | null;
    onRetry?: () => void;
    height?: number | string;
    className?: string;
}
declare const ChartErrorState: React.FC<ChartErrorStateProps>;

/**
 * ReturnGuard Shared Chart Theme Tokens and Formatting Utilities.
 * Strictly adheres to Stripe information hierarchy + Linear visual restraint.
 * Uses ReturnGuard semantic CSS variables with reliable fallback hex codes.
 */
declare const CHART_COLORS: {
    readonly allow: "#10b981";
    readonly review: "#f59e0b";
    readonly stepUp: "#f97316";
    readonly block: "#ef4444";
    readonly critical: "#be123c";
    readonly accent: "#3b82f6";
    readonly paypal: "#3b82f6";
    readonly cod: "#8b5cf6";
    readonly other: "#64748b";
    readonly synthetic: "#3b82f6";
    readonly ieeeCis: "#8b5cf6";
    readonly baseline: "#64748b";
    readonly gridDark: "#192436";
    readonly gridLight: "#edf2f7";
    readonly axisDark: "#8b949e";
    readonly axisLight: "#64748b";
    readonly textDark: "#f9fafb";
    readonly textLight: "#0f172a";
};
type ChartColorKey = keyof typeof CHART_COLORS;
/**
 * Returns a CSS variable reference with fallback hex for standard ReturnGuard chart elements.
 */
declare const CHART_CSS_VARS: {
    readonly allow: "var(--rg-low-text, #10b981)";
    readonly review: "var(--rg-med-text, #f59e0b)";
    readonly block: "var(--rg-high-text, #ef4444)";
    readonly critical: "var(--rg-crit-text, #be123c)";
    readonly accent: "var(--rg-accent, #3b82f6)";
    readonly grid: "var(--rg-border-subtle, #192436)";
    readonly axis: "var(--rg-text-muted, #8b949e)";
    readonly text: "var(--rg-text-primary, #f9fafb)";
    readonly cardBg: "var(--rg-bg-card, #131c2e)";
    readonly border: "var(--rg-border, #1f2d42)";
};
/**
 * Safely computes percentage with zero-division defense.
 */
declare function calculatePercentage(value: number, total: number, decimals?: number): number;
/**
 * Formats metric values cleanly (count, percentage, currency, or decimal ratio).
 */
declare function formatMetricValue(value: number | undefined | null, format?: 'count' | 'percent' | 'currency' | 'ratio', currencyCode?: string): string;

export { CHART_COLORS, CHART_CSS_VARS, type ChartColorKey, ChartContainer, type ChartContainerProps, ChartEmptyState, type ChartEmptyStateProps, ChartErrorState, type ChartErrorStateProps, ChartLegend, type ChartLegendItem, type ChartLegendProps, ChartLoadingState, type ChartLoadingStateProps, ChartTooltip, type ChartTooltipPayloadItem, type ChartTooltipProps, CustomersPage, DashboardShell, DetailDrawer, InvestigationsPage, ModelsPage, OverviewPage, PaymentPipelinePage, ReportsPage, type ReturnGuardContextValue, ReturnGuardDashboard, ReturnGuardProvider, type ReturnGuardProviderProps, ReviewsPage, RiskAnalyticsPage, RiskBadge, RulesPage, TransactionsGrid, TransactionsPage, calculatePercentage, formatMetricValue, useCustomerProfile, useCustomers, useModelPerformance, useReturnGuard, useReviews, useRiskDecisions, useRiskSummary, useRiskTrends, useTransactionRisk };

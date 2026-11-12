// Context & Provider
export { ReturnGuardProvider, useReturnGuard } from './context';
export type { ReturnGuardContextValue, ReturnGuardProviderProps, MerchantDashboardConfig } from './context';

// Hooks
export {
  useRiskSummary,
  useRiskDecisions,
  useTransactionRisk,
  useReviewQueue,
  useReviews,
  useModelPerformance,
  useRiskTrends,
  useCustomers,
  useCustomerProfile,
} from './hooks';

// Reusable Merchant SDK Components (Mode A)
export { RiskScoreBadge } from './components/RiskScoreBadge';
export type { RiskScoreBadgeProps } from './components/RiskScoreBadge';
export { RiskBadge } from './components/RiskBadge';
export type { RiskBadgeProps } from './components/RiskBadge';
export { RiskSummary } from './components/RiskSummary';
export type { RiskSummaryProps } from './components/RiskSummary';
export { RiskDecisionGrid } from './components/RiskDecisionGrid';
export type { RiskDecisionGridProps } from './components/RiskDecisionGrid';
export { ReviewQueue } from './components/ReviewQueue';
export type { ReviewQueueProps, ReviewItem } from './components/ReviewQueue';
export { RiskExplanation } from './components/RiskExplanation';
export type { RiskExplanationProps } from './components/RiskExplanation';
export { AuditTimeline } from './components/AuditTimeline';
export type { AuditTimelineProps } from './components/AuditTimeline';

// Customizable Dashboard Template (Mode B)
export { MerchantDashboardTemplate } from './components/MerchantDashboardTemplate';
export type { MerchantDashboardTemplateProps, WorkspaceItem } from './components/MerchantDashboardTemplate';

// Standalone 9-Workspace Dashboard
export { ReturnGuardDashboard } from './components/ReturnGuardDashboard';
export type { ReturnGuardDashboardProps } from './components/ReturnGuardDashboard';
export { DashboardShell } from './components/DashboardShell';
export { OverviewPage } from './components/OverviewPage';
export { InvestigationsPage } from './components/InvestigationsPage';
export { TransactionsGrid } from './components/TransactionsGrid';
export { TransactionsPage } from './components/TransactionsPage';
export { DetailDrawer } from './components/DetailDrawer';
export type { DetailDrawerProps, PaymentLineItem } from './components/DetailDrawer';
export { CustomersPage } from './components/CustomersPage';
export { RiskAnalyticsPage } from './components/RiskAnalyticsPage';
export { RulesPage } from './components/RulesPage';
export { ModelsPage } from './components/ModelsPage';
export { PaymentPipelinePage } from './components/PaymentPipelinePage';
export { ReviewsPage } from './components/ReviewsPage';
export { ReportsPage } from './components/ReportsPage';

// Chart Foundation
export {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartEmptyState,
  ChartLoadingState,
  ChartErrorState,
  CHART_COLORS,
  CHART_CSS_VARS,
  calculatePercentage,
  formatMetricValue,
} from './components/charts';
export type {
  ChartContainerProps,
  ChartTooltipProps,
  ChartTooltipPayloadItem,
  ChartLegendProps,
  ChartLegendItem,
  ChartEmptyStateProps,
  ChartLoadingStateProps,
  ChartErrorStateProps,
  ChartColorKey,
} from './components/charts';

// Centralized Dynamic Currency Formatting & Exact Monetary Arithmetic
export {
  formatCurrency,
  isSupportedCurrency,
  getCurrencySymbol,
  SUPPORTED_CURRENCIES,
  parseMonetaryDecimal,
  decimalToString,
  addMonetaryAmounts,
  multiplyMonetaryAmount,
  sumMonetaryAmounts,
  compareMonetaryAmounts,
} from './utils/currency';
export type { SupportedCurrency, FormatCurrencyOptions, ExactDecimal } from './utils/currency';


import { describe, it, expect } from 'vitest';
import * as ReactSDK from '../src/index';

describe('@returnguard/react exports', () => {
  it('exports Provider, hooks and primary components', () => {
    expect(ReactSDK.ReturnGuardProvider).toBeDefined();
    expect(ReactSDK.useReturnGuard).toBeDefined();
    expect(ReactSDK.useRiskSummary).toBeDefined();
    expect(ReactSDK.useRiskDecisions).toBeDefined();
    expect(ReactSDK.useTransactionRisk).toBeDefined();
    expect(ReactSDK.useModelPerformance).toBeDefined();
    expect(ReactSDK.useRiskTrends).toBeDefined();
    expect(ReactSDK.useCustomers).toBeDefined();
    expect(ReactSDK.useCustomerProfile).toBeDefined();
    expect(ReactSDK.useReviews).toBeDefined();
    expect(ReactSDK.RiskBadge).toBeDefined();
    expect(ReactSDK.DashboardShell).toBeDefined();
    expect(ReactSDK.OverviewPage).toBeDefined();
    expect(ReactSDK.TransactionsGrid).toBeDefined();
    expect(ReactSDK.TransactionsPage).toBeDefined();
    expect(ReactSDK.DetailDrawer).toBeDefined();
    expect(ReactSDK.CustomersPage).toBeDefined();
    expect(ReactSDK.RiskAnalyticsPage).toBeDefined();
    expect(ReactSDK.RulesPage).toBeDefined();
    expect(ReactSDK.ModelsPage).toBeDefined();
    expect(ReactSDK.PaymentPipelinePage).toBeDefined();
    expect(ReactSDK.ReviewsPage).toBeDefined();
    expect(ReactSDK.ReportsPage).toBeDefined();
    expect(ReactSDK.ReturnGuardDashboard).toBeDefined();
  });
});

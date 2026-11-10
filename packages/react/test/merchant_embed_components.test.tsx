import { describe, it, expect } from 'vitest';
import * as ReturnGuardReact from '../src/index';

describe('Merchant Embeddable Component SDK & Template', () => {
  it('exports all Mode A reusable components and hooks', () => {
    // Hooks
    expect(ReturnGuardReact.useReturnGuard).toBeDefined();
    expect(ReturnGuardReact.useRiskSummary).toBeDefined();
    expect(ReturnGuardReact.useRiskDecisions).toBeDefined();
    expect(ReturnGuardReact.useTransactionRisk).toBeDefined();
    expect(ReturnGuardReact.useReviewQueue).toBeDefined();

    // Components
    expect(ReturnGuardReact.ReturnGuardProvider).toBeDefined();
    expect(ReturnGuardReact.RiskScoreBadge).toBeDefined();
    expect(ReturnGuardReact.RiskBadge).toBeDefined();
    expect(ReturnGuardReact.RiskSummary).toBeDefined();
    expect(ReturnGuardReact.RiskDecisionGrid).toBeDefined();
    expect(ReturnGuardReact.ReviewQueue).toBeDefined();
    expect(ReturnGuardReact.RiskExplanation).toBeDefined();
    expect(ReturnGuardReact.AuditTimeline).toBeDefined();
  });

  it('exports Mode B Customizable Dashboard Template', () => {
    expect(ReturnGuardReact.MerchantDashboardTemplate).toBeDefined();
  });

  it('preserves existing standalone 9-workspace components without regressions', () => {
    expect(ReturnGuardReact.ReturnGuardDashboard).toBeDefined();
    expect(ReturnGuardReact.DashboardShell).toBeDefined();
    expect(ReturnGuardReact.OverviewPage).toBeDefined();
    expect(ReturnGuardReact.TransactionsPage).toBeDefined();
    expect(ReturnGuardReact.ReviewsPage).toBeDefined();
    expect(ReturnGuardReact.RiskAnalyticsPage).toBeDefined();
    expect(ReturnGuardReact.RulesPage).toBeDefined();
    expect(ReturnGuardReact.ModelsPage).toBeDefined();
    expect(ReturnGuardReact.PaymentPipelinePage).toBeDefined();
    expect(ReturnGuardReact.CustomersPage).toBeDefined();
    expect(ReturnGuardReact.InvestigationsPage).toBeDefined();
    expect(ReturnGuardReact.ReportsPage).toBeDefined();
  });
});

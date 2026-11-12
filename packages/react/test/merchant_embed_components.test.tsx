import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import * as ReturnGuardReact from '../src/index';
import { ReturnGuardClient } from '@returnguard/sdk';

describe('Merchant Embeddable Component SDK & Template', () => {
  const dummyClient = new ReturnGuardClient({
    baseUrl: 'https://api.test',
    apiKey: 'rg_live_test',
    fetch: vi.fn(),
  });

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
    expect(ReturnGuardReact.DetailDrawer).toBeDefined();

    // Centralized Dynamic Currency Formatting
    expect(ReturnGuardReact.formatCurrency).toBeDefined();
    expect(ReturnGuardReact.isSupportedCurrency).toBeDefined();
    expect(ReturnGuardReact.getCurrencySymbol).toBeDefined();
    expect(ReturnGuardReact.SUPPORTED_CURRENCIES).toEqual(['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD']);
  });

  it('exports Mode B Customizable Dashboard Template', () => {
    expect(ReturnGuardReact.MerchantDashboardTemplate).toBeDefined();
  });

  it('renders MerchantDashboardTemplate natively without iframe and with configurable branding', () => {
    const html = renderToStaticMarkup(
      <ReturnGuardReact.ReturnGuardProvider client={dummyClient}>
        <ReturnGuardReact.MerchantDashboardTemplate
          brandTitle="Acme Risk Shield"
          merchantName="Acme Global Retail"
        />
      </ReturnGuardReact.ReturnGuardProvider>
    );

    // Verify custom branding is rendered
    expect(html).toContain('Acme Risk Shield');
    expect(html).toContain('Acme Global Retail');

    // Strict Invariant: MUST NEVER use iframe for dashboard embedding
    expect(html).not.toContain('<iframe');

    // Strict Invariant: MUST NOT hardcode 'ShopPoint' when not configured
    expect(html).not.toContain('ShopPoint');
  });

  it('renders a second independent merchant configuration (e.g. Apex Store, EUR, custom workspaces) without modifying reusable components', () => {
    const apexClient = new ReturnGuardClient({
      baseUrl: 'https://api.apexstore.eu',
      apiKey: 'rg_live_apex_eu_98765',
      fetch: vi.fn(),
    });

    const html = renderToStaticMarkup(
      <ReturnGuardReact.ReturnGuardProvider client={apexClient} currency="EUR">
        <ReturnGuardReact.MerchantDashboardTemplate
          brandTitle="Apex Fraud Defense"
          merchantName="Apex Europe B.V."
          workspaces={['overview', 'transactions', 'reviews']}
          defaultWorkspace="transactions"
        />
      </ReturnGuardReact.ReturnGuardProvider>
    );

    // Verify custom second-merchant identity is rendered
    expect(html).toContain('Apex Fraud Defense');
    expect(html).toContain('Apex Europe B.V.');

    // Strict Invariants
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('ShopPoint');
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

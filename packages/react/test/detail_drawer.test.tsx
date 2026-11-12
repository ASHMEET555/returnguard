import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DetailDrawer, PaymentLineItem } from '../src/components/DetailDrawer';
import { ReturnGuardProvider } from '../src/context';
import { ReturnGuardClient } from '@returnguard/sdk';

// Mock hook
vi.mock('../src/hooks', () => ({
  useTransactionRisk: (decisionId: string | null) => {
    if (!decisionId) return { decision: null, audit: null, loading: false, error: null };
    return {
      decision: {
        order_id: 'ord_test_123',
        decision_id: decisionId,
        channel: 'paypal',
        risk_score: 0.15,
        risk_score_100: 15,
        tier: 'LOW',
        policy_rule: 'ALLOW_NORMAL',
        policy_action: 'ALLOW',
        severity: 'low',
        suggested_action: 'ALLOW',
        reason_codes: [],
        rule_hits: [],
        model_version: 'v1',
        dataset: 'synthetic',
        threshold: 0.4,
        model_status: 'active',
        feature_completeness: 1.0,
        explanation_status: 'available',
        shadow: false,
        currency: 'EUR',
      },
      audit: {
        status: 'success',
        data: {
          decision: {
            decision_id: decisionId,
            order_id: 'ord_test_123',
            channel: 'paypal',
            risk_score: 0.15,
            tier: 'LOW',
            model_version: 'v1',
            model_status: 'active',
            threshold: 0.4,
            feature_completeness: 1.0,
            explanation_status: 'available',
            shadow: false,
          },
          policy_trace: {
            policy_rule: 'ALLOW_NORMAL',
            policy_action: 'ALLOW',
            suggested_action: 'ALLOW',
            severity: 'low',
            tier: 'LOW',
            threshold: 0.4,
            rule_hits: [],
          },
          shap_top_k: [],
          rule_hits: [],
          feature_snapshot: {},
          relay_events: [],
        },
      },
      loading: false,
      error: null,
    };
  },
}));

describe('DetailDrawer Line Items & Currency', () => {
  const fakeClient = new ReturnGuardClient({
    baseUrl: 'https://api.test',
    apiKey: 'rg_live_test',
    fetch: vi.fn(),
  });

  it('renders line items table with correct fields and EUR currency', () => {
    const testItems: PaymentLineItem[] = [
      {
        name: 'Mechanical Keyboard',
        sku: 'KB-882-RGB',
        quantity: 2,
        unit_price: '89.50',
        total_amount: '179.00',
      },
      {
        name: 'USB-C Cable',
        description: 'Braided 2m nylon cable',
        sku: 'CBL-TYPC-2M',
        quantity: 1,
        unit_price: 15.0,
        total_amount: 15.0,
      },
    ];

    const html = renderToStaticMarkup(
      <ReturnGuardProvider client={fakeClient}>
        <DetailDrawer
          decisionId="dec_123"
          onClose={vi.fn()}
          lineItems={testItems}
          currency="EUR"
        />
      </ReturnGuardProvider>
    );

    // Verify items are rendered
    expect(html).toContain('Mechanical Keyboard');
    expect(html).toContain('KB-882-RGB');
    expect(html).toContain('USB-C Cable');
    expect(html).toContain('Braided 2m nylon cable');

    // Verify currency formatting
    expect(html).toContain('€89.50');
    expect(html).toContain('€179.00');
    expect(html).toContain('€15.00');

    // Verify footer totals
    expect(html).toContain('Total Items (3)');
    expect(html).toContain('€194.00');
  });

  it('handles missing line items gracefully without crashing', () => {
    const html = renderToStaticMarkup(
      <ReturnGuardProvider client={fakeClient}>
        <DetailDrawer
          decisionId="dec_empty"
          onClose={vi.fn()}
          lineItems={[]}
        />
      </ReturnGuardProvider>
    );

    expect(html).toContain('No line items recorded for this order projection.');
  });

  it('renders INR currency formatted line items properly', () => {
    const testItems: PaymentLineItem[] = [
      {
        name: 'Cotton Kurta',
        sku: 'KURTA-IND-XL',
        quantity: 3,
        unit_price: 1200.0,
        total_amount: 3600.0,
      },
    ];

    const html = renderToStaticMarkup(
      <ReturnGuardProvider client={fakeClient}>
        <DetailDrawer
          decisionId="dec_inr"
          onClose={vi.fn()}
          lineItems={testItems}
          currency="INR"
        />
      </ReturnGuardProvider>
    );

    expect(html).toContain('Cotton Kurta');
    expect(html).toContain('KURTA-IND-XL');
    expect(html).toContain('₹1,200.00');
    expect(html).toContain('₹3,600.00');
  });

  it('renders CAD currency formatted line items properly with CA$ symbol', () => {
    const testItems: PaymentLineItem[] = [
      {
        name: 'Maple Syrup 1L',
        sku: 'MAPLE-1000',
        quantity: 1,
        unit_price: '24.99',
        total_amount: '24.99',
      },
    ];

    const html = renderToStaticMarkup(
      <ReturnGuardProvider client={fakeClient}>
        <DetailDrawer
          decisionId="dec_cad"
          onClose={vi.fn()}
          lineItems={testItems}
          currency="CAD"
        />
      </ReturnGuardProvider>
    );

    expect(html).toContain('CA$24.99');
  });

  it('refuses to aggregate mixed-currency line items into a single total amount', () => {
    const mixedItems: PaymentLineItem[] = [
      {
        name: 'US Digital License',
        sku: 'LIC-US-01',
        quantity: 1,
        unit_price: 100.0,
        currency: 'USD',
      },
      {
        name: 'EU Hardware Dongle',
        sku: 'DGL-EU-02',
        quantity: 1,
        unit_price: 85.0,
        currency: 'EUR',
      },
    ];

    const html = renderToStaticMarkup(
      <ReturnGuardProvider client={fakeClient}>
        <DetailDrawer
          decisionId="dec_mixed"
          onClose={vi.fn()}
          lineItems={mixedItems}
          currency="USD"
        />
      </ReturnGuardProvider>
    );

    // Each line item retains its distinct individual currency
    expect(html).toContain('$100.00');
    expect(html).toContain('€85.00');

    // Total must refuse to aggregate differing currencies
    expect(html).toContain('-- (Mixed Currencies)');
    expect(html).not.toContain('$185.00');
    expect(html).not.toContain('€185.00');
  });

  it('computes quantity × unit price and order total without IEEE-754 drift (0.10 × 3 = 0.30)', () => {
    const items: PaymentLineItem[] = [
      {
        name: 'Micro-transaction token',
        sku: 'TOKEN-01',
        quantity: 3,
        unit_price: '0.10',
      },
    ];

    const html = renderToStaticMarkup(
      <ReturnGuardProvider client={fakeClient}>
        <DetailDrawer
          decisionId="dec_exact_micro"
          onClose={vi.fn()}
          lineItems={items}
          currency="USD"
        />
      </ReturnGuardProvider>
    );

    // Exact $0.10 unit price and exact $0.30 total without 0.30000000000000004
    expect(html).toContain('$0.10');
    expect(html).toContain('$0.30');
    expect(html).not.toContain('0.30000000000000004');
  });

  it('computes large quantity and unit price line item totals without precision loss', () => {
    const largeItems: PaymentLineItem[] = [
      {
        name: 'Enterprise Bulk License',
        sku: 'ENT-BULK-99',
        quantity: '1000',
        unit_price: '999999999999.99',
      },
    ];

    const html = renderToStaticMarkup(
      <ReturnGuardProvider client={fakeClient}>
        <DetailDrawer
          decisionId="dec_large_qty"
          onClose={vi.fn()}
          lineItems={largeItems}
          currency="USD"
        />
      </ReturnGuardProvider>
    );

    expect(html).toContain('$999,999,999,999.99');
    expect(html).toContain('$999,999,999,999,990.00');
  });

  it('strictly rejects non-integer Number unit_price: receiving 0.1 does not display $0.10', () => {
    const invalidItems: PaymentLineItem[] = [
      {
        name: 'Unsafe Float Item',
        sku: 'FLOAT-01',
        quantity: 1,
        unit_price: 0.1, // fractional Number must be rejected
      },
    ];

    const html = renderToStaticMarkup(
      <ReturnGuardProvider client={fakeClient}>
        <DetailDrawer
          decisionId="dec_invalid_float"
          onClose={vi.fn()}
          lineItems={invalidItems}
          currency="USD"
        />
      </ReturnGuardProvider>
    );

    // Must NOT display $0.10; renders established invalid-value placeholder '--'
    expect(html).not.toContain('$0.10');
    expect(html).toContain('--');
  });

  it('accepts exact decimal string unit_price: receiving "0.10" displays $0.10', () => {
    const validItems: PaymentLineItem[] = [
      {
        name: 'Exact String Item',
        sku: 'EXACT-01',
        quantity: 1,
        unit_price: '0.10', // exact decimal string must be accepted
      },
    ];

    const html = renderToStaticMarkup(
      <ReturnGuardProvider client={fakeClient}>
        <DetailDrawer
          decisionId="dec_valid_string"
          onClose={vi.fn()}
          lineItems={validItems}
          currency="USD"
        />
      </ReturnGuardProvider>
    );

    expect(html).toContain('$0.10');
  });
});

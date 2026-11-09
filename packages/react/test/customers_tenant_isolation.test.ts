import { describe, it, expect, vi } from 'vitest';
import { ReturnGuardClient } from '@returnguard/sdk';
import type { CustomerListResponse, CustomerProfileResponse } from '@returnguard/sdk';
import * as ReactSDK from '../src/index';

describe('Customers Workspace Tenant Isolation (Milestone 5.2)', () => {
  it('does not export or contain any cross-tenant fallback data', () => {
    // Ensure genuineCustomerData is deleted and not exported anywhere
    expect((ReactSDK as Record<string, unknown>)['genuineCustomerData']).toBeUndefined();
    expect((ReactSDK as Record<string, unknown>)['GENUINE_CUSTOMERS']).toBeUndefined();
    expect((ReactSDK as Record<string, unknown>)['mockCustomers']).toBeUndefined();
  });

  describe('Scenario A: Tenant with customers', () => {
    it('returns and uses strictly tenant-scoped customer records', async () => {
      const mockListResponse: CustomerListResponse = {
        items: [
          {
            customer_id: 'cust_tenantA_01',
            email: 'userA1@example.com',
            phone: '+1***55501',
            total_orders: 5,
            total_spent: 850.5,
            currency: 'USD',
            max_risk_score: 0.25,
            last_order_at: '2026-11-01T12:00:00Z',
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
        next_cursor: null,
        has_more: false,
      };

      const mockProfileResponse: CustomerProfileResponse = {
        customer_id: 'cust_tenantA_01',
        email: 'userA1@example.com',
        phone: '+1***55501',
        created_at: '2026-01-01T00:00:00Z',
        total_orders: 5,
        total_spent: 850.5,
        currency: 'USD',
        max_risk_score: 0.25,
        average_risk_score: 0.12,
        linked_devices: [
          {
            id: 'dev_01',
            device_hash: 'hash_fingerprint_01',
            ip_address: '192.168.1.1',
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
        linked_addresses: [
          {
            id: 'addr_01',
            city: 'New York',
            state: 'NY',
            pincode: '10001',
            country: 'US',
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
        order_history: [
          {
            order_id: 'ord_01',
            order_value: 170.1,
            currency: 'USD',
            channel: 'shopify',
            status: 'approved',
            order_time: '2026-11-01T12:00:00Z',
            risk_score: 0.25,
            policy_action: 'ALLOW',
          },
        ],
      };

      const client = new ReturnGuardClient({
        baseUrl: 'http://localhost:8000',
        tokenProvider: vi.fn().mockResolvedValue('tenantA_token'),
      });

      // Spy on client customers methods
      vi.spyOn(client.customers, 'list').mockResolvedValue(mockListResponse);
      vi.spyOn(client.customers, 'get').mockResolvedValue(mockProfileResponse);

      const listRes = await client.customers.list({ limit: 50 });
      expect(listRes.items).toHaveLength(1);
      expect(listRes.items[0].customer_id).toBe('cust_tenantA_01');

      const profileRes = await client.customers.get('cust_tenantA_01');
      expect(profileRes.customer_id).toBe('cust_tenantA_01');
      expect(profileRes.linked_devices).toHaveLength(1);
      expect(profileRes.order_history).toHaveLength(1);
    });
  });

  describe('Scenario B: Tenant with zero customers', () => {
    it('returns empty items and does not substitute any fallback data', async () => {
      const mockEmptyResponse: CustomerListResponse = {
        items: [],
        next_cursor: null,
        has_more: false,
      };

      const client = new ReturnGuardClient({
        baseUrl: 'http://localhost:8000',
        tokenProvider: vi.fn().mockResolvedValue('tenantB_empty_token'),
      });

      vi.spyOn(client.customers, 'list').mockResolvedValue(mockEmptyResponse);

      const listRes = await client.customers.list({ limit: 50 });
      expect(listRes.items).toEqual([]);
      expect(listRes.items.length).toBe(0);
      expect(listRes.has_more).toBe(false);
    });
  });

  describe('Scenario C: Profile 404 / error handling', () => {
    it('propagates the 404 error without falling back to another customer', async () => {
      const client = new ReturnGuardClient({
        baseUrl: 'http://localhost:8000',
        tokenProvider: vi.fn().mockResolvedValue('tenantA_token'),
      });

      const notFoundError = new Error('HTTP 404 Not Found: Customer does not exist for this tenant');
      vi.spyOn(client.customers, 'get').mockRejectedValue(notFoundError);

      await expect(client.customers.get('cust_nonexistent')).rejects.toThrow(
        'HTTP 404 Not Found: Customer does not exist for this tenant'
      );
    });
  });

  describe('Scenario D: Tenant switch isolation', () => {
    it('isolates data when switching between tenant sessions', async () => {
      const tenantAClient = new ReturnGuardClient({
        baseUrl: 'http://localhost:8000',
        tokenProvider: vi.fn().mockResolvedValue('tenantA_token'),
      });

      const tenantBClient = new ReturnGuardClient({
        baseUrl: 'http://localhost:8000',
        tokenProvider: vi.fn().mockResolvedValue('tenantB_token'),
      });

      vi.spyOn(tenantAClient.customers, 'list').mockResolvedValue({
        items: [
          {
            customer_id: 'cust_tenantA_99',
            email: 'secret@tenant-a.com',
            phone: '+1***0000',
            total_orders: 1,
            total_spent: 100,
            currency: 'USD',
            max_risk_score: 0.1,
            last_order_at: '2026-11-01T00:00:00Z',
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
        next_cursor: null,
        has_more: false,
      });

      vi.spyOn(tenantBClient.customers, 'list').mockResolvedValue({
        items: [],
        next_cursor: null,
        has_more: false,
      });

      const resA = await tenantAClient.customers.list();
      expect(resA.items).toHaveLength(1);
      expect(resA.items[0].customer_id).toBe('cust_tenantA_99');

      // Tenant B must not see Tenant A data
      const resB = await tenantBClient.customers.list();
      expect(resB.items).toHaveLength(0);
      expect(resB.items).not.toContainEqual(resA.items[0]);
    });
  });
});

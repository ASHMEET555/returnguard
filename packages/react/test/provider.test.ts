import { describe, it, expect, vi } from 'vitest';
import { ReturnGuardClient } from '@returnguard/sdk';

describe('ReturnGuardClient and React Adapters', () => {
  it('instantiates ReturnGuardClient with tokenProvider', () => {
    const client = new ReturnGuardClient({
      baseUrl: 'http://localhost:8000',
      tokenProvider: vi.fn().mockResolvedValue('mock_token'),
    });
    expect(client).toBeDefined();
    expect(client.decisions).toBeDefined();
    expect(client.analytics).toBeDefined();
  });
});

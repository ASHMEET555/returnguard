import { describe, it, expect, vi } from "vitest";
import { createRenewingTokenProvider, parseJwtPayload } from "../src/auth";
import { AuthenticationError } from "../src/errors";
import { ReturnGuardClient } from "../src/client";

function makeFakeJwt(expInSecondsFromNow: number, sub = "user_test"): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + expInSecondsFromNow;
  const payload = Buffer.from(JSON.stringify({ sub, exp, aud: "returnguard-sdk" })).toString("base64url");
  return `${header}.${payload}.fakesignature`;
}

describe("tokenProvider Renewal and Auth", () => {
  it("parses JWT payload safely", () => {
    const token = makeFakeJwt(300, "user_alpha");
    const payload = parseJwtPayload(token);
    expect(payload.sub).toBe("user_alpha");
    expect(typeof payload.exp).toBe("number");
  });

  it("caches valid in-memory token and does not re-fetch before expiry margin", async () => {
    let fetchCount = 0;
    const fetchToken = vi.fn().mockImplementation(async () => {
      fetchCount++;
      return makeFakeJwt(600, `user_${fetchCount}`);
    });

    const provider = createRenewingTokenProvider({
      fetchToken,
      refreshMarginSeconds: 30,
    });

    const token1 = await provider();
    expect(fetchCount).toBe(1);

    const token2 = await provider();
    expect(fetchCount).toBe(1);
    expect(token2).toBe(token1);
  });

  it("refreshes token proactively when within margin", async () => {
    let fetchCount = 0;
    const fetchToken = vi.fn().mockImplementation(async () => {
      fetchCount++;
      // Return a token that expires in 20 seconds (less than 30s margin)
      return makeFakeJwt(20, `user_${fetchCount}`);
    });

    const provider = createRenewingTokenProvider({
      fetchToken,
      refreshMarginSeconds: 30,
    });

    const token1 = await provider();
    expect(fetchCount).toBe(1);

    // Second call should detect expiry within 30s margin and refresh
    const token2 = await provider();
    expect(fetchCount).toBe(2);
    expect(token2).not.toBe(token1);
  });

  it("forces refresh on forceRefresh context", async () => {
    let fetchCount = 0;
    const fetchToken = vi.fn().mockImplementation(async () => {
      fetchCount++;
      return makeFakeJwt(600, `user_${fetchCount}`);
    });

    const provider = createRenewingTokenProvider({ fetchToken });

    await provider();
    expect(fetchCount).toBe(1);

    await provider({ forceRefresh: true });
    expect(fetchCount).toBe(2);
  });

  it("re-authenticates automatically on 401 when using tokenProvider in client", async () => {
    let attempt = 0;
    let providerCallCount = 0;

    const tokenProvider = vi.fn().mockImplementation(async (ctx) => {
      providerCallCount++;
      return makeFakeJwt(600, `user_call_${providerCallCount}`);
    });

    const fakeFetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
      attempt++;
      if (attempt === 1) {
        // First request rejected with 401
        return new Response(JSON.stringify({ detail: "Token expired or revoked" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ tenant_id: "t1", total_decisions: 1 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const client = new ReturnGuardClient({
      baseUrl: "https://api.test",
      tokenProvider,
      fetch: fakeFetch as any,
    });

    const analytics = await client.analytics.summary();
    expect(analytics.tenant_id).toBe("t1");
    expect(attempt).toBe(2);
    // Provider called initially, then called with forceRefresh: true on 401
    expect(providerCallCount).toBe(2);
  });
});

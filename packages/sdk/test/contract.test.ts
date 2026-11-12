import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, ChildProcess } from "node:child_process";
import * as path from "node:path";
import { ReturnGuardClient } from "../src/client";
import { createRenewingTokenProvider } from "../src/auth";
import { AuthenticationError, NotFoundError, RateLimitError } from "../src/errors";

const TEST_PORT = 8765;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const SIGNING_KEY = "super_secure_embed_signing_key_at_least_32_bytes_long!";
const TEST_API_KEY = "rg_live_contract_test_key_001";
const TEST_MERCHANT_ID = "merch_contract_e2e";
const TEST_MERCHANT_B_ID = "merch_contract_tenant_b";
const TEST_API_KEY_B = "rg_live_contract_test_key_b";
const REPO_ROOT = path.resolve(__dirname, "../../..");
const PYTHON_CMD = process.env.PYTHON || (process.platform === "win32" ? path.join(REPO_ROOT, ".venv/Scripts/python.exe") : "python");

let serverProc: ChildProcess | null = null;

async function waitForServer(url: string, maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${url}/health`);
      if (res.ok) return;
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server failed to start on ${url} within timeout`);
}

describe("HTTP Contract Tests against running ReturnGuard API", () => {
  beforeAll(async () => {
    // Seed test merchants and API keys into DB
    const setupScript = `
import sys
sys.path.insert(0, r"${REPO_ROOT}")
from db.session import SessionLocal
from db.models import Merchant, APIKey
import hashlib, uuid

db = SessionLocal()
def ensure_merchant(m_id, name, email, key_raw):
    m = db.query(Merchant).filter(Merchant.id == m_id).first()
    if not m:
        m = Merchant(id=m_id, name=name, email=email)
        db.add(m)
    h = hashlib.sha256(key_raw.encode('utf-8')).hexdigest()
    k = db.query(APIKey).filter(APIKey.merchant_id == m_id).first()
    if not k:
        k = APIKey(
            id=str(uuid.uuid4()),
            merchant_id=m_id,
            key_prefix='rg_live_',
            key_hash=h,
            name=f'{name} Key',
            is_active=True,
        )
        db.add(k)

ensure_merchant('${TEST_MERCHANT_ID}', 'Contract Test Merchant', 'contract@test.com', '${TEST_API_KEY}')
ensure_merchant('${TEST_MERCHANT_B_ID}', 'Contract Test Merchant B', 'contract_b@test.com', '${TEST_API_KEY_B}')
db.commit()
db.close()
`;

    const p = spawn(PYTHON_CMD, ["-c", setupScript], { cwd: REPO_ROOT, stdio: "inherit" });
    await new Promise((resolve) => p.on("exit", resolve));

    // Start uvicorn server with cwd set to repo root
    const env = {
      ...process.env,
      RG_EMBED_SIGNING_KEY: SIGNING_KEY,
      PYTHONPATH: REPO_ROOT,
    };

    serverProc = spawn(
      PYTHON_CMD,
      ["-m", "uvicorn", "api.main:app", "--host", "127.0.0.1", "--port", String(TEST_PORT)],
      {
        cwd: REPO_ROOT,
        env,
        stdio: "inherit",
      }
    );

    await waitForServer(BASE_URL);
  }, 30000);

  afterAll(async () => {
    if (serverProc) {
      serverProc.kill();
    }
  });

  it("server API key client: scores transaction and reconstructs audit", async () => {
    const client = new ReturnGuardClient({
      baseUrl: BASE_URL,
      apiKey: TEST_API_KEY,
    });

    const score = await client.scoreTransaction({
      order_id: `ord_contract_${Date.now()}`,
      amount: 1499.0,
      channel: "paypal",
    });

    expect(score.risk_score).toBeGreaterThanOrEqual(0);
    expect(score.risk_score).toBeLessThanOrEqual(1);
    expect(score.decision_id).toBeDefined();

    const audit = await client.decisions.audit(score.decision_id!);
    expect(audit.data.decision.decision_id).toBe(score.decision_id);
    expect(audit.data.decision.order_id).toBe(score.order_id);
  });

  it("embed token client: reads decisions, analytics and models without score permissions", async () => {
    const serverClient = new ReturnGuardClient({
      baseUrl: BASE_URL,
      apiKey: TEST_API_KEY,
    });

    const tokenRes = await (serverClient as any).transport.request<{ token: string }>({
      method: "POST",
      path: "/v1/auth/embed-tokens",
      body: { sub: "enduser_agent_123" },
    });
    expect(tokenRes.token).toBeDefined();

    const tokenProvider = createRenewingTokenProvider({
      fetchToken: async () => tokenRes.token,
    });

    const embedClient = new ReturnGuardClient({
      baseUrl: BASE_URL,
      tokenProvider,
    });

    const decisions = await embedClient.decisions.list({ limit: 5 });
    expect(Array.isArray(decisions.items)).toBe(true);

    const analytics = await embedClient.analytics.summary();
    expect(analytics.tenant_id).toBe(TEST_MERCHANT_ID);

    const perf = await embedClient.models.performance();
    expect(perf.synthetic.dataset_name).toBe("synthetic");
    expect(perf.ieee_cis.dataset_name).toBe("ieee_cis");

    await expect(
      embedClient.scoreTransaction({ amount: 100 })
    ).rejects.toThrow(AuthenticationError);
  });

  it("token-expiry renewal: renews short TTL token over live server and handles 401 renewal", async () => {
    const serverClient = new ReturnGuardClient({
      baseUrl: BASE_URL,
      apiKey: TEST_API_KEY,
    });

    let fetchCount = 0;
    const fetchShortTtlToken = async () => {
      fetchCount++;
      const res = await (serverClient as any).transport.request<{ token: string }>({
        method: "POST",
        path: "/v1/auth/embed-tokens",
        body: { sub: `user_ttl_${fetchCount}`, ttl_seconds: 3 },
      });
      return res.token;
    };

    const tokenProvider = createRenewingTokenProvider({
      fetchToken: fetchShortTtlToken,
      refreshMarginSeconds: 1, // Proactive refresh when remaining <= 1s
    });

    const client = new ReturnGuardClient({
      baseUrl: BASE_URL,
      tokenProvider,
    });

    // 1. Initial successful call
    const firstAnalytics = await client.analytics.summary();
    expect(firstAnalytics.tenant_id).toBe(TEST_MERCHANT_ID);
    expect(fetchCount).toBe(1);

    // 2. Wait 3.2 seconds for token to expire
    await new Promise((resolve) => setTimeout(resolve, 3200));

    // 3. Second call automatically renews because cached token has expired
    const secondAnalytics = await client.analytics.summary();
    expect(secondAnalytics.tenant_id).toBe(TEST_MERCHANT_ID);
    expect(fetchCount).toBeGreaterThanOrEqual(2);

    // 4. Test forced renewal on 401: mock tokenProvider returning invalid token first, then valid
    let attempt = 0;
    const simulated401Provider = async (ctx?: { forceRefresh?: boolean }) => {
      attempt++;
      if (attempt === 1 && !ctx?.forceRefresh) {
        // Return an already-expired token
        return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJtZXJjaF9jb250cmFjdF9lMmUiLCJzdWIiOiJ4Iiwic2NwIjpbInJlYWQiXSwiYXVkIjoicmV0dXJuZ3VhcmQtc2RrIiwiaWF0IjoxNTAwMDAwMDAwLCJleHAiOjE1MDAwMDAwMTB9.invalidsig";
      }
      return fetchShortTtlToken();
    };

    const client401 = new ReturnGuardClient({
      baseUrl: BASE_URL,
      tokenProvider: simulated401Provider,
    });

    // The first attempt hits 401, client re-requests tokenProvider with forceRefresh, and succeeds
    const resAfter401 = await client401.analytics.summary();
    expect(resAfter401.tenant_id).toBe(TEST_MERCHANT_ID);
    expect(attempt).toBe(2);
  }, 15000);

});

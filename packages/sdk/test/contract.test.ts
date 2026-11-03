import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, ChildProcess } from "node:child_process";
import * as path from "node:path";
import { ReturnGuardClient } from "../src/client";
import { createRenewingTokenProvider } from "../src/auth";
import { AuthenticationError } from "../src/errors";

const TEST_PORT = 8765;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const SIGNING_KEY = "super_secure_embed_signing_key_at_least_32_bytes_long!";
const TEST_API_KEY = "rg_live_contract_test_key_001";
const TEST_MERCHANT_ID = "merch_contract_e2e";
const REPO_ROOT = path.resolve(__dirname, "../../..");

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
    // Seed test merchant and API key into DB
    const setupScript = `
import sys
sys.path.insert(0, r"${REPO_ROOT}")
from db.session import SessionLocal
from db.models import Merchant, APIKey
import hashlib, uuid

db = SessionLocal()
m = db.query(Merchant).filter(Merchant.id == '${TEST_MERCHANT_ID}').first()
if not m:
    m = Merchant(id='${TEST_MERCHANT_ID}', name='Contract Test Merchant', email='contract@test.com')
    db.add(m)

h = hashlib.sha256('${TEST_API_KEY}'.encode('utf-8')).hexdigest()
k = db.query(APIKey).filter(APIKey.merchant_id == '${TEST_MERCHANT_ID}').first()
if not k:
    k = APIKey(
        id=str(uuid.uuid4()),
        merchant_id='${TEST_MERCHANT_ID}',
        key_prefix='rg_live_',
        key_hash=h,
        name='Contract Test Key',
        is_active=True,
    )
    db.add(k)
db.commit()
db.close()
`;

    const p = spawn("python", ["-c", setupScript], { cwd: REPO_ROOT, stdio: "inherit" });
    await new Promise((resolve) => p.on("exit", resolve));

    // Start uvicorn server with cwd set to repo root
    const env = {
      ...process.env,
      RG_EMBED_SIGNING_KEY: SIGNING_KEY,
      PYTHONPATH: REPO_ROOT,
    };

    serverProc = spawn(
      "python",
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
    // 1. Merchant backend issues embed token
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

    // 2. Client SDK initialized with renewing tokenProvider
    const tokenProvider = createRenewingTokenProvider({
      fetchToken: async () => tokenRes.token,
    });

    const embedClient = new ReturnGuardClient({
      baseUrl: BASE_URL,
      tokenProvider,
    });

    // Decisions list
    const decisions = await embedClient.decisions.list({ limit: 5 });
    expect(Array.isArray(decisions.items)).toBe(true);

    // Analytics summary
    const analytics = await embedClient.analytics.summary();
    expect(analytics.tenant_id).toBe(TEST_MERCHANT_ID);

    // Model performance
    const perf = await embedClient.models.performance();
    expect(perf.synthetic.dataset_name).toBe("synthetic");
    expect(perf.ieee_cis.dataset_name).toBe("ieee_cis");

    // Embed token is forbidden on scoreTransaction
    await expect(
      embedClient.scoreTransaction({ amount: 100 })
    ).rejects.toThrow(AuthenticationError);
  });
});

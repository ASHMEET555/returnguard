import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, ChildProcess } from "node:child_process";
import * as path from "node:path";
import { ReturnGuardClient } from "../src/client";
import { createRenewingTokenProvider } from "../src/auth";
import { AuthenticationError, NotFoundError, RateLimitError } from "../src/errors";

const TEST_PORT = 8766;
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

describe("Tenant Isolation and Rate Limiting over HTTP", () => {
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

  it("tenant isolation: second tenant decision ID returns NotFoundError (404)", async () => {
    // Tenant A creates a score
    const clientA = new ReturnGuardClient({
      baseUrl: BASE_URL,
      apiKey: TEST_API_KEY,
    });

    const scoreA = await clientA.scoreTransaction({
      order_id: `ord_iso_${Date.now()}`,
      amount: 1200.0,
      channel: "paypal",
    });
    expect(scoreA.decision_id).toBeDefined();

    // Tenant B attempts to read Tenant A's decision
    const clientB = new ReturnGuardClient({
      baseUrl: BASE_URL,
      apiKey: TEST_API_KEY_B,
    });

    await expect(
      clientB.decisions.get(scoreA.decision_id!)
    ).rejects.toThrow(NotFoundError);
  });

  it("rate limits: exceeding per-key rate limit returns RateLimitError with retryAfterSeconds", async () => {
    const client = new ReturnGuardClient({
      baseUrl: BASE_URL,
      apiKey: TEST_API_KEY,
      retry: { maxRetries: 0 }, // Do not retry so we catch the 429 directly
    });

    let rateLimitedError: RateLimitError | null = null;
    // Hammer the endpoint up to 150 rapid requests (per-key burst limit is 60 or 100/min)
    for (let i = 0; i < 150; i++) {
      try {
        await client.analytics.summary();
      } catch (err: any) {
        if (err instanceof RateLimitError) {
          rateLimitedError = err;
          break;
        }
      }
    }

    expect(rateLimitedError).not.toBeNull();
    expect(rateLimitedError?.status).toBe(429);
    expect(rateLimitedError?.retryAfterSeconds).toBeDefined();
    expect(rateLimitedError?.retryAfterSeconds).toBeGreaterThan(0);
  });
});

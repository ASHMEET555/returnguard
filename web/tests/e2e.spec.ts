import { test, expect } from "@playwright/test";
import * as path from "path";

const SCREENSHOT_DIR = path.resolve(__dirname, "../../docs/screenshots/landing");
const TEST_ADMIN_TOKEN = "rg_admin_super_secret_token_1234567890_abcdef";

test.describe("ReturnGuard Onboarding & Key Management E2E", () => {
  test("complete landing, key management lifecycle and docs verification", async ({ page }) => {
    // 1. Visit landing page
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Return Fraud Defense");
    await expect(page.locator("text=B2B Payment-Abuse Intelligence Engine")).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "landing-hero.png") });

    // Verify How it works
    const howItWorks = page.locator("#how-it-works");
    await expect(howItWorks).toBeVisible();
    await howItWorks.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "landing-how-it-works.png") });

    // Verify Model results & honest limits disclosure
    await expect(page.locator("text=Model Performance & Scientific Honesty")).toBeVisible();
    await expect(page.locator("text=Honest Limits Disclosure")).toBeVisible();
    await expect(page.locator("text=6.31%*")).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "landing-model-results.png") });

    // 2. Navigate to Settings page
    await page.click("text=Manage Keys");
    await expect(page).toHaveURL(/.*settings/);
    await expect(page.locator("h2")).toContainText("Administrator Authentication");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "settings-login.png") });

    // 3. Authenticate with admin token
    await page.fill('input[type="password"]', TEST_ADMIN_TOKEN);
    await page.click('button:has-text("Authenticate Session")');

    // 4. Verify authenticated settings view and wait for merchants to load
    await expect(page.locator("text=Active & Historical API Keys")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("select option").first()).toBeAttached({ timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "settings-keys.png") });

    // 5. Generate API Key
    await page.click('button:has-text("+ Generate API Key")');
    await page.fill('input[id="key-label"]', "E2E Test Production Key");
    await page.click('button:has-text("Generate Key")');

    // 6. Verify One-Time Reveal Modal
    await expect(page.locator("text=API Key Generated")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Copy this key now")).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "settings-key-reveal.png") });

    // Dismiss reveal modal
    await page.click('button:has-text("I have safely copied my key")');
    await expect(page.locator("text=E2E Test Production Key").first()).toBeVisible();

    // 7. Rotate key
    await page.locator('table button:has-text("Rotate")').first().click();
    await expect(page.locator("text=Rotate API Key?")).toBeVisible();
    await page.click('button:has-text("Rotate & Generate New")');

    // Verify new key revealed
    await expect(page.locator("text=API Key Generated")).toBeVisible();
    await page.click('button:has-text("I have safely copied my key")');

    // 8. Revoke key
    await page.locator('table button:has-text("Revoke")').first().click();
    await expect(page.locator("text=Revoke API Key?")).toBeVisible();
    await page.click('button:has-text("Revoke Immediately")');

    // 9. Navigate to /docs/integrate
    await page.goto("/docs/integrate");
    await expect(page.locator("h1")).toContainText("Integrate ReturnGuard SDK");
    await expect(page.locator("text=ebf9b0b4422c503e5f143d4cf90d76a18a472516dc5437ba637a0c208d5444a9")).toBeVisible();
    await expect(page.locator("text=npm install ./downloads/returnguard-sdk.tgz")).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "docs-integrate.png") });

    // 10. Navigate to /dashboard
    await page.goto("/dashboard");
    await expect(page.locator("header").first()).toContainText("ReturnGuard");
    await expect(page.locator("header").first()).toContainText("Operations Console");
  });
});

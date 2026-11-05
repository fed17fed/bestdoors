import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";
import { testDatabaseUrl } from "../api/tests/support/test-db";

/**
 * End-to-end tests. They start their OWN servers on other ports (API 4100, web 3100)
 * with the test database (bestdoors_test, reset + seeded first), so your dev servers
 * (3000/4000) and your dev database are not touched.
 *
 *   npm run test:e2e          everything except the Stripe payment
 *   npm run test:e2e:stripe   only the Stripe test-card payment (needs internet + STRIPE_SECRET_KEY)
 */
const API_PORT = 4100;
const WEB_PORT = 3100;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const DB = testDatabaseUrl();
const stripeOnly = !!process.env.E2E_STRIPE;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // One shared test database: run the files one after another.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  grep: stripeOnly ? /@stripe/ : undefined,
  grepInvert: stripeOnly ? undefined : /@stripe/,
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /(shop|pages)\.spec\.ts/ },
  ],
  webServer: [
    {
      // 1) fresh test database, 2) API on port 4100
      command: "npx tsx apps/web/e2e/support/prepare-db.ts && npm run dev --workspace=@bestdoors/api",
      cwd: ROOT,
      url: `http://localhost:${API_PORT}/api/v1/health`,
      env: {
        PORT: String(API_PORT),
        DATABASE_URL: DB,
        DIRECT_URL: DB,
        WEB_URL: `http://localhost:${WEB_PORT}`,
        // no real emails and no local Blob token during tests
        RESEND_API_KEY: "",
        SHOP_EMAIL: "",
        BLOB_READ_WRITE_TOKEN: "",
      },
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: "ignore",
    },
    {
      // production build of the shop, talking to the test API
      command: `npx next build && npx next start -p ${WEB_PORT}`,
      cwd: HERE,
      url: `http://localhost:${WEB_PORT}/en`,
      env: { API_URL: `http://localhost:${API_PORT}`, NEXT_PUBLIC_SITE_URL: `http://localhost:${WEB_PORT}` },
      reuseExistingServer: false,
      timeout: 300_000,
      stdout: "ignore",
    },
  ],
});

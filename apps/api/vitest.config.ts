import { defineConfig } from "vitest/config";
import { testDatabaseUrl } from "./tests/support/test-db";

// Tests use their own database (e.g. bestdoors_test), never the development one.
// It is reset and seeded in tests/support/global-setup.ts before every run.
const url = testDatabaseUrl();

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["tests/support/global-setup.ts"],
    env: { DATABASE_URL: url, DIRECT_URL: url, NODE_ENV: "test" },
    setupFiles: ["dotenv/config"],
    testTimeout: 20000,
    hookTimeout: 60000,
  },
});

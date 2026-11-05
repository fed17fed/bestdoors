import { prepareTestDatabase, testDatabaseUrl } from "../../../api/tests/support/test-db";

// Started by playwright.config.ts before the test API: fresh, seeded test database.
const url = testDatabaseUrl();
await prepareTestDatabase(url);
console.log(`[e2e] ${new URL(url).pathname.slice(1)} reset and seeded`);

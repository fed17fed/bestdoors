import { prepareTestDatabase, testDatabaseUrl } from "./test-db";

/** Vitest: fresh test database before the run. */
export default async function setup() {
  const url = testDatabaseUrl();
  const started = Date.now();
  await prepareTestDatabase(url);
  console.log(`[tests] database ${new URL(url).pathname.slice(1)} reset and seeded in ${Date.now() - started} ms`);
}

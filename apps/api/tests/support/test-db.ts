/**
 * Test database helpers, used by Vitest (API tests) and Playwright (E2E tests).
 * Tests never touch the development database: they use "<dev name>_test" (e.g. bestdoors_test)
 * in the same Postgres, which is reset and seeded before every run.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import pg from "pg";

export const API_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Reads apps/api/.env (without overriding variables that are already set). */
export function loadApiEnv() {
  loadEnv({ path: path.join(API_DIR, ".env"), quiet: true });
}

/** TEST_DATABASE_URL, or DATABASE_URL with the database name + "_test". */
export function testDatabaseUrl(): string {
  loadApiEnv();
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const dev = process.env.DATABASE_URL;
  if (!dev) throw new Error("DATABASE_URL is not set (apps/api/.env)");
  const url = new URL(dev);
  const name = url.pathname.replace(/^\//, "");
  url.pathname = `/${name.endsWith("_test") ? name : `${name}_test`}`;
  return url.toString();
}

function assertTestDb(url: string) {
  const name = new URL(url).pathname.replace(/^\//, "");
  // Safety: the reset below drops all data, so it may only run on a *_test database.
  if (!name.endsWith("_test")) throw new Error(`Refusing to reset "${name}": the name must end with "_test"`);
  return name;
}

/** Creates the test database if needed, applies all migrations from scratch and runs the seed. */
export async function prepareTestDatabase(url = testDatabaseUrl()) {
  const name = assertTestDb(url);
  const admin = new URL(url);
  admin.pathname = "/postgres";
  admin.search = "";
  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const { rowCount } = await client.query("select 1 from pg_database where datname = $1", [name]);
    if (!rowCount) await client.query(`create database "${name.replace(/"/g, "")}"`);
  } finally {
    await client.end();
  }

  const env = { ...process.env, DATABASE_URL: url, DIRECT_URL: url };
  const run = (args: string[]) => execFileSync("npx", args, { cwd: API_DIR, env, stdio: "pipe" });
  run(["prisma", "migrate", "reset", "--force"]);
  run(["tsx", "prisma/seed.ts"]);
}

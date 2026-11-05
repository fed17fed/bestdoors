import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test as base, expect } from "@playwright/test";

type Options = { closeCookieNotice: boolean };

/**
 * Our test(): the cookie notice is closed by default (it would cover buttons at the
 * bottom of small screens). Tests about the notice use test.use({ closeCookieNotice: false }).
 * Browser console errors make the test fail.
 */
export const test = base.extend<Options & { consoleErrors: string[] }>({
  closeCookieNotice: [true, { option: true }],
  consoleErrors: [
    async ({ page }, provide) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error" && !/status of 40[134]/.test(m.text())) errors.push(m.text());
      });
      await provide(errors);
      expect(errors, "browser console errors").toEqual([]);
    },
    { auto: true },
  ],
  page: async ({ page, closeCookieNotice }, provide) => {
    if (closeCookieNotice) {
      await page.addInitScript(() => {
        try {
          localStorage.setItem("bd_cookie_notice", "ok");
        } catch {
          // ignore
        }
      });
    }
    await provide(page);
  },
});

export { expect };

/** Admin login: environment variables (CI) or apps/api/.env (the seed creates this user in the test database). */
export function adminCredentials() {
  let env = "";
  try {
    env = readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../api/.env"), "utf8");
  } catch {
    // no .env file (CI): only environment variables
  }
  const read = (k: string) =>
    process.env[k] || (env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.replace(/^["']|["']$/g, "") ?? "");
  return { email: read("ADMIN_EMAIL") || "admin@bestdoors.ie", password: read("ADMIN_PASSWORD") };
}

/** A small valid PNG (1×1 px) for upload tests. */
export const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

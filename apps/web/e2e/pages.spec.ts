import { expect, test } from "./support/fixtures";

const PAGES = ["about", "contact", "delivery", "returns", "privacy", "terms"];

for (const locale of ["en", "uk"]) {
  test(`info pages open in ${locale}`, async ({ page }) => {
    for (const p of PAGES) {
      const res = await page.goto(`/${locale}/${p}`);
      expect(res?.status(), p).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator(`link[rel=canonical]`)).toHaveAttribute("href", new RegExp(`/${locale}/${p}$`));
    }
  });
}

test.describe("cookie notice", () => {
  test.use({ closeCookieNotice: false });
  test("shows once and stays closed after OK", async ({ page }) => {
    await page.goto("/en");
    const notice = page.getByRole("region", { name: "Cookies" });
    await expect(notice).toBeVisible();
    await notice.getByRole("link", { name: "Read more" }).click();
    await expect(page).toHaveURL(/\/en\/privacy#cookies$/);
    await page.getByRole("region", { name: "Cookies" }).getByRole("button", { name: "OK" }).click();
    await page.reload();
    await expect(page.getByRole("region", { name: "Cookies" })).toHaveCount(0);
  });
});

test("sitemap.xml and robots.txt", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain("/en/doors/exterior-doors/dublin-composite-front-door");
  expect(xml).toContain('hreflang="uk-UA"');
  expect(xml).not.toContain("/admin");

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toMatch(/Sitemap: http:\/\/localhost:3100\/sitemap\.xml/);
});

test("no horizontal scroll on key pages", async ({ page }) => {
  for (const url of ["/en", "/en/doors", "/uk/quote", "/en/privacy"]) {
    await page.goto(url);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, url).toBe(false);
  }
});

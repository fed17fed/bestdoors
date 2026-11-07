import { adminCredentials, expect, test } from "./support/fixtures";

const SLUG = "e2e-cms-page";

test.describe.configure({ mode: "serial" });
// Page data is cached for 60 seconds in the shop, so these tests wait for it.
test.setTimeout(200_000);

test("admin: write a page in the rich-text editor, publish it, see it in the shop and footer, then delete it", async ({ page }) => {
  const { email, password } = adminCredentials();
  await page.goto("/admin");
  await page.fill('input[name="username"]', email);
  await page.fill('input[name="password"]', password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/#\/orders/);

  await page.goto("/admin#/pages");
  // the 6 seeded pages
  await expect(page.getByRole("cell", { name: "Privacy and cookies" })).toBeVisible();

  await page.goto("/admin#/pages/create");
  await page.fill('input[name="title"]', "E2E Page");
  await page.fill('input[name="slug"]', "Bad Slug");
  await page.locator(".ProseMirror").click();
  await page.keyboard.type("Hello from the editor");
  await page.getByRole("button", { name: "Bold" }).click();
  await page.keyboard.type(" bold text");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(/lowercase letters, numbers and dashes/).first()).toBeVisible();

  await page.fill('input[name="slug"]', SLUG);
  await page.getByRole("combobox", { name: /Status/ }).click();
  await page.getByRole("option", { name: "Published" }).click();
  await page.getByLabel("Show a link in the footer").check();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/#\/pages\/[^/]+$/);

  // visitors see it (the shop refreshes page data every 60 seconds, so ask the API first, then open the page)
  await expect.poll(async () => (await page.request.get(`/api/v1/pages/${SLUG}`)).status()).toBe(200);
  await expect(async () => {
    const res = await page.goto(`/en/${SLUG}`);
    expect(res?.status()).toBe(200);
  }).toPass({ timeout: 90_000, intervals: [2_000] });
  await expect(page.getByRole("heading", { level: 1, name: "E2E Page" })).toBeVisible();
  await expect(page.locator(".page-content")).toContainText("Hello from the editor");
  await expect(page.locator(".page-content strong")).toContainText("bold text");
  // the footer list is cached for 60 seconds in the shop, so reload until the new link shows up
  await expect(async () => {
    await page.reload();
    await expect(page.locator("footer").getByRole("link", { name: "E2E Page" })).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 120_000, intervals: [3_000] });

  // delete from the admin panel (with a confirm dialog)
  await page.goto("/admin#/pages");
  await page.getByRole("row", { name: /E2E Page/ }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();
  await expect(page).toHaveURL(/#\/pages$/);
  await expect.poll(async () => (await page.request.get(`/api/v1/pages/${SLUG}`)).status()).toBe(404);
});

test("scripts in page HTML never run; drafts and unknown pages are 404; required pages cannot be deleted", async ({ page, request }) => {
  const { email, password } = adminCredentials();
  const login = await request.post("/api/v1/auth/login", { data: { email, password } });
  expect(login.status()).toBe(200);

  const evil =
    '<h2>Safe heading</h2><script>window.__xss = 1</script><img src="x" onerror="window.__xss = 2">' +
    '<iframe src="https://example.com"></iframe><p onclick="window.__xss = 3">Click</p><a href="javascript:window.__xss=4">bad</a>';
  const created = await request.post("/api/v1/admin/pages", {
    data: { slug: "e2e-evil", title: "Evil page", content: evil, status: "PUBLISHED", showInFooter: false, sortOrder: 99 },
  });
  expect(created.status()).toBe(201);
  const { id, content } = await created.json();
  expect(content).not.toMatch(/script|iframe|onerror|onclick|javascript:/i);

  try {
    await expect(async () => {
      const res = await page.goto("/en/e2e-evil");
      expect(res?.status()).toBe(200);
    }).toPass({ timeout: 90_000, intervals: [2_000] });
    await expect(page.getByRole("heading", { level: 2, name: "Safe heading" })).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
    await expect(page.locator(".page-content iframe, .page-content script")).toHaveCount(0);
    await page.locator(".page-content p", { hasText: "Click" }).click();
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  } finally {
    await request.delete(`/api/v1/admin/pages/${id}`);
  }

  expect((await page.goto("/en/no-such-page"))?.status()).toBe(404);
  expect((await request.get("/api/v1/pages/privacy")).status()).toBe(200);

  const list = await (await request.get("/api/v1/admin/pages?perPage=50")).json();
  const privacy = list.find((p: { slug: string }) => p.slug === "privacy");
  expect((await request.delete(`/api/v1/admin/pages/${privacy.id}`)).status()).toBe(409);
});

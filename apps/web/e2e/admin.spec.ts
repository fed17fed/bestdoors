import { adminCredentials, expect, test } from "./support/fixtures";

test("admin: wrong password, login, quote status", async ({ page, request }) => {
  // a quote to work with
  const created = await request.post("/api/v1/quotes", {
    data: { name: "Admin E2E", email: "admin-e2e@example.com", doorType: "INTERIOR", locale: "en" },
  });
  expect(created.status()).toBe(201);
  const { reference } = await created.json();

  await page.goto("/admin");
  await page.fill('input[name="username"]', "admin@bestdoors.ie");
  await page.fill('input[name="password"]', "wrong-password");
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText("Wrong email or password")).toBeVisible();

  const { email, password } = adminCredentials();
  await page.fill('input[name="username"]', email);
  await page.fill('input[name="password"]', password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/#\/orders/);

  await page.goto("/admin#/quotes");
  await page.getByRole("cell", { name: reference }).click();
  await expect(page.getByText(`Quote ${reference}`).first()).toBeVisible();
  await page.getByRole("combobox").last().click();
  await page.getByRole("option", { name: "Quote sent" }).click();
  await page.getByRole("button", { name: "Save status" }).click();
  await expect(page).toHaveURL(/#\/quotes$/);
  await expect(page.getByRole("row", { name: new RegExp(reference) })).toContainText("Quote sent");
});

test("a customer account cannot use the admin API", async ({ request }) => {
  await request.post("/api/v1/auth/register", {
    data: { email: `e2e-${Date.now()}@example.com`, password: "password123", name: "E2E Customer" },
  });
  expect((await request.get("/api/v1/admin/orders")).status()).toBe(403);
});

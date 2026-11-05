import { expect, test } from "./support/fixtures";

const PRODUCT = "/en/doors/exterior-doors/dublin-composite-front-door";

test("browse → configure → cart → change quantity → Ukrainian → remove", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // catalog → category → product
  await page.goto("/en/doors/exterior-doors");
  await page.locator(`a[href="${PRODUCT}"]`).first().click();
  await expect(page.getByRole("heading", { level: 1, name: /Dublin/ })).toBeVisible();

  // configure: Golden Oak colour (+€120), price updates
  const price = page.locator("p[aria-live=polite]").first();
  const before = await price.innerText();
  await page.getByText("Golden Oak", { exact: true }).click();
  await expect(price).not.toHaveText(before);
  await expect(price).toContainText("€1,410.00");

  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByText("Added to your cart.")).toBeVisible();
  await expect(page.getByRole("link", { name: /Cart, 1 item/ })).toBeVisible();

  // cart
  await page.getByRole("link", { name: "View cart" }).click();
  await expect(page).toHaveURL(/\/en\/cart$/);
  await expect(page.getByText("Colour: Golden Oak")).toBeVisible();
  await page.getByRole("button", { name: "Increase quantity" }).click();
  await expect(page.getByText("2 items")).toBeVisible();
  await expect(page.locator("aside")).toContainText("€2,820.00");

  // the cart in Ukrainian
  await page.goto("/uk/cart");
  await expect(page.getByRole("heading", { name: "Ваш кошик" })).toBeVisible();
  await expect(page.getByText("Композитні вхідні двері Dublin")).toBeVisible();
  await expect(page.locator("aside")).toContainText("2 820,00 €");

  await page.getByRole("button", { name: "Видалити" }).click();
  await expect(page.getByText("Ваш кошик порожній.")).toBeVisible();
});

test("catalog filters work through the URL", async ({ page }) => {
  await page.goto("/en/doors/interior-doors?sort=price-asc");
  const prices = await page.locator("article").allInnerTexts();
  expect(prices.length).toBeGreaterThan(1);
  await page.goto("/en/doors/interior-doors?q=zzzz-no-door");
  await expect(page.getByText("No doors match your filters.")).toBeVisible();
});

test("unknown pages show the translated 404", async ({ page }) => {
  const res = await page.goto("/uk/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.locator("body")).toContainText("404");
});

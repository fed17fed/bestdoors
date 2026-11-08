import { expect, test } from "./support/fixtures";

const PRODUCT = "/en/doors/exterior-doors/dublin-composite-front-door";

test("browse → configure → cart → change quantity → remove", async ({ page }) => {
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

  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("Your cart is empty.")).toBeVisible();
});

test("old Ukrainian URLs redirect to English", async ({ page }) => {
  await page.goto("/uk/doors");
  await expect(page).toHaveURL(/\/en\/doors$/);
  await expect(page.getByRole("button", { name: "UA" })).toHaveCount(0);
});

test("catalog filters work through the URL", async ({ page }) => {
  await page.goto("/en/doors/interior-doors?sort=price-asc");
  const prices = await page.locator("article").allInnerTexts();
  expect(prices.length).toBeGreaterThan(1);
  await page.goto("/en/doors/interior-doors?q=zzzz-no-door");
  await expect(page.getByText("No doors match your filters.")).toBeVisible();
});

test("unknown pages show the translated 404", async ({ page }) => {
  const res = await page.goto("/en/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.locator("body")).toContainText("404");
});

test("home shows exactly 2 main category tiles", async ({ page }) => {
  await page.goto("/en");
  const tiles = page.getByTestId("category-tile");
  await expect(tiles).toHaveCount(2);
  await expect(tiles.nth(0)).toHaveAttribute("href", "/en/doors/exterior-doors");
  await expect(tiles.nth(1)).toHaveAttribute("href", "/en/doors/interior-doors");
  // the number on the tile = the number of doors on the category page (12 / 9 in the dev data)
  for (const [i, slug] of ["exterior-doors", "interior-doors"].entries()) {
    const count = (await tiles.nth(i).innerText()).match(/(\d+) doors?/)?.[1];
    expect(count).toBeTruthy();
    await page.goto(`/en/doors/${slug}`);
    await expect(page.locator("section[aria-live=polite] > p").first()).toHaveText(`${count} doors`);
    await page.goto("/en");
  }
  await expect(tiles.nth(0).locator("img")).toHaveCount(0); // drawings, no photos
});

test("exterior main page: 4 subcategory tiles; tile opens the subcategory", async ({ page }) => {
  await page.goto("/en/doors/exterior-doors");
  await expect(page.getByTestId("category-tile")).toHaveCount(4);
  await expect(page.locator("section[aria-live=polite] > p").first()).toHaveText(/^\d+ doors$/);
  await page.getByTestId("category-tile").filter({ hasText: "Exterior Sliding Doors" }).click();
  await expect(page).toHaveURL(/\/en\/doors\/sliding-doors$/);
  await expect(page.getByTestId("category-tile")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /All Exterior Doors/ })).toBeVisible();
});

test("interior main page: 2 subcategory tiles", async ({ page }) => {
  await page.goto("/en/doors/interior-doors");
  await expect(page.getByTestId("category-tile")).toHaveCount(2);
  await expect(page.locator("section[aria-live=polite] > p").first()).toHaveText(/^\d+ doors$/);
  await page.getByTestId("category-tile").first().click();
  await expect(page).toHaveURL(/\/en\/doors\/interior-(sliding|french)-doors$/);
});

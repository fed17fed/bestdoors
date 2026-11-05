import { PNG, expect, test } from "./support/fixtures";

test("quote from a product page with a photo (Ukrainian)", async ({ page }) => {
  await page.goto("/uk/doors/exterior-doors/dublin-composite-front-door");
  await page.locator('a[href*="/quote?product="]').click();
  await expect(page).toHaveURL(/\/uk\/quote\?product=dublin-composite-front-door/);
  await expect(page.getByText("Модель: Композитні вхідні двері Dublin")).toBeVisible();
  await expect(page.locator("#q-type")).toHaveValue("EXTERIOR");

  await page.fill("#q-name", "Олена Коваль");
  await page.fill("#q-email", "olena@example.com");
  await page.fill("#q-width", "1000");
  await page.fill("#q-height", "2150");

  // wrong Eircode → message, nothing sent
  await page.fill("#q-eircode", "H91 AB12");
  await page.getByRole("button", { name: "Надіслати запит" }).click();
  await expect(page.locator("#q-eircode-hint")).toHaveText("Це не схоже на правильний Eircode.");

  await page.fill("#q-eircode", "d02x285");
  await page.locator("#q-photos").setInputFiles({ name: "door.png", mimeType: "image/png", buffer: PNG });
  await expect(page.locator("form img")).toHaveCount(1);

  await page.getByRole("button", { name: "Надіслати запит" }).click();
  await expect(page.getByText("Дякуємо! Ми отримали ваш запит")).toBeVisible();
  await expect(page.getByText(/Номер вашого запиту: Q-[A-Z0-9]{6}/)).toBeVisible();
});

test("required fields are checked by the browser", async ({ page }) => {
  await page.goto("/en/quote");
  await page.getByRole("button", { name: "Send request" }).click();
  // still on the form, the name field is invalid
  expect(await page.locator("#q-name").evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
  await expect(page.getByText("Thank you!")).toHaveCount(0);
});

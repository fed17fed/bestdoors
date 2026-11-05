import { expect, test } from "./support/fixtures";

// Real payment in Stripe TEST mode (card 4242…). Runs only with: npm run test:e2e:stripe
test("pay with the Stripe test card @stripe", async ({ page, request }) => {
  test.setTimeout(120_000);
  const product = await (await request.get("/api/v1/products/dublin-composite-front-door")).json();
  await page.goto("/uk/cart");
  await page.request.post("/api/v1/cart/items", { data: { productId: product.id, quantity: 1 } });
  await page.reload();
  await page.getByRole("button", { name: "Оформити замовлення" }).click();
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 });

  await page.fill("#email", "e2e-buyer@example.com");
  await page.fill("#shippingName", "Aoife Murphy");
  const manual = page.getByText("Enter address manually");
  if (await manual.count()) await manual.click();
  await page.fill("#shippingAddressLine1", "1 Main Street");
  await page.fill("#shippingLocality", "Galway");
  const county = page.locator("#shippingAdministrativeArea");
  if (await county.count()) await county.selectOption({ label: "Galway" });
  const eircode = page.locator("#shippingPostalCode");
  if (await eircode.count()) await eircode.fill("H91 E2K3");
  const phone = page.locator("#phoneNumber");
  if (await phone.count()) await phone.fill("871234567");
  await page.locator('[data-testid="card-accordion-item"]').click();
  await page.fill("#cardNumber", "4242424242424242");
  await page.fill("#cardExpiry", "12 / 34");
  await page.fill("#cardCvc", "123");
  const billingName = page.locator("#billingName");
  if ((await billingName.count()) && (await billingName.isVisible())) await billingName.fill("Aoife Murphy");
  await page.locator('[data-testid="hosted-payment-submit-button"]').click();

  await page.waitForURL(/\/uk\/checkout\/success/, { timeout: 60_000 });
  await expect(page.getByText("Дякуємо! Ваше замовлення підтверджено")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("link", { name: /Кошик, порожній/ })).toBeVisible();
});

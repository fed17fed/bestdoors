import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./support/fixtures";

// Automatic accessibility check (WCAG 2.x A/AA rules). Fails on "serious" and "critical" problems.
const PAGES = ["/en", "/en/doors", "/en/doors/exterior-doors", "/en/doors/exterior-doors/dublin-composite-front-door", "/en/cart", "/en/quote", "/en/privacy"];

for (const url of PAGES) {
  test(`accessibility ${url}`, async ({ page }) => {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const bad = result.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .flatMap((v) => v.nodes.slice(0, 5).map((n) => `${v.id} (${v.impact}): ${n.target.join(" ")} – ${n.any[0]?.message ?? v.help}`));
    expect(bad).toEqual([]);
  });
}

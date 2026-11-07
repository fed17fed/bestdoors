import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

// page-html.ts has no imports, so it can be compiled and loaded directly.
const src = readFileSync(new URL("../src/lib/page-html.ts", import.meta.url), "utf8");
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { addHeadingIds, markPlaceholders, hasPlaceholders, slugify } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);

test("slugify", () => {
  assert.equal(slugify("Cookies"), "cookies");
  assert.equal(slugify("<strong>Your rights &amp; more</strong>"), "your-rights-more");
});

test("headings get unique ids", () => {
  const { html, headings } = addHeadingIds("<h2>Cookies</h2><p>x</p><h2>Cookies</h2><h2><em>Law</em></h2>");
  assert.equal(html, '<h2 id="cookies">Cookies</h2><p>x</p><h2 id="cookies-2">Cookies</h2><h2 id="law"><em>Law</em></h2>');
  assert.deepEqual(headings.map((h) => h.text), ["Cookies", "Cookies", "Law"]);
});

test("missing facts are highlighted", () => {
  const html = "<p>Call [TO FILL: phone number] now</p>";
  assert.ok(hasPlaceholders(html));
  assert.equal(markPlaceholders(html), "<p>Call <mark>[TO FILL: phone number]</mark> now</p>");
  assert.ok(!hasPlaceholders("<p>All good</p>"));
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const load = (l) => JSON.parse(readFileSync(new URL(`../messages/${l}.json`, import.meta.url), "utf8"));

test("English is the only language file", () => {
  assert.ok(existsSync(new URL("../messages/en.json", import.meta.url)));
  assert.ok(!existsSync(new URL("../messages/uk.json", import.meta.url)));
});

test("no empty translations", () => {
  const flat = (o) => Object.values(o).flatMap((v) => (typeof v === "object" ? flat(v) : [v]));
  assert.ok(flat(load("en")).every((v) => typeof v === "string" && v.trim()), "en has empty text");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const load = (l) => JSON.parse(readFileSync(new URL(`../messages/${l}.json`, import.meta.url), "utf8"));
const keys = (o, p = "") =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === "object" ? keys(v, `${p}${k}.`) : [`${p}${k}`])).sort();

test("en.json and uk.json have the same keys", () => {
  assert.deepEqual(keys(load("uk")), keys(load("en")));
});

test("no empty translations", () => {
  for (const l of ["en", "uk"]) {
    const flat = (o) => Object.values(o).flatMap((v) => (typeof v === "object" ? flat(v) : [v]));
    assert.ok(flat(load(l)).every((v) => typeof v === "string" && v.trim()), `${l} has empty text`);
  }
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { filterPatterns } from "./catalog.mjs";

const P = [
  { registry: "@8bitcn", slug: "8bitcn", name: "login-card", categories: ["forms", "authentication"] },
  { registry: "@fluid", slug: "fluid", name: "tabs-basic", categories: ["navigation"] },
  { registry: "@fluid", slug: "fluid", name: "badge-sizes", categories: ["data-display"] },
];

test("no selection returns all patterns", () => {
  assert.equal(filterPatterns(P, {}).length, 3);
  assert.equal(filterPatterns(P, { registries: [], categories: [] }).length, 3);
});

test("registry filter (OR within registries)", () => {
  assert.deepEqual(filterPatterns(P, { registries: ["@fluid"] }).map((p) => p.name), ["tabs-basic", "badge-sizes"]);
});

test("category filter (OR within categories)", () => {
  assert.deepEqual(filterPatterns(P, { categories: ["forms", "navigation"] }).map((p) => p.name), ["login-card", "tabs-basic"]);
});

test("registry AND category", () => {
  assert.deepEqual(filterPatterns(P, { registries: ["@fluid"], categories: ["navigation"] }).map((p) => p.name), ["tabs-basic"]);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveRegistryEntry } from "./registry-fetch.mjs";

const entries = [
  { name: "@8bitcn", url: "https://www.8bitcn.com/r/{name}.json" },
  { name: "@acme/ui", url: "https://acme.dev/r/{name}.json" },
];

test("matches by exact name", () => {
  assert.equal(resolveRegistryEntry(entries, "@8bitcn")?.name, "@8bitcn");
});

test("matches by bare name (adds @)", () => {
  assert.equal(resolveRegistryEntry(entries, "8bitcn")?.name, "@8bitcn");
});

test("matches by folder-safe name", () => {
  // folderFor("@acme/ui") === "@acme_ui"
  assert.equal(resolveRegistryEntry(entries, "@acme_ui")?.name, "@acme/ui");
});

test("returns null when not found", () => {
  assert.equal(resolveRegistryEntry(entries, "nope"), null);
});

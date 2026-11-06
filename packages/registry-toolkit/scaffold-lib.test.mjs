import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sanitizePackageName,
  registryKeyFor,
  applyRegistryRegistration,
} from "./scaffold-lib.mjs";

test("sanitizePackageName builds a scoped, url-safe name", () => {
  assert.equal(sanitizePackageName("@8bitcn"), "@pattern-sites/8bitcn");
  assert.equal(sanitizePackageName("@acme/ui"), "@pattern-sites/acme-ui");
  assert.equal(sanitizePackageName("Foo.Bar_UI"), "@pattern-sites/foo-bar-ui");
});

test("registryKeyFor ensures a single leading @", () => {
  assert.equal(registryKeyFor("8bitcn"), "@8bitcn");
  assert.equal(registryKeyFor("@8bitcn"), "@8bitcn");
});

test("applyRegistryRegistration merges without mutating input", () => {
  const config = { style: "new-york", registries: { "@old": "https://x/{name}.json" } };
  const next = applyRegistryRegistration(config, "@8bitcn", "https://www.8bitcn.com/r/{name}.json");
  assert.deepEqual(next.registries, {
    "@old": "https://x/{name}.json",
    "@8bitcn": "https://www.8bitcn.com/r/{name}.json",
  });
  assert.deepEqual(config.registries, { "@old": "https://x/{name}.json" }); // unmutated
});

test("applyRegistryRegistration rejects bad key/url", () => {
  assert.throws(() => applyRegistryRegistration({}, "8bitcn", "https://x/{name}.json"));
  assert.throws(() => applyRegistryRegistration({}, "@8bitcn", "https://x/no-placeholder.json"));
});

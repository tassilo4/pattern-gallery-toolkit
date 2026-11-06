import { test } from "node:test";
import assert from "node:assert/strict";
import baseConfig from "./config/next.config.base.mjs";

test("next base config targets static export", () => {
  assert.equal(baseConfig.output, "export");
  assert.equal(baseConfig.trailingSlash, true);
  assert.equal(baseConfig.images.unoptimized, true);
});

test("base config applies basePath from PATTERN_SITE_BASE_PATH", async () => {
  process.env.PATTERN_SITE_BASE_PATH = "/sites/foo";
  const mod = await import("./config/next.config.base.mjs?withbase=1");
  assert.equal(mod.default.basePath, "/sites/foo");
  assert.equal(mod.default.output, "export");
  delete process.env.PATTERN_SITE_BASE_PATH;
});

test("base config has no basePath when env is absent", async () => {
  delete process.env.PATTERN_SITE_BASE_PATH;
  const mod = await import("./config/next.config.base.mjs?nobase=1");
  assert.equal(mod.default.basePath, undefined);
});

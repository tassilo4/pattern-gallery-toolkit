import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listScaffoldedSites } from "./build-registry.mjs";

test("listScaffoldedSites finds only src/*/site dirs with a package.json", () => {
  const srcDir = mkdtempSync(join(tmpdir(), "src-"));
  mkdirSync(join(srcDir, "@a", "site"), { recursive: true });
  writeFileSync(join(srcDir, "@a", "site", "package.json"), "{}");
  mkdirSync(join(srcDir, "@b"), { recursive: true }); // no site/
  mkdirSync(join(srcDir, "@c", "site"), { recursive: true }); // site/ but no package.json

  const sites = listScaffoldedSites(srcDir);
  assert.deepEqual(sites, [join(srcDir, "@a", "site")]);
});

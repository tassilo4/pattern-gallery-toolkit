import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scaffoldSite } from "./scaffold-registry.mjs";

function makeTemplate() {
  const root = mkdtempSync(join(tmpdir(), "tmpl-"));
  mkdirSync(join(root, "app"), { recursive: true });
  writeFileSync(join(root, "package.json"), JSON.stringify({ name: "@pattern-sites/app-template" }) + "\n");
  writeFileSync(join(root, "components.json"), JSON.stringify({ style: "new-york", registries: {} }) + "\n");
  writeFileSync(join(root, "app", "page.tsx"), "export default () => null;\n");
  return root;
}

test("scaffoldSite copies template, renames package, registers registry", () => {
  const templateDir = makeTemplate();
  const dest = mkdtempSync(join(tmpdir(), "dest-"));
  const siteDir = join(dest, "site");

  const res = scaffoldSite({
    templateDir,
    siteDir,
    packageName: "@pattern-sites/8bitcn",
    registryKey: "@8bitcn",
    urlTemplate: "https://www.8bitcn.com/r/{name}.json",
  });

  assert.equal(res.created, true);
  assert.equal(res.registered, true);
  assert.ok(existsSync(join(siteDir, "app", "page.tsx")));
  assert.equal(JSON.parse(readFileSync(join(siteDir, "package.json"), "utf8")).name, "@pattern-sites/8bitcn");
  assert.deepEqual(
    JSON.parse(readFileSync(join(siteDir, "components.json"), "utf8")).registries,
    { "@8bitcn": "https://www.8bitcn.com/r/{name}.json" },
  );
});

test("scaffoldSite is idempotent (re-run does not recreate, keeps registration)", () => {
  const templateDir = makeTemplate();
  const dest = mkdtempSync(join(tmpdir(), "dest-"));
  const siteDir = join(dest, "site");
  const args = {
    templateDir, siteDir,
    packageName: "@pattern-sites/8bitcn",
    registryKey: "@8bitcn",
    urlTemplate: "https://www.8bitcn.com/r/{name}.json",
  };
  scaffoldSite(args);
  writeFileSync(join(siteDir, "app", "page.tsx"), "export default () => 'edited';\n");
  const res = scaffoldSite(args);
  assert.equal(res.created, false);
  assert.equal(res.registered, true);
  assert.deepEqual(
    JSON.parse(readFileSync(join(siteDir, "components.json"), "utf8")).registries,
    { "@8bitcn": "https://www.8bitcn.com/r/{name}.json" },
  );
  assert.match(readFileSync(join(siteDir, "app", "page.tsx"), "utf8"), /edited/); // not clobbered
});

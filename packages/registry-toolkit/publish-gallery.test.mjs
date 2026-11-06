import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectSites, buildCatalogFromSrc, catalogForSites, rewriteEmbeddedAssetPaths } from "./publish-gallery.mjs";

function makeSrc() {
  const srcDir = mkdtempSync(join(tmpdir(), "src-"));
  // @a: scaffolded + mounted (has manifest)
  mkdirSync(join(srcDir, "@a", "site", "patterns"), { recursive: true });
  writeFileSync(join(srcDir, "@a", "site", "package.json"), JSON.stringify({ name: "@pattern-sites/a" }));
  writeFileSync(join(srcDir, "@a", "site", "patterns", "manifest.json"), JSON.stringify({
    registry: "@a", patterns: [{ name: "x", title: "X", internal: { categories: ["k"] } }],
  }));
  // @b: scaffolded but not mounted (no manifest) -> skipped
  mkdirSync(join(srcDir, "@b", "site"), { recursive: true });
  writeFileSync(join(srcDir, "@b", "site", "package.json"), JSON.stringify({ name: "@pattern-sites/b" }));
  return srcDir;
}

test("collectSites returns only sites with a manifest, slug from package.json", () => {
  const srcDir = makeSrc();
  assert.deepEqual(collectSites(srcDir), [{ slug: "a", siteDir: join(srcDir, "@a", "site") }]);
});

test("buildCatalogFromSrc reads manifests and builds the catalog", () => {
  const srcDir = makeSrc();
  const cat = buildCatalogFromSrc(srcDir);
  assert.deepEqual(cat.registries, [{ id: "@a", slug: "a", count: 1 }]);
  assert.equal(cat.patterns[0].iframeSrc, "/sites/a/x/index.html");
  assert.deepEqual(cat.categories, ["k"]);
});

test("catalogForSites builds catalog from an explicit {slug, siteDir} list", () => {
  const srcDir = makeSrc();
  // Only pass site @a (skipping @b which has no manifest anyway)
  const siteDir = join(srcDir, "@a", "site");
  const cat = catalogForSites([{ slug: "a", siteDir }]);
  assert.deepEqual(cat.registries, [{ id: "@a", slug: "a", count: 1 }]);
  assert.equal(cat.patterns[0].iframeSrc, "/sites/a/x/index.html");
  assert.deepEqual(cat.categories, ["k"]);
});

test("catalogForSites returns empty catalog for an empty list", () => {
  const cat = catalogForSites([]);
  assert.deepEqual(cat.registries, []);
  assert.deepEqual(cat.patterns, []);
  assert.deepEqual(cat.categories, []);
});

test("rewriteEmbeddedAssetPaths prefixes only real, not-yet-prefixed local refs", () => {
  const dir = mkdtempSync(join(tmpdir(), "site-"));
  mkdirSync(join(dir, "fonts"), { recursive: true });
  writeFileSync(join(dir, "fonts", "x.ttf"), ""); // real local asset
  writeFileSync(join(dir, "foo.js"), ""); // real local asset
  writeFileSync(
    join(dir, "styles.css"),
    '@font-face{src:url("/fonts/x.ttf")} a{background:url(/missing.png)}',
  );
  writeFileSync(
    join(dir, "index.html"),
    '<link href="/sites/fluid/_next/a.css"><script src="/foo.js"></script>' +
      '<img src="https://cdn.example.com/y.png"><img src="//cdn/z.png">',
  );

  const n = rewriteEmbeddedAssetPaths(dir, "/sites/fluid");

  const css = readFileSync(join(dir, "styles.css"), "utf8");
  assert.match(css, /url\("\/sites\/fluid\/fonts\/x\.ttf"\)/); // real local -> prefixed
  assert.match(css, /url\(\/missing\.png\)/); // no such file -> untouched
  const html = readFileSync(join(dir, "index.html"), "utf8");
  assert.match(html, /src="\/sites\/fluid\/foo\.js"/); // real local -> prefixed
  assert.match(html, /href="\/sites\/fluid\/_next\/a\.css"/); // already prefixed -> untouched
  assert.match(html, /src="https:\/\/cdn\.example\.com\/y\.png"/); // external -> untouched
  assert.match(html, /src="\/\/cdn\/z\.png"/); // protocol-relative -> untouched
  assert.equal(n, 2); // only x.ttf and foo.js
});

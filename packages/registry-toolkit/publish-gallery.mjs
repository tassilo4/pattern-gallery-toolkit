#!/usr/bin/env node
// Publish bridge: build each scaffolded site under /sites/<slug>, copy its static
// export into the gallery's public/sites/<slug>/, and write the gallery catalog.json.
// Usage: node publish-gallery.mjs            (all scaffolded sites)
//        GALLERY_DIR=/path node publish-gallery.mjs
import { readFileSync, writeFileSync, existsSync, rmSync, cpSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { listScaffoldedSites, buildSite } from "./build-registry.mjs";
import { buildCatalog } from "./pattern-lib.mjs";

const DIR = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(DIR, "src");
const GALLERY_DIR = process.env.GALLERY_DIR || join(DIR, "..", "..", "apps", "gallery");
const PREFIX = "@pattern-sites/";

/** slug for a site dir, read from its package.json name (@pattern-sites/<slug>). */
function slugForSite(siteDir) {
  const name = JSON.parse(readFileSync(join(siteDir, "package.json"), "utf8")).name ?? "";
  return name.startsWith(PREFIX) ? name.slice(PREFIX.length) : basename(dirname(siteDir)).replace(/^@/, "");
}

/** Scaffolded sites that have been mounted (patterns/manifest.json present). */
export function collectSites(srcDir) {
  return listScaffoldedSites(srcDir)
    .filter((siteDir) => existsSync(join(siteDir, "patterns", "manifest.json")))
    .map((siteDir) => ({ slug: slugForSite(siteDir), siteDir }));
}

/**
 * Build a catalog from a list of already-resolved {slug, siteDir} entries.
 * Only reads each site's patterns/manifest.json — does no building.
 */
export function catalogForSites(sites) {
  return buildCatalog(
    sites.map(({ slug, siteDir }) => ({
      slug,
      manifest: JSON.parse(readFileSync(join(siteDir, "patterns", "manifest.json"), "utf8")),
    }))
  );
}

/** Read each site's manifest and aggregate the catalog (no building). */
export function buildCatalogFromSrc(srcDir) {
  return catalogForSites(collectSites(srcDir));
}

/** Absolute paths of files with one of `exts` (recursive) under dir. */
function filesWithExt(dir, exts) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && exts.includes(extname(e.name)))
    .map((e) => join(e.parentPath ?? e.path, e.name));
}

/**
 * Prefix absolute local-asset refs in an embedded site's copied output with its
 * basePath. Next's basePath prefixes /_next assets but NOT hand-written
 * url()/src/href that point at /public files (e.g. @font-face url("/fonts/x.ttf")).
 * In each .html/.css file, rewrites `/x` -> `${basePath}/x` when the ref is not
 * already under `${basePath}/`, not protocol-relative (`//`), and `${siteDir}/x`
 * exists (a real copied asset). Returns the number of refs rewritten.
 */
export function rewriteEmbeddedAssetPaths(siteDir, basePath) {
  const ABS_REF = /(url\(|href=|src=)(["']?)(\/[^"')\s]+)\2/g;
  let count = 0;
  for (const file of filesWithExt(siteDir, [".html", ".css"])) {
    const before = readFileSync(file, "utf8");
    const after = before.replace(ABS_REF, (m, lead, quote, path) => {
      if (path.startsWith(`${basePath}/`) || path.startsWith("//")) return m;
      if (!existsSync(join(siteDir, path.slice(1)))) return m;
      count++;
      return `${lead}${quote}${basePath}${path}${quote}`;
    });
    if (after !== before) writeFileSync(file, after);
  }
  return count;
}

function fail(msg) {
  console.error(`[publish-gallery] ${msg}`);
  process.exit(1);
}

function main() {
  const sites = collectSites(SRC_DIR);
  if (sites.length === 0) fail("no mounted sites found (run scaffold + mount-patterns first)");

  const publicSites = join(GALLERY_DIR, "public", "sites");
  mkdirSync(publicSites, { recursive: true });

  let failures = 0;
  const succeeded = [];
  for (const { slug, siteDir } of sites) {
    const dest = join(publicSites, slug);
    if (!buildSite(siteDir, { basePath: `/sites/${slug}` })) {
      rmSync(dest, { recursive: true, force: true });
      failures++;
      continue;
    }
    rmSync(dest, { recursive: true, force: true });
    cpSync(join(siteDir, "out"), dest, { recursive: true });
    rewriteEmbeddedAssetPaths(dest, `/sites/${slug}`);
    console.log(`[publish-gallery] ${slug} -> ${dest}`);
    succeeded.push({ slug, siteDir });
  }

  const catalog = catalogForSites(succeeded);
  mkdirSync(GALLERY_DIR, { recursive: true });
  writeFileSync(join(GALLERY_DIR, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");
  console.log(`[publish-gallery] wrote catalog.json (${catalog.patterns.length} patterns, ${catalog.registries.length} registries)`);
  process.exit(failures > 0 ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();

#!/usr/bin/env node
// Generate a route per authored pattern + a search manifest. Installs nothing.
// Usage: node mount-patterns.mjs <registry>   (e.g. node mount-patterns.mjs @8bitcn)
import {
  readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, rmSync,
} from "node:fs";
import { dirname, join, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { folderFor, resolveRegistryEntry } from "./registry-fetch.mjs";
import {
  resolveComponents, routeFor, renderPatternPage, renderIndexPage,
  buildManifest, GENERATED_MARKER, resolveInternal, resolveDimensions,
} from "./pattern-lib.mjs";

const DIR = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(DIR, "registries.json");
const SRC_DIR = join(DIR, "src");

/** Recursively collect basenames (no ext) of .ts/.tsx files under a dir. */
function installedBasenames(componentsDir) {
  if (!existsSync(componentsDir)) return [];
  const names = [];
  for (const e of readdirSync(componentsDir, { recursive: true, withFileTypes: true })) {
    if (e.isFile() && [".ts", ".tsx"].includes(extname(e.name))) {
      names.push(basename(e.name, extname(e.name)));
    }
  }
  return [...new Set(names)];
}

/** Pattern folders: subdirs of patterns/ that contain <name>/<name>.tsx. */
function readPatternNames(patternsDir) {
  if (!existsSync(patternsDir)) return [];
  return readdirSync(patternsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(patternsDir, e.name, `${e.name}.tsx`)))
    .map((e) => e.name)
    .sort();
}

export function mountPatterns({ siteDir, registryName }) {
  const patternsDir = join(siteDir, "patterns");
  const appDir = join(siteDir, "app");
  const installed = installedBasenames(join(siteDir, "components"));
  const names = readPatternNames(patternsDir);

  const entries = names.map((name) => {
    const source = readFileSync(join(patternsDir, name, `${name}.tsx`), "utf8");
    const pjPath = join(patternsDir, name, "pattern.json");
    const pj = existsSync(pjPath) ? JSON.parse(readFileSync(pjPath, "utf8")) : {};
    const components = resolveComponents({ source, installedBasenames: installed, override: pj.components });

    const routeDir = join(appDir, name);
    mkdirSync(routeDir, { recursive: true });
    writeFileSync(join(routeDir, "page.tsx"), renderPatternPage(name));

    return {
      name,
      route: routeFor(name),
      title: pj.title ?? name,
      description: pj.description ?? "",
      components,
      dimensions: resolveDimensions(pj.dimensions),
      internal: resolveInternal(pj.internal),
      llm: pj.llm ?? {},
    };
  });

  pruneStaleRoutes(appDir, new Set(names));

  writeFileSync(join(appDir, "page.tsx"), renderIndexPage(registryName, entries));
  writeFileSync(join(patternsDir, "manifest.json"), JSON.stringify(buildManifest(registryName, entries), null, 2) + "\n");

  return { patterns: entries };
}

/** Remove app/<name>/page.tsx dirs we generated whose pattern no longer exists. */
function pruneStaleRoutes(appDir, keep) {
  if (!existsSync(appDir)) return;
  for (const e of readdirSync(appDir, { withFileTypes: true })) {
    if (!e.isDirectory() || keep.has(e.name)) continue;
    const pagePath = join(appDir, e.name, "page.tsx");
    if (existsSync(pagePath) && readFileSync(pagePath, "utf8").includes(GENERATED_MARKER)) {
      rmSync(join(appDir, e.name), { recursive: true, force: true });
    }
  }
}

function fail(msg) {
  console.error(`[mount-patterns] ${msg}`);
  process.exit(1);
}

function main() {
  const arg = process.argv[2];
  if (!arg) fail("usage: node mount-patterns.mjs <registry>   (e.g. @8bitcn)");

  const entries = JSON.parse(readFileSync(SOURCE, "utf8"));
  const entry = resolveRegistryEntry(entries, arg);
  if (!entry) fail(`registry "${arg}" not found in registries.json`);

  const siteDir = join(SRC_DIR, folderFor(entry.name), "site");
  if (!existsSync(siteDir)) fail(`${siteDir} not found — run scaffold-registry first`);

  const { patterns } = mountPatterns({ siteDir, registryName: entry.name });
  console.log(`[mount-patterns] ${entry.name}: mounted ${patterns.length} pattern(s)`);
  for (const p of patterns) console.log(`[mount-patterns]   ${p.route} -> components [${p.components.join(", ")}]`);
  console.log(`[mount-patterns] wrote app/page.tsx + patterns/manifest.json`);
  process.exit(0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();

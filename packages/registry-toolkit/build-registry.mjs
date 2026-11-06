#!/usr/bin/env node
// Static-export one registry's site, or all scaffolded sites if no arg.
// Usage: node build-registry.mjs [registry]
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { folderFor, resolveRegistryEntry } from "./registry-fetch.mjs";

const DIR = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(DIR, "registries.json");
const SRC_DIR = join(DIR, "src");

// Returns absolute site dirs under srcDir/<registry>/site that contain a package.json.
export function listScaffoldedSites(srcDir) {
  if (!existsSync(srcDir)) return [];
  const out = [];
  for (const e of readdirSync(srcDir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const siteDir = join(srcDir, e.name, "site");
    if (existsSync(join(siteDir, "package.json"))) out.push(siteDir);
  }
  return out.sort();
}

export function buildSite(siteDir, { basePath } = {}) {
  console.log(`[build-registry] building ${siteDir}${basePath ? ` (basePath ${basePath})` : ""}`);
  const env = { ...process.env };
  if (basePath) env.PATTERN_SITE_BASE_PATH = basePath;
  else delete env.PATTERN_SITE_BASE_PATH;
  const res = spawnSync("pnpm", ["exec", "next", "build", "--webpack"], { cwd: siteDir, stdio: "inherit", env });
  return res.status === 0;
}

function fail(msg) {
  console.error(`[build-registry] ${msg}`);
  process.exit(1);
}

function main() {
  const arg = process.argv[2];
  let sites;
  if (arg) {
    const entries = JSON.parse(readFileSync(SOURCE, "utf8"));
    const entry = resolveRegistryEntry(entries, arg);
    if (!entry) fail(`registry "${arg}" not found in registries.json`);
    const siteDir = join(SRC_DIR, folderFor(entry.name), "site");
    if (!existsSync(join(siteDir, "package.json"))) fail(`${siteDir} not scaffolded — run scaffold-registry first`);
    sites = [siteDir];
  } else {
    sites = listScaffoldedSites(SRC_DIR);
    if (sites.length === 0) fail("no scaffolded sites found under src/*/site");
  }

  let failures = 0;
  for (const siteDir of sites) {
    if (!buildSite(siteDir)) failures++;
  }
  console.log(`[build-registry] done: ${sites.length - failures} ok / ${failures} failed / ${sites.length} total`);
  process.exit(failures > 0 ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();

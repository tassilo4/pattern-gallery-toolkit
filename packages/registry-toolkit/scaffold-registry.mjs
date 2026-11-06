#!/usr/bin/env node
// Lazily scaffold a runnable Next site for a registry from app-template/.
// Usage: node scaffold-registry.mjs <registry>   (e.g. node scaffold-registry.mjs @8bitcn)
import { readFileSync, writeFileSync, existsSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { folderFor, resolveRegistryEntry } from "./registry-fetch.mjs";
import {
  sanitizePackageName,
  registryKeyFor,
  applyRegistryRegistration,
} from "./scaffold-lib.mjs";

const DIR = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(DIR, "registries.json");
const TEMPLATE_DIR = join(DIR, "app-template");
const SRC_DIR = join(DIR, "src");

const SKIP_COPY = new Set(["node_modules", ".next", "out"]);

/**
 * Copy app-template -> siteDir (once), rename package, register the registry.
 * Idempotent: existing sites keep their files; registration is re-applied.
 */
export function scaffoldSite({ templateDir, siteDir, packageName, registryKey, urlTemplate }) {
  const created = !existsSync(siteDir);
  if (created) {
    cpSync(templateDir, siteDir, {
      recursive: true,
      filter: (src) => !SKIP_COPY.has(src.split(/[/\\]/).pop()),
    });
  }

  const pkgPath = join(siteDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  pkg.name = packageName;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  let registered = false;
  if (urlTemplate && urlTemplate.includes("{name}")) {
    const cjPath = join(siteDir, "components.json");
    const cj = JSON.parse(readFileSync(cjPath, "utf8"));
    const next = applyRegistryRegistration(cj, registryKey, urlTemplate);
    writeFileSync(cjPath, JSON.stringify(next, null, 2) + "\n");
    registered = true;
  }

  return { created, registered };
}

function fail(msg) {
  console.error(`[scaffold-registry] ${msg}`);
  process.exit(1);
}

function main() {
  const arg = process.argv[2];
  if (!arg) fail("usage: node scaffold-registry.mjs <registry>   (e.g. @8bitcn)");

  const entries = JSON.parse(readFileSync(SOURCE, "utf8"));
  const entry = resolveRegistryEntry(entries, arg);
  if (!entry) fail(`registry "${arg}" not found in registries.json`);

  const siteDir = join(SRC_DIR, folderFor(entry.name), "site");
  const { created, registered } = scaffoldSite({
    templateDir: TEMPLATE_DIR,
    siteDir,
    packageName: sanitizePackageName(entry.name),
    registryKey: registryKeyFor(entry.name),
    urlTemplate: entry.url,
  });

  console.log(`[scaffold-registry] ${entry.name}: site ${created ? "created" : "exists"} at ${siteDir}`);
  console.log(
    `[scaffold-registry] registry ${registered ? `registered (${registryKeyFor(entry.name)})` : "NOT registered (no {name} url) — install components manually"}`,
  );
  console.log(`[scaffold-registry] next: pnpm install, then 'pnpm dlx shadcn@4.10.0 add ${registryKeyFor(entry.name)}/<item> --cwd ${siteDir}'`);
  process.exit(0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();

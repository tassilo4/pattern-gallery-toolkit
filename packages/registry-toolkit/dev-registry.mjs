#!/usr/bin/env node
// Run `next dev` in a registry's site. Usage: node dev-registry.mjs <registry> [-- next args]
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { folderFor, resolveRegistryEntry } from "./registry-fetch.mjs";

const DIR = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(DIR, "registries.json");
const SRC_DIR = join(DIR, "src");

function fail(msg) {
  console.error(`[dev-registry] ${msg}`);
  process.exit(1);
}

function main() {
  const arg = process.argv[2];
  if (!arg) fail("usage: node dev-registry.mjs <registry> [-- next args]");

  const entries = JSON.parse(readFileSync(SOURCE, "utf8"));
  const entry = resolveRegistryEntry(entries, arg);
  if (!entry) fail(`registry "${arg}" not found in registries.json`);

  const siteDir = join(SRC_DIR, folderFor(entry.name), "site");
  if (!existsSync(join(siteDir, "package.json"))) fail(`${siteDir} not scaffolded — run scaffold-registry first`);

  const extra = process.argv[3] === "--" ? process.argv.slice(4) : process.argv.slice(3);
  console.log(`[dev-registry] next dev in ${siteDir}`);
  const child = spawn("pnpm", ["exec", "next", "dev", ...extra], { cwd: siteDir, stdio: "inherit" });
  child.on("exit", (code) => process.exit(code ?? 0));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();

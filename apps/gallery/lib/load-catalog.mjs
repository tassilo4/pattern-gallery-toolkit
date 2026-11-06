import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Read the published catalog.json at build time; empty catalog if not yet published. */
export function loadCatalog() {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "catalog.json"), "utf8"));
  } catch {
    return { registries: [], categories: [], patterns: [] };
  }
}

// Shared helpers for locating registries within the top-level registries.json directory.
// (Previously also held the fetch/probe helpers used by the download-* scripts, which
// have been removed along with the per-registry registry.json/items reference data.)

/** Folder/file-safe name segment (keep @ . _ - and alphanumerics; replace the rest). */
export const folderFor = (name) => name.replace(/[^A-Za-z0-9@._-]/g, '_');

/**
 * Find a registry entry in registries.json by argument: exact name, folder-safe
 * name (folderFor), or bare name with a leading "@" added. Returns null if none.
 */
export function resolveRegistryEntry(entries, arg) {
  return (
    entries.find(
      (e) => e.name === arg || folderFor(e.name) === arg || e.name === `@${arg}`,
    ) ?? null
  );
}

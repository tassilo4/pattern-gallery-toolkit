// Pure helpers for scaffold-registry.mjs (no I/O — unit tested).

/** "@8bitcn" -> "@pattern-sites/8bitcn"; "@acme/ui" -> "@pattern-sites/acme-ui". */
export function sanitizePackageName(registryName) {
  const slug = String(registryName)
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `@pattern-sites/${slug}`;
}

/** Ensure a single leading "@" (registries.json keys / components.json keys). */
export function registryKeyFor(registryName) {
  return registryName.startsWith("@") ? registryName : `@${registryName}`;
}

/**
 * Return a new config with the registry registered under `registries`.
 * Mirrors shadcn's registryConfigSchema: key must start with "@", url must
 * contain "{name}". Does not mutate the input config.
 */
export function applyRegistryRegistration(config, registryKey, urlTemplate) {
  if (!registryKey.startsWith("@")) {
    throw new Error(`registry key must start with "@": ${registryKey}`);
  }
  if (!urlTemplate || !urlTemplate.includes("{name}")) {
    throw new Error(`registry url must include {name}: ${urlTemplate}`);
  }
  return {
    ...config,
    registries: { ...(config.registries ?? {}), [registryKey]: urlTemplate },
  };
}

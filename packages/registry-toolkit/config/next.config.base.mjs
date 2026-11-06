// Shared Next.js config for every per-registry pattern site.
// Per-app next.config.mjs re-exports this. Change static-export behavior here once.
//
// basePath is opt-in via PATTERN_SITE_BASE_PATH so the gallery can serve each
// site's static export under /sites/<slug>/. When the env is absent, no basePath
// is applied (standalone `build-registry` produces a root-served export).
const basePath = process.env.PATTERN_SITE_BASE_PATH || undefined;

/** @type {import('next').NextConfig} */
export const baseConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(basePath ? { basePath } : {}),
};

export default baseConfig;

// Pure catalog helpers (browser-safe, no Node deps) — unit tested with node:test.

/**
 * Filter patterns by selected registries and categories.
 * AND across the two facets; OR within each (empty facet = no constraint).
 * @template {object} T
 * @param {(T & {registry:string, categories:string[]})[]} patterns
 * @param {{registries?:string[], categories?:string[]}} sel
 * @returns {(T & {registry:string, categories:string[]})[]}
 */
export function filterPatterns(patterns, { registries = [], categories = [] } = {}) {
  return patterns.filter((p) => {
    const regOk = registries.length === 0 || registries.includes(p.registry);
    const catOk = categories.length === 0 || p.categories.some((c) => categories.includes(c));
    return regOk && catOk;
  });
}

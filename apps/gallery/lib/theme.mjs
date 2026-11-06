// Pure theme helpers (browser-safe, no React/Node deps) — unit tested with node:test.

/** @typedef {"light" | "dark" | "system"} Theme */
/** @typedef {"light" | "dark"} ResolvedTheme */

/** User-facing theme options (single source of truth; TS derives `Theme` from this). */
export const THEMES = /** @type {const} */ (["light", "dark", "system"]);

/** localStorage key holding the user's chosen Theme. */
export const STORAGE_KEY = "pattern-gallery-theme";

/**
 * Collapse a Theme + the OS preference into a concrete ResolvedTheme.
 * @param {Theme} theme
 * @param {boolean} systemDark  matchMedia("(prefers-color-scheme: dark)").matches
 * @returns {ResolvedTheme}
 */
export function resolveTheme(theme, systemDark) {
  if (theme === "light" || theme === "dark") return theme;
  return systemDark ? "dark" : "light";
}

/**
 * Read the persisted Theme, falling back to "system" for missing / invalid / blocked storage.
 * @param {{ getItem(key: string): string | null } | null | undefined} storage
 * @returns {Theme}
 */
export function readStoredTheme(storage) {
  try {
    const v = storage?.getItem(STORAGE_KEY);
    if (v && /** @type {readonly string[]} */ (THEMES).includes(v)) {
      return /** @type {Theme} */ (v);
    }
    return "system";
  } catch {
    return "system";
  }
}

/**
 * Force a concrete theme onto a documentElement: add the resolved class, remove its
 * opposite, and set color-scheme (native controls / scrollbars). The explicit class
 * covers both registry conventions — pure ".dark" and @fluid's ":root:not(.light)".
 * @param {{ classList: { add(c: string): void; remove(c: string): void }, style: { colorScheme: string } }} root
 * @param {ResolvedTheme} resolved
 */
export function applyTheme(root, resolved) {
  root.classList.add(resolved);
  root.classList.remove(resolved === "dark" ? "light" : "dark");
  root.style.colorScheme = resolved;
}

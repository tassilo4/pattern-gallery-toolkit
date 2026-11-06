"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  THEMES,
  STORAGE_KEY,
  resolveTheme,
  readStoredTheme,
  applyTheme,
} from "@/lib/theme.mjs";

export type Theme = (typeof THEMES)[number]; // "light" | "dark" | "system"
export type ResolvedTheme = Exclude<Theme, "system">; // "light" | "dark"

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [systemDark, setSystemDark] = useState(false);

  // Sync from storage + OS after mount. Doing this in an effect (not a lazy
  // initializer) avoids an SSR/hydration mismatch; the inline no-flash script has
  // already painted the correct <html> class before hydration, so there's no flash.
  useEffect(() => {
    setThemeState(readStoredTheme(window.localStorage));
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme = resolveTheme(theme, systemDark);

  // Persist the choice.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage blocked (private mode) — in-memory only */
    }
  }, [theme]);

  // Apply to the gallery's own <html>.
  useEffect(() => {
    applyTheme(document.documentElement, resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

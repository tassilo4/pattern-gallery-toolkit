"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { applyTheme } from "@/lib/theme.mjs";
import type { ResolvedTheme } from "@/components/theme-provider";

/**
 * Apply a resolved theme into a same-origin preview iframe. On the iframe's `load` (and
 * re-applied whenever `resolved` changes) it sets the dark/light class + color-scheme on
 * the iframe's documentElement. Returns a stable callback ref for the <iframe> and a
 * `themed` flag that flips true once the iframe has loaded (or errored) — used to gate the
 * reveal so previews don't blink light→dark as they lazy-mount.
 *
 * Same-origin only; reaching into a cross-origin iframe throws and is caught (the preview
 * still reveals, just unthemed) — mirroring use-iframe-scroll-passthrough.
 */
export function useIframeTheme(resolved: ResolvedTheme) {
  const [themed, setThemed] = useState(false);
  const docRef = useRef<Document | null>(null);
  const resolvedRef = useRef(resolved);
  resolvedRef.current = resolved;

  // Re-apply to the already-attached document when the theme toggles, without re-running
  // the callback ref (which would re-add listeners and reset `themed`).
  useEffect(() => {
    const doc = docRef.current;
    if (!doc) return;
    try {
      applyTheme(doc.documentElement, resolved);
    } catch {
      /* document went away / cross-origin */
    }
  }, [resolved]);

  const ref = useCallback((iframe: HTMLIFrameElement | null) => {
    // React 19 runs the returned cleanup on unmount; this guard covers a legacy null call.
    if (!iframe) return;

    const onLoad = () => {
      try {
        const doc = iframe.contentDocument;
        docRef.current = doc;
        if (doc) applyTheme(doc.documentElement, resolvedRef.current);
      } catch {
        docRef.current = null; // cross-origin: can't reach in — reveal unthemed below
      }
      setThemed(true);
    };
    // Reveal even if the iframe fails to load, so it never stays hidden behind the placeholder.
    const onError = () => setThemed(true);

    iframe.addEventListener("load", onLoad);
    iframe.addEventListener("error", onError);
    // Already-finished case (e.g. re-attach after an in-iframe SPA nav): apply now.
    try {
      const doc = iframe.contentDocument;
      if (doc && doc.readyState === "complete" && doc.URL !== "about:blank") onLoad();
    } catch {
      /* not ready / cross-origin — wait for the load event */
    }

    return () => {
      iframe.removeEventListener("load", onLoad);
      iframe.removeEventListener("error", onError);
      docRef.current = null;
      setThemed(false);
    };
  }, []);

  return { ref, themed };
}

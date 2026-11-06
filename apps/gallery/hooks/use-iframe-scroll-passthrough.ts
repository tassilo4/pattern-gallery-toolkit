"use client";

import { useCallback } from "react";
import {
  consumesWheel,
  isAxisScrollable,
  normalizeWheelDelta,
  type ScrollMetrics,
} from "@/lib/scroll-passthrough.mjs";

/**
 * Forward unconsumed wheel events from a same-origin preview iframe to the gallery
 * page, so scrolling over a preview that can't scroll (or is at its edge) scrolls
 * the page — while a scrollable preview still scrolls its own content first.
 *
 * Returns a callback ref to place on the <iframe>. A callback ref (not a ref object)
 * is required because the iframe is conditionally rendered by virtual-mounting: it
 * mounts/unmounts as the cell scrolls in and out of view. React invokes the callback
 * with the element when it mounts and runs the returned cleanup when it unmounts
 * (React 19 ref cleanup), so the wheel listener is wired for the element's whole
 * lifetime and torn down on every remount cycle.
 *
 * Same-origin only; if the iframe is ever cross-origin, reaching into it throws and
 * the hook silently no-ops (native behavior).
 */
export function useIframeScrollPassthrough() {
  return useCallback((iframe: HTMLIFrameElement | null) => {
    // React 19 runs the returned cleanup on unmount; this null guard covers a
    // legacy null-call (older React / SSR) as a harmless no-op.
    if (!iframe) return;

    let attachedWin: Window | null = null;

    const onWheel = (e: WheelEvent) => {
      const win = attachedWin;
      if (!win) return;
      const doc = win.document;
      const root = doc.scrollingElement ?? doc.documentElement;

      // Walk target→root collecting scroll metrics. Use nodeType (stable across
      // realms); `instanceof Element` is false for the iframe's own elements.
      // If the target isn't an element (e.g. a text node or the document), start
      // from the root scroller so it still gets evaluated.
      const path: ScrollMetrics[] = [];
      let el: Element | null =
        e.target && (e.target as Node).nodeType === 1 ? (e.target as Element) : root;
      while (el && el.nodeType === 1) {
        const cs = win.getComputedStyle(el);
        const isRoot = el === root || el === doc.documentElement || el === doc.body;
        path.push({
          scrollTop: el.scrollTop,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          scrollLeft: el.scrollLeft,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          scrollableY: isAxisScrollable(cs.overflowY, isRoot),
          scrollableX: isAxisScrollable(cs.overflowX, isRoot),
        });
        if (el === root) break;
        el = el.parentElement;
      }

      if (consumesWheel(path, e.deltaX, e.deltaY)) return; // iframe scrolls natively

      e.preventDefault();
      const { x, y } = normalizeWheelDelta(e.deltaMode, e.deltaX, e.deltaY, {
        linePx: 16,
        pageX: window.innerWidth,
        pageY: window.innerHeight,
      });
      window.scrollBy({ left: x, top: y });
    };

    const detach = () => {
      if (attachedWin) {
        try {
          attachedWin.removeEventListener("wheel", onWheel);
        } catch {
          /* window already gone */
        }
        attachedWin = null;
      }
    };

    const attach = () => {
      detach(); // an in-iframe SPA nav can re-fire `load` on the same element
      try {
        const win = iframe.contentWindow;
        if (!win) return;
        void win.document; // surface cross-origin access errors before subscribing
        win.addEventListener("wheel", onWheel, { passive: false });
        attachedWin = win;
      } catch {
        // Cross-origin iframe: can't reach in — degrade to native (no passthrough).
        attachedWin = null;
      }
    };

    iframe.addEventListener("load", attach);
    attach(); // cover the already-loaded case (the iframe may already be loaded)

    return () => {
      iframe.removeEventListener("load", attach);
      detach();
    };
  }, []);
}

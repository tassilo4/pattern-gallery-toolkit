"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { mountQueue } from "@/lib/mount-queue.mjs";

// Boot a cell ~1 screen before it enters view; unmount only ~2 screens away.
// mount margin < unmount margin = a hysteresis band that prevents edge thrash.
const MOUNT_MARGIN = "100% 0px";
const UNMOUNT_MARGIN = "200% 0px";

/**
 * Viewport-virtualize a preview cell: mount its iframe when near the viewport
 * (through the shared boot queue) and unmount it when scrolled far away.
 * Pure windowing — scrolling back re-mounts.
 */
export function useVirtualMount<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [mounted, setMounted] = useState(false);

  // Mirror `mounted` into a ref so the observer callbacks read the latest value
  // without re-subscribing. Writing a ref during render is safe (not read for
  // this render's output).
  const mountedRef = useRef(false);
  mountedRef.current = mounted;

  // The queue release fn while a boot slot is held or queued; null otherwise.
  const releaseRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Old browsers without IntersectionObserver: render immediately (today's behavior).
    if (typeof IntersectionObserver === "undefined") {
      setMounted(true);
      return;
    }

    const freeSlot = () => {
      releaseRef.current?.();
      releaseRef.current = null;
    };

    const mountObs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !mountedRef.current && releaseRef.current === null) {
          // Entering the window: request a boot slot; mount when granted.
          releaseRef.current = mountQueue.acquire(() => setMounted(true));
        }
      },
      { rootMargin: MOUNT_MARGIN },
    );

    const unmountObs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          // Far away: drop to placeholder; cancel a queued boot or free a held slot.
          freeSlot();
          setMounted(false);
        }
      },
      { rootMargin: UNMOUNT_MARGIN },
    );

    mountObs.observe(el);
    unmountObs.observe(el);
    return () => {
      mountObs.disconnect();
      unmountObs.disconnect();
      freeSlot();
    };
  }, [ref]);

  // Iframe finished (load) or failed (error): the boot is done, free the slot for
  // the next queued cell. The iframe stays mounted.
  const onIframeSettled = () => {
    releaseRef.current?.();
    releaseRef.current = null;
  };

  return { mounted, onIframeSettled };
}

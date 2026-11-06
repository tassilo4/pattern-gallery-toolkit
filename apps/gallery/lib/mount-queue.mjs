// Pure concurrency-gated boot queue (browser-safe, no deps) — unit tested with node:test.
// Throttles how many preview iframes BOOT (load + hydrate) at once. It does NOT cap the
// live count — viewport windowing (hooks/use-virtual-mount.ts) does that. The queue only
// smooths the simultaneous-hydration burst that saturates the shared main thread.

/**
 * Create a queue that grants up to `max` concurrent slots.
 * @param {number} max Maximum slots granted at once (>= 1).
 */
export function createMountQueue(max) {
  let active = 0;
  /** @type {(() => void)[]} */
  const waiters = [];

  function pump() {
    while (active < max && waiters.length > 0) {
      active++;
      const run = waiters.shift();
      run();
    }
  }

  return {
    /**
     * Request a slot. `grant` runs (synchronously if a slot is free, else later)
     * when granted. Returns a release fn — call it when the boot settles
     * (iframe load/error) OR to cancel while still waiting. Idempotent.
     * @param {() => void} grant
     * @returns {() => void} release
     */
    acquire(grant) {
      let granted = false;
      let released = false;
      const run = () => {
        granted = true;
        grant();
      };
      waiters.push(run);
      pump();
      return () => {
        if (released) return;
        released = true;
        if (granted) {
          active--;
          pump();
        } else {
          const i = waiters.indexOf(run);
          if (i >= 0) waiters.splice(i, 1);
        }
      };
    },
    /** Inspect internal counts (tests only). */
    _state() {
      return { active, waiting: waiters.length };
    },
  };
}

/** App singleton: at most 3 preview iframes boot concurrently. */
export const mountQueue = createMountQueue(3);

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Ref, RefCallback } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Compose multiple refs (callback or object) onto one element. Preserves each callback
 * ref's React-19 cleanup return; for refs without one, calls them with null on detach.
 * Memoize the result (e.g. useMemo) so the element isn't detached/reattached every render.
 */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  return (node) => {
    const cleanups = refs.map((ref) => {
      if (typeof ref === "function") return ref(node)
      if (ref) (ref as { current: T | null }).current = node
      return undefined
    })
    return () => {
      cleanups.forEach((cleanup, i) => {
        if (typeof cleanup === "function") return cleanup()
        const ref = refs[i]
        if (typeof ref === "function") ref(null)
        else if (ref) (ref as { current: T | null }).current = null
      })
    }
  }
}

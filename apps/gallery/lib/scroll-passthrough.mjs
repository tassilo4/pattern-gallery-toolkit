// Pure wheel scroll-passthrough decisions for the gallery's same-origin preview iframes.
// Browser-safe, no deps, no DOM — unit tested with node:test. The hook
// (hooks/use-iframe-scroll-passthrough.ts) feeds DOM-derived metrics in and acts on the result.

/**
 * @typedef {object} ScrollMetrics
 * @property {number} scrollTop
 * @property {number} scrollHeight
 * @property {number} clientHeight
 * @property {number} scrollLeft
 * @property {number} scrollWidth
 * @property {number} clientWidth
 * @property {boolean} scrollableY  // can scroll vertically (see isAxisScrollable)
 * @property {boolean} scrollableX  // can scroll horizontally
 */

const EPS = 1; // tolerate sub-pixel rounding at the scroll edge

/**
 * Whether one element can move in the wheel's direction on either axis.
 * @param {ScrollMetrics} el
 * @param {number} deltaX
 * @param {number} deltaY
 * @returns {boolean}
 */
function elementConsumes(el, deltaX, deltaY) {
  const canY =
    el.scrollableY &&
    ((deltaY > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - EPS) ||
      (deltaY < 0 && el.scrollTop > EPS));
  const canX =
    el.scrollableX &&
    ((deltaX > 0 && el.scrollLeft + el.clientWidth < el.scrollWidth - EPS) ||
      (deltaX < 0 && el.scrollLeft > EPS));
  return canY || canX;
}

/**
 * True if some element in the target→root path can still scroll in the wheel's
 * direction — i.e. the iframe will consume this wheel, so the page must NOT scroll.
 * @param {ScrollMetrics[]} path Ordered from the event target up to the root scroller.
 * @param {number} deltaX
 * @param {number} deltaY
 * @returns {boolean}
 */
export function consumesWheel(path, deltaX, deltaY) {
  return path.some((el) => elementConsumes(el, deltaX, deltaY));
}

/**
 * Whether an axis is scrollable given its computed `overflow-x/y` value.
 * The document's root scroller scrolls for any value except `hidden`; every other
 * element only scrolls when overflow is `auto` or `scroll`.
 * @param {string} overflow Computed overflow value for the axis.
 * @param {boolean} isRoot Whether the element is the document's root scroller.
 * @returns {boolean}
 */
export function isAxisScrollable(overflow, isRoot) {
  if (isRoot) return overflow !== "hidden";
  return overflow === "auto" || overflow === "scroll";
}

/**
 * Normalize wheel deltas to pixels based on `deltaMode`
 * (0 = pixel, 1 = line, 2 = page) so the forwarded distance matches user intent.
 * @param {number} deltaMode
 * @param {number} deltaX
 * @param {number} deltaY
 * @param {{ linePx: number, pageX: number, pageY: number }} opts
 * @returns {{ x: number, y: number }}
 */
export function normalizeWheelDelta(deltaMode, deltaX, deltaY, opts) {
  if (deltaMode === 1) return { x: deltaX * opts.linePx, y: deltaY * opts.linePx };
  if (deltaMode === 2) return { x: deltaX * opts.pageX, y: deltaY * opts.pageY };
  return { x: deltaX, y: deltaY };
}

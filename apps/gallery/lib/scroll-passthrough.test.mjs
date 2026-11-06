import { test } from "node:test";
import assert from "node:assert/strict";
import {
  consumesWheel,
  isAxisScrollable,
  normalizeWheelDelta,
} from "./scroll-passthrough.mjs";

// 100x100 viewport with 100x100 content (fits exactly → cannot scroll), overridable.
const m = (over) => ({
  scrollTop: 0, scrollHeight: 100, clientHeight: 100,
  scrollLeft: 0, scrollWidth: 100, clientWidth: 100,
  scrollableY: false, scrollableX: false, ...over,
});

test("consumesWheel: empty path does not consume (forward to page)", () => {
  assert.equal(consumesWheel([], 0, 10), false);
});

test("consumesWheel: non-scrollable element does not consume even if content overflows", () => {
  assert.equal(consumesWheel([m({ scrollableY: false, scrollHeight: 500 })], 0, 10), false);
});

test("consumesWheel: scrollable element mid-content consumes a downward wheel", () => {
  const el = m({ scrollableY: true, scrollHeight: 500, scrollTop: 50 });
  assert.equal(consumesWheel([el], 0, 10), true);
});

test("consumesWheel: at bottom — down does not consume, up does", () => {
  const el = m({ scrollableY: true, scrollHeight: 500, scrollTop: 400 });
  assert.equal(consumesWheel([el], 0, 10), false);
  assert.equal(consumesWheel([el], 0, -10), true);
});

test("consumesWheel: at top — up does not consume, down does", () => {
  const el = m({ scrollableY: true, scrollHeight: 500, scrollTop: 0 });
  assert.equal(consumesWheel([el], 0, -10), false);
  assert.equal(consumesWheel([el], 0, 10), true);
});

test("consumesWheel: horizontal — scrollable X consumes deltaX both directions mid-content", () => {
  const el = m({ scrollableX: true, scrollWidth: 500, scrollLeft: 50 });
  assert.equal(consumesWheel([el], 10, 0), true);
  assert.equal(consumesWheel([el], -10, 0), true);
});

test("consumesWheel: an inner element can consume even when the root cannot", () => {
  // root is flagged scrollableY but content fits exactly (scrollHeight === clientHeight),
  // so it cannot actually move; consumesWheel must still scan the path and find `inner`.
  const root = m({ scrollableY: true, scrollHeight: 100, scrollTop: 0 });
  const inner = m({ scrollableY: true, scrollHeight: 500, scrollTop: 50 });
  assert.equal(consumesWheel([inner, root], 0, 10), true);
});

test("consumesWheel: EPS tolerates sub-pixel — within 1px of bottom does not consume down", () => {
  const el = m({ scrollableY: true, scrollHeight: 500, scrollTop: 399.5 }); // 499.5 < 499 is false
  assert.equal(consumesWheel([el], 0, 10), false);
});

test("consumesWheel: EPS up-direction — within 1px of top does not consume up, just past it does", () => {
  assert.equal(consumesWheel([m({ scrollableY: true, scrollHeight: 500, scrollTop: 0.5 })], 0, -10), false); // 0.5 > 1 is false
  assert.equal(consumesWheel([m({ scrollableY: true, scrollHeight: 500, scrollTop: 1.5 })], 0, -10), true);
});

test("consumesWheel: EPS horizontal — within 1px of the right edge does not consume right", () => {
  const el = m({ scrollableX: true, scrollWidth: 500, scrollLeft: 399.5 }); // 499.5 < 499 is false
  assert.equal(consumesWheel([el], 10, 0), false);
});

test("isAxisScrollable: non-root needs auto|scroll", () => {
  assert.equal(isAxisScrollable("auto", false), true);
  assert.equal(isAxisScrollable("scroll", false), true);
  assert.equal(isAxisScrollable("visible", false), false);
  assert.equal(isAxisScrollable("hidden", false), false);
});

test("isAxisScrollable: root scrolls for anything except hidden", () => {
  assert.equal(isAxisScrollable("visible", true), true);
  assert.equal(isAxisScrollable("auto", true), true);
  assert.equal(isAxisScrollable("scroll", true), true);
  assert.equal(isAxisScrollable("hidden", true), false);
});

test("normalizeWheelDelta: pixel mode (0) passes through", () => {
  assert.deepEqual(
    normalizeWheelDelta(0, 3, 9, { linePx: 16, pageX: 800, pageY: 600 }),
    { x: 3, y: 9 },
  );
});

test("normalizeWheelDelta: line mode (1) multiplies by linePx", () => {
  assert.deepEqual(
    normalizeWheelDelta(1, 1, 2, { linePx: 16, pageX: 800, pageY: 600 }),
    { x: 16, y: 32 },
  );
});

test("normalizeWheelDelta: page mode (2) multiplies by viewport", () => {
  assert.deepEqual(
    normalizeWheelDelta(2, 1, -1, { linePx: 16, pageX: 800, pageY: 600 }),
    { x: 800, y: -600 },
  );
});

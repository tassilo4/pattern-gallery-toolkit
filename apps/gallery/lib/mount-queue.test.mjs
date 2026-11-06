import { test } from "node:test";
import assert from "node:assert/strict";
import { createMountQueue } from "./mount-queue.mjs";

test("grants up to max immediately, queues the rest", () => {
  const q = createMountQueue(2);
  const granted = [];
  q.acquire(() => granted.push("a"));
  q.acquire(() => granted.push("b"));
  q.acquire(() => granted.push("c")); // queued
  assert.deepEqual(granted, ["a", "b"]);
  assert.deepEqual(q._state(), { active: 2, waiting: 1 });
});

test("release after grant advances the queue", () => {
  const q = createMountQueue(1);
  const granted = [];
  const relA = q.acquire(() => granted.push("a"));
  q.acquire(() => granted.push("b")); // queued
  assert.deepEqual(granted, ["a"]);
  relA(); // free A's slot -> B granted
  assert.deepEqual(granted, ["a", "b"]);
  assert.deepEqual(q._state(), { active: 1, waiting: 0 });
});

test("release while waiting removes the waiter without consuming a slot", () => {
  const q = createMountQueue(1);
  const granted = [];
  const relA = q.acquire(() => granted.push("a")); // active
  const relB = q.acquire(() => granted.push("b")); // waiting
  relB(); // cancel B while waiting
  assert.deepEqual(q._state(), { active: 1, waiting: 0 });
  relA(); // free A -> nothing left
  assert.deepEqual(granted, ["a"]);
  assert.deepEqual(q._state(), { active: 0, waiting: 0 });
});

test("cancelled waiter is skipped; next real waiter is granted", () => {
  const q = createMountQueue(1);
  const granted = [];
  const relA = q.acquire(() => granted.push("a")); // active
  const relB = q.acquire(() => granted.push("b")); // waiting #1
  q.acquire(() => granted.push("c"));              // waiting #2
  relB();   // cancel B
  relA();   // free A -> C granted (B skipped)
  assert.deepEqual(granted, ["a", "c"]);
});

test("double-release is a no-op", () => {
  const q = createMountQueue(1);
  const granted = [];
  const relA = q.acquire(() => granted.push("a"));
  q.acquire(() => granted.push("b"));
  relA();
  relA(); // must not over-advance / under-count
  assert.deepEqual(granted, ["a", "b"]);
  assert.deepEqual(q._state(), { active: 1, waiting: 0 });
});

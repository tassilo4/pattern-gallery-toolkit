import { test } from "node:test";
import assert from "node:assert/strict";
import { THEMES, STORAGE_KEY, resolveTheme, readStoredTheme, applyTheme } from "./theme.mjs";

// Minimal documentElement stand-in: records classes and color-scheme.
function fakeRoot() {
  const classes = new Set();
  return {
    _classes: classes,
    classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c) },
    style: {},
  };
}

test("THEMES lists the three options and STORAGE_KEY is stable", () => {
  assert.deepEqual([...THEMES], ["light", "dark", "system"]);
  assert.equal(STORAGE_KEY, "pattern-gallery-theme");
});

test("resolveTheme: explicit light/dark ignore the OS preference", () => {
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("light", false), "light");
  assert.equal(resolveTheme("dark", true), "dark");
  assert.equal(resolveTheme("dark", false), "dark");
});

test("resolveTheme: system follows the OS preference", () => {
  assert.equal(resolveTheme("system", true), "dark");
  assert.equal(resolveTheme("system", false), "light");
});

test("readStoredTheme: returns a valid stored value", () => {
  assert.equal(readStoredTheme({ getItem: () => "dark" }), "dark");
  assert.equal(readStoredTheme({ getItem: () => "light" }), "light");
  assert.equal(readStoredTheme({ getItem: () => "system" }), "system");
});

test("readStoredTheme: junk / empty / blocked / missing falls back to system", () => {
  assert.equal(readStoredTheme({ getItem: () => "nonsense" }), "system");
  assert.equal(readStoredTheme({ getItem: () => null }), "system");
  assert.equal(readStoredTheme({ getItem: () => { throw new Error("blocked"); } }), "system");
  assert.equal(readStoredTheme(undefined), "system");
});

test("applyTheme: dark adds .dark, removes .light, sets colorScheme", () => {
  const root = fakeRoot();
  root._classes.add("light"); // simulate a previous light state
  applyTheme(root, "dark");
  assert.ok(root._classes.has("dark"));
  assert.ok(!root._classes.has("light"));
  assert.equal(root.style.colorScheme, "dark");
});

test("applyTheme: light adds .light, removes .dark, sets colorScheme", () => {
  const root = fakeRoot();
  root._classes.add("dark"); // simulate a previous dark state
  applyTheme(root, "light");
  assert.ok(root._classes.has("light"));
  assert.ok(!root._classes.has("dark"));
  assert.equal(root.style.colorScheme, "light");
});

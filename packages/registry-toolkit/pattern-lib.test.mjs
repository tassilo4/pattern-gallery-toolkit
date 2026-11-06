import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deriveComponentsFromSource,
  confirmComponents,
  applyComponentsOverride,
  resolveComponents,
  resolveInternal,
  resolveDimensions,
} from "./pattern-lib.mjs";

const SRC = `"use client";
import { Button } from "@/components/ui/8bit/button";
import { Card, CardContent } from "@/components/ui/8bit/card";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import Image from "next/image";`;

test("derives trailing names from @/ component/lib/hook imports only", () => {
  assert.deepEqual(deriveComponentsFromSource(SRC), ["button", "card", "utils", "use-mobile"]);
});

test("confirmComponents filters against installed when inventory present", () => {
  assert.deepEqual(confirmComponents(["button", "card", "utils", "use-mobile"], ["button", "card"]), ["button", "card"]);
});

test("confirmComponents passes through when inventory empty", () => {
  assert.deepEqual(confirmComponents(["button", "utils"], []), ["button", "utils"]);
});

test("applyComponentsOverride: array replaces verbatim", () => {
  assert.deepEqual(applyComponentsOverride(["button", "card"], ["x", "y"]), ["x", "y"]);
});

test("applyComponentsOverride: add/remove adjusts", () => {
  assert.deepEqual(applyComponentsOverride(["button", "card"], { add: ["input"], remove: ["card"] }), ["button", "input"]);
});

test("resolveComponents end-to-end (derive -> confirm -> override add)", () => {
  const out = resolveComponents({ source: SRC, installedBasenames: ["button", "card"], override: { add: ["input"] } });
  assert.deepEqual(out, ["button", "card", "input"]); // utils/use-mobile dropped by confirm, input added
});

test("resolveInternal defaults keywords/categories to [] when absent", () => {
  assert.deepEqual(resolveInternal(undefined), { keywords: [], categories: [] });
  assert.deepEqual(resolveInternal({}), { keywords: [], categories: [] });
});

test("resolveInternal keeps authored keywords/categories", () => {
  assert.deepEqual(
    resolveInternal({ keywords: ["login"], categories: ["forms"] }),
    { keywords: ["login"], categories: ["forms"] },
  );
});

test("resolveInternal passes extra keys through and defaults the missing known key", () => {
  assert.deepEqual(
    resolveInternal({ categories: ["forms"], tags: ["x"] }),
    { keywords: [], categories: ["forms"], tags: ["x"] },
  );
});

test("resolveDimensions defaults to 400x300 when absent/empty", () => {
  assert.deepEqual(resolveDimensions(undefined), { width: 400, height: 300 });
  assert.deepEqual(resolveDimensions({}), { width: 400, height: 300 });
});

test("resolveDimensions fills a missing axis with its default", () => {
  assert.deepEqual(resolveDimensions({ width: 500 }), { width: 500, height: 300 });
  assert.deepEqual(resolveDimensions({ height: 620 }), { width: 400, height: 620 });
});

test("resolveDimensions keeps a full valid pair and rejects invalid values", () => {
  assert.deepEqual(resolveDimensions({ width: 500, height: 620 }), { width: 500, height: 620 });
  assert.deepEqual(resolveDimensions({ width: "x", height: -5 }), { width: 400, height: 300 });
});

import {
  GENERATED_MARKER,
  routeFor,
  renderPatternPage,
  renderIndexPage,
  buildManifest,
} from "./pattern-lib.mjs";

test("routeFor prefixes a slash", () => {
  assert.equal(routeFor("login-card"), "/login-card");
});

test("renderPatternPage imports the pattern via @/patterns and is marked", () => {
  const out = renderPatternPage("login-card");
  assert.match(out, new RegExp(GENERATED_MARKER));
  assert.match(out, /import Pattern from "@\/patterns\/login-card\/login-card"/);
  assert.match(out, /<Pattern \/>/);
});

test("renderIndexPage lists links and escapes text via JSON", () => {
  const out = renderIndexPage("@8bitcn", [
    { name: "login-card", route: "/login-card", title: 'A "quoted" title', description: "d" },
  ]);
  assert.match(out, new RegExp(GENERATED_MARKER));
  assert.match(out, /from "next\/link"/);
  assert.match(out, /href=\{"\/login-card"\}/);
  assert.match(out, /\{"A \\"quoted\\" title"\}/); // JSON.stringify-escaped
});

test("buildManifest wraps entries with registry name", () => {
  const entries = [{ name: "login-card", route: "/login-card", title: "t", description: "", categories: [], components: ["button"], keywords: [] }];
  assert.deepEqual(buildManifest("@8bitcn", entries), { registry: "@8bitcn", patterns: entries });
});

import { buildCatalog } from "./pattern-lib.mjs";

const SITES = [
  { slug: "8bitcn", manifest: { registry: "@8bitcn", patterns: [
    { name: "login-card", title: "Login card", dimensions: { width: 340, height: 300 }, internal: { categories: ["forms"] } },
  ] } },
  { slug: "fluid", manifest: { registry: "@fluid", patterns: [
    { name: "tabs-basic", title: "Tabs", internal: { categories: ["navigation"] } },
    { name: "badge-sizes", internal: { categories: ["data-display"] } },
  ] } },
];

test("buildCatalog aggregates registries, sorted categories, and patterns", () => {
  const cat = buildCatalog(SITES);
  assert.deepEqual(cat.registries, [
    { id: "@8bitcn", slug: "8bitcn", count: 1 },
    { id: "@fluid", slug: "fluid", count: 2 },
  ]);
  assert.deepEqual(cat.categories, ["data-display", "forms", "navigation"]);
  assert.equal(cat.patterns.length, 3);
});

test("buildCatalog derives iframeSrc, default dimensions, title fallback", () => {
  const cat = buildCatalog(SITES);
  const login = cat.patterns.find((p) => p.name === "login-card");
  assert.deepEqual(login, {
    registry: "@8bitcn", slug: "8bitcn", name: "login-card", title: "Login card",
    iframeSrc: "/sites/8bitcn/login-card/index.html", dimensions: { width: 340, height: 300 }, categories: ["forms"],
  });
  const badge = cat.patterns.find((p) => p.name === "badge-sizes");
  assert.equal(badge.iframeSrc, "/sites/fluid/badge-sizes/index.html");
  assert.equal(badge.title, "badge-sizes"); // title falls back to name
  assert.deepEqual(badge.dimensions, { width: 400, height: 300 }); // default
});

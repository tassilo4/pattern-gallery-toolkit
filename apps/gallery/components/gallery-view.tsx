"use client";

import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { filterPatterns } from "@/lib/catalog.mjs";
import { PatternCell } from "@/components/pattern-cell";
import { ThemeToggle } from "@/components/theme-toggle";

type Pattern = Parameters<typeof PatternCell>[0]["pattern"];
type Catalog = {
  registries: { id: string; slug: string; count: number }[];
  categories: string[];
  patterns: Pattern[];
};

export function GalleryView({ catalog }: { catalog: Catalog }) {
  const [registries, setRegistries] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const shown = filterPatterns(catalog.patterns, { registries, categories });

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pattern Gallery</h1>
          <p className="text-sm text-muted-foreground">
            {catalog.patterns.length} patterns across {catalog.registries.length} registries
          </p>
        </div>
        <ThemeToggle />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <ToggleGroup type="multiple" variant="outline" size="sm" value={registries} onValueChange={setRegistries}>
          {catalog.registries.map((r) => (
            <ToggleGroupItem key={r.id} value={r.id}>{r.id} ({r.count})</ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup type="multiple" variant="outline" size="sm" value={categories} onValueChange={setCategories}>
          {catalog.categories.map((c) => (
            <ToggleGroupItem key={c} value={c}>{c}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {catalog.patterns.length === 0 ? (
        <p className="text-muted-foreground">
          No catalog yet — run <code>publish-gallery</code> in the registry toolkit to generate previews.
        </p>
      ) : shown.length === 0 ? (
        <p className="text-muted-foreground">No patterns match the selected filters.</p>
      ) : (
        <div className="flex flex-wrap items-start gap-4">
          {shown.map((p) => (
            <PatternCell key={`${p.slug}/${p.name}`} pattern={p} />
          ))}
        </div>
      )}
    </main>
  );
}

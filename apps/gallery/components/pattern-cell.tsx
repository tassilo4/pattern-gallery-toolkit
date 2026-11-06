"use client";

import { useMemo, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { cn, mergeRefs } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { useVirtualMount } from "@/hooks/use-virtual-mount";
import { useIframeScrollPassthrough } from "@/hooks/use-iframe-scroll-passthrough";
import { useIframeTheme } from "@/hooks/use-iframe-theme";

type Pattern = {
  registry: string; slug: string; name: string; title: string;
  iframeSrc: string; dimensions: { width: number; height: number }; categories: string[];
};

export function PatternCell({ pattern }: { pattern: Pattern }) {
  const { width, height } = pattern.dimensions;
  const ref = useRef<HTMLDivElement>(null);
  const { mounted, onIframeSettled } = useVirtualMount(ref);
  const scrollRef = useIframeScrollPassthrough();
  const { resolvedTheme } = useTheme();
  const { ref: themeRef, themed } = useIframeTheme(resolvedTheme);
  // Stable so the iframe isn't detached/reattached every render (both refs are stable).
  const iframeRef = useMemo(() => mergeRefs(scrollRef, themeRef), [scrollRef, themeRef]);

  return (
    <div ref={ref} className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-mono text-xs text-muted-foreground">{pattern.title}</span>
          <Badge variant="secondary" className="shrink-0">{pattern.registry}</Badge>
        </div>
        <a
          href={pattern.iframeSrc}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${pattern.name} full route`}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <ExternalLink className="size-4" />
        </a>
      </div>
      {/* Mount the iframe so it loads, but keep it hidden (display:none still loads)
          until the theme is applied; the placeholder covers the gap. */}
      {mounted && (
        <iframe
          ref={iframeRef}
          src={pattern.iframeSrc}
          width={width}
          height={height}
          title={pattern.name}
          onLoad={onIframeSettled}
          onError={onIframeSettled}
          className={cn("block bg-background", !themed && "hidden")}
        />
      )}
      {(!mounted || !themed) && (
        <div
          style={{ width, height }}
          aria-hidden="true"
          className="animate-pulse bg-muted/40"
        />
      )}
    </div>
  );
}

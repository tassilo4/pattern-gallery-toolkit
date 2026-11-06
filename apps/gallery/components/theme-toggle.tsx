"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTheme, type Theme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={theme}
      // Single-select ToggleGroup emits "" when the active item is clicked again;
      // ignore that so a theme is always selected.
      onValueChange={(value) => {
        if (value) setTheme(value as Theme);
      }}
      aria-label="Color theme"
    >
      <ToggleGroupItem value="light" aria-label="Light">
        <Sun className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Dark">
        <Moon className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="system" aria-label="System">
        <Monitor className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

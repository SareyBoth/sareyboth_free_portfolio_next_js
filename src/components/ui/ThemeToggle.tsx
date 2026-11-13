"use client";

import React from "react";
import type { ColorMode } from "@/types/portfolio";
import { useOptionalAppearance } from "@/components/layout/AppearanceProvider";

const MODE_OPTIONS: Array<{ value: ColorMode; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ThemeToggle({
  controlledMode,
  onSelectMode,
}: {
  controlledMode?: ColorMode;
  onSelectMode?: (mode: ColorMode) => void;
}) {
  const appearance = useOptionalAppearance();
  const activeMode = controlledMode ?? appearance?.mode ?? "system";
  const handleSelect = onSelectMode ?? appearance?.setMode ?? (() => {});

  return (
    <div
      role="group"
      aria-label="Color theme preference"
      className="inline-flex items-center p-0.5 border border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
      style={{ borderRadius: "var(--radius-md)" }}
    >
      {MODE_OPTIONS.map((option) => {
        const isSelected = activeMode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => handleSelect(option.value)}
            className={`px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              isSelected
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-subtle)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent"
            }`}
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

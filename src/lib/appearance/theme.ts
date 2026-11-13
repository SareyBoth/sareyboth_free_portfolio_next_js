import type {
  AppearanceConfig,
  ColorMode,
  ResolvedColorMode,
} from "@/types/portfolio";
import { COLOR_MODES } from "@/lib/content/schema";

export const VISITOR_COLOR_MODE_STORAGE_KEY = "openfolio:color-mode";

export function isValidColorMode(value: unknown): value is ColorMode {
  return (
    typeof value === "string" &&
    (COLOR_MODES as readonly string[]).includes(value)
  );
}

export function readStoredColorMode(): ColorMode | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(VISITOR_COLOR_MODE_STORAGE_KEY);
    return isValidColorMode(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeStoredColorMode(mode: ColorMode): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    window.localStorage.setItem(VISITOR_COLOR_MODE_STORAGE_KEY, mode);
    return true;
  } catch {
    return false;
  }
}

export function resolveColorMode(
  mode: ColorMode,
  systemPrefersDark = false
): ResolvedColorMode {
  if (mode === "light" || mode === "dark") {
    return mode;
  }
  return systemPrefersDark ? "dark" : "light";
}

export function getThemeDataAttributes(
  appearance: AppearanceConfig,
  resolvedMode: ResolvedColorMode
) {
  return {
    "data-preset": appearance.defaultPreset,
    "data-mode": resolvedMode,
    "data-font": appearance.fontPreset,
    "data-density": appearance.density,
    "data-radius": appearance.radius,
  } as const;
}

export function buildThemeInitScript(defaultMode: ColorMode): string {
  const safeDefault = isValidColorMode(defaultMode) ? defaultMode : "system";
  return `(function(){try{var k=${JSON.stringify(
    VISITOR_COLOR_MODE_STORAGE_KEY
  )};var m=localStorage.getItem(k);if(m!=="light"&&m!=="dark"&&m!=="system"){m=${JSON.stringify(
    safeDefault
  )};}var r=m;if(m==="system"){r=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-mode",r);document.documentElement.setAttribute("data-color-preference",m);document.documentElement.style.colorScheme=r;}catch(e){}})();`;
}

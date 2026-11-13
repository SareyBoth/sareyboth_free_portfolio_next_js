"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ColorMode, ResolvedColorMode } from "@/types/portfolio";
import {
  readStoredColorMode,
  resolveColorMode,
  VISITOR_COLOR_MODE_STORAGE_KEY,
  writeStoredColorMode,
} from "@/lib/appearance/theme";

interface AppearanceContextValue {
  mode: ColorMode;
  resolvedMode: ResolvedColorMode;
  setMode: (nextMode: ColorMode) => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

const MODE_CHANGE_EVENT = "openfolio:color-mode-change";

function subscribeColorMode(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === null ||
      event.key === VISITOR_COLOR_MODE_STORAGE_KEY
    ) {
      onStoreChange();
    }
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(MODE_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(MODE_CHANGE_EVENT, onStoreChange);
  };
}

function subscribeSystemDark(onStoreChange: () => void): () => void {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return () => {};
  }
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

function getSystemDarkSnapshot(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getSystemDarkServerSnapshot(): boolean {
  return false;
}

export function AppearanceProvider({
  defaultMode,
  children,
}: {
  defaultMode: ColorMode;
  children: React.ReactNode;
}) {
  const getModeSnapshot = useCallback((): ColorMode => {
    return readStoredColorMode() ?? defaultMode;
  }, [defaultMode]);

  const getModeServerSnapshot = useCallback((): ColorMode => {
    return defaultMode;
  }, [defaultMode]);

  const mode = useSyncExternalStore(
    subscribeColorMode,
    getModeSnapshot,
    getModeServerSnapshot
  );

  const systemDark = useSyncExternalStore(
    subscribeSystemDark,
    getSystemDarkSnapshot,
    getSystemDarkServerSnapshot
  );

  const resolvedMode = useMemo(
    () => resolveColorMode(mode, systemDark),
    [mode, systemDark]
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-mode", resolvedMode);
    document.documentElement.setAttribute("data-color-preference", mode);
    document.documentElement.style.colorScheme = resolvedMode;
  }, [mode, resolvedMode]);

  const setMode = useCallback((nextMode: ColorMode) => {
    writeStoredColorMode(nextMode);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(MODE_CHANGE_EVENT));
    }
  }, []);

  const value = useMemo(
    () => ({
      mode,
      resolvedMode,
      setMode,
    }),
    [mode, resolvedMode, setMode]
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) {
    throw new Error("useAppearance must be used within an AppearanceProvider");
  }
  return ctx;
}

export function useOptionalAppearance(): AppearanceContextValue | null {
  return useContext(AppearanceContext);
}

"use client";

import React, {
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import type {
  ColorMode,
  DensityPreset,
  FontPreset,
  PortfolioConfig,
  RadiusPreset,
  SectionId,
  VisualPreset,
} from "@/types/portfolio";
import {
  COLOR_MODES,
  DENSITY_PRESETS,
  FONT_PRESETS,
  RADIUS_PRESETS,
  validatePortfolioConfig,
  VISUAL_PRESETS,
  type ValidationIssue,
} from "@/lib/content/schema";
import {
  buildNavigation,
  getConfiguredSocialLinks,
  isSectionEnabled,
  renameSectionInConfig,
  reorderSectionInConfig,
  sectionHasContent,
  sortSectionsDeterministically,
} from "@/lib/content/selectors";
import {
  getThemeDataAttributes,
  resolveColorMode,
} from "@/lib/appearance/theme";
import {
  clearDraftFromStorage,
  getDraftStorageServerSnapshot,
  getDraftStorageSnapshot,
  invalidateDraftStorageCache,
  MAX_IMPORT_FILE_BYTES,
  parseAndValidateImportedJson,
  readFileAsText,
  saveDraftToStorage,
  serializePortfolioConfig,
  subscribeDraftStorage,
} from "@/lib/customizer/draft";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SectionRenderer } from "@/components/sections/SectionRenderer";

const PRESET_DESCRIPTIONS: Record<
  VisualPreset,
  { label: string; summary: string }
> = {
  minimal: {
    label: "Minimal",
    summary: "Warm off-white, charcoal text, muted indigo accent",
  },
  warm: {
    label: "Warm",
    summary: "Soft cream, deep brown text, muted terracotta accent",
  },
  modern: {
    label: "Modern",
    summary: "Cool neutral surfaces, dark slate text, teal accent",
  },
};

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

export function CustomizerWorkspace({
  committedConfig,
  resumeAssetExists = true,
}: {
  committedConfig: PortfolioConfig;
  resumeAssetExists?: boolean;
}) {
  const storageOutcome = useSyncExternalStore(
    subscribeDraftStorage,
    getDraftStorageSnapshot,
    getDraftStorageServerSnapshot
  );

  const systemDark = useSyncExternalStore(
    subscribeSystemDark,
    getSystemDarkSnapshot,
    getSystemDarkServerSnapshot
  );

  const [sessionDraft, setSessionDraft] = useState<PortfolioConfig | null>(
    null
  );
  const [mobileView, setMobileView] = useState<"settings" | "preview">(
    "settings"
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<{
    summary: string;
    issues: ValidationIssue[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const draft = useMemo<PortfolioConfig>(() => {
    if (sessionDraft) {
      return sessionDraft;
    }
    if (storageOutcome.status === "loaded") {
      return storageOutcome.config;
    }
    return committedConfig;
  }, [sessionDraft, storageOutcome, committedConfig]);

  const effectiveStatusMessage = useMemo(() => {
    if (statusMessage) return statusMessage;
    if (!sessionDraft && storageOutcome.status === "loaded") {
      return "Restored your saved local browser draft. Public routes still use the committed portfolio.json.";
    }
    if (!sessionDraft && storageOutcome.status === "recovered") {
      return storageOutcome.reason;
    }
    return null;
  }, [statusMessage, sessionDraft, storageOutcome]);

  const applyDraftUpdate = (
    updater: (prev: PortfolioConfig) => PortfolioConfig
  ) => {
    setImportError(null);
    const next = updater(draft);
    setSessionDraft(next);
    const res = saveDraftToStorage(next);
    invalidateDraftStorageCache();
    if (!res.saved && res.error) {
      setStatusMessage(res.error);
    }
  };

  const sortedSections = useMemo(
    () => sortSectionsDeterministically(draft.sections),
    [draft.sections]
  );

  const previewNavItems = useMemo(
    () => buildNavigation(draft, { isSubpage: false, resumeAssetExists }),
    [draft, resumeAssetExists]
  );

  const previewSocialLinks = useMemo(
    () => getConfiguredSocialLinks(draft),
    [draft]
  );

  const previewResolvedMode = useMemo(
    () => resolveColorMode(draft.appearance.defaultMode, systemDark),
    [draft.appearance.defaultMode, systemDark]
  );

  const previewThemeAttributes = useMemo(
    () => getThemeDataAttributes(draft.appearance, previewResolvedMode),
    [draft.appearance, previewResolvedMode]
  );

  const draftValidation = useMemo(
    () => validatePortfolioConfig(draft),
    [draft]
  );

  const updateAppearance = <K extends keyof PortfolioConfig["appearance"]>(
    key: K,
    value: PortfolioConfig["appearance"][K]
  ) => {
    applyDraftUpdate((prev) => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        [key]: value,
      },
    }));
  };

  const updateProfileField = (
    field: "name" | "descriptor" | "introduction",
    value: string
  ) => {
    applyDraftUpdate((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value,
      },
    }));
  };

  const handleToggleSection = (sectionId: SectionId) => {
    applyDraftUpdate((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) =>
        sec.id === sectionId ? { ...sec, enabled: !sec.enabled } : sec
      ),
    }));
  };

  const handleRenameSection = (sectionId: SectionId, newTitle: string) => {
    applyDraftUpdate((prev) => renameSectionInConfig(prev, sectionId, newTitle));
  };

  const handleMoveSection = (
    sectionId: SectionId,
    direction: "up" | "down"
  ) => {
    applyDraftUpdate((prev) =>
      reorderSectionInConfig(prev, sectionId, direction)
    );
  };

  const handleResetToCommitted = () => {
    clearDraftFromStorage();
    invalidateDraftStorageCache();
    setImportError(null);
    setSessionDraft(committedConfig);
    setStatusMessage(
      "Reset customizer draft to the committed src/content/portfolio.json configuration."
    );
  };

  const handleExportJson = () => {
    const check = validatePortfolioConfig(draft);
    if (!check.success) {
      setImportError({
        summary:
          "Cannot export while required profile or section fields are empty. Fix the highlighted fields below first.",
        issues: check.issues,
      });
      return;
    }

    const jsonString = serializePortfolioConfig(check.data);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "portfolio.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setStatusMessage(
      "Exported portfolio.json. Copy it to src/content/portfolio.json, run npm run validate:content, and rebuild."
    );
  };

  const handleImportFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const inputEl = event.currentTarget;
    const file = inputEl.files?.[0] ?? event.target.files?.[0];
    if (!file) return;

    const resetInput = () => {
      try {
        inputEl.value = "";
      } catch {
        // ignore in synthetic test environments
      }
    };

    if (file.size > MAX_IMPORT_FILE_BYTES) {
      setImportError({
        summary: `File "${file.name}" exceeds the 1 MB size limit. Your existing draft was preserved.`,
        issues: [
          {
            path: "(file)",
            message: "Please select a JSON configuration file under 1 MB.",
          },
        ],
      });
      resetInput();
      return;
    }

    let text = "";
    try {
      text = await readFileAsText(file);
    } catch {
      setImportError({
        summary: `Could not read file "${file.name}". Your existing draft was preserved.`,
        issues: [
          {
            path: "(file)",
            message: "Unable to read the selected file.",
          },
        ],
      });
      resetInput();
      return;
    }

    const outcome = parseAndValidateImportedJson(text, file.size);
    if (!outcome.success) {
      setImportError({
        summary: outcome.errorSummary,
        issues: outcome.issues,
      });
      setStatusMessage(
        "Import rejected due to schema validation errors. Your existing valid draft remains intact."
      );
      resetInput();
      return;
    }

    setImportError(null);
    setSessionDraft(outcome.config);
    saveDraftToStorage(outcome.config);
    invalidateDraftStorageCache();
    setStatusMessage(
      `Imported "${file.name}" into local browser preview. Export and replace src/content/portfolio.json to make it permanent.`
    );
    resetInput();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:border-[var(--border-strong)] rounded-md"
            >
              <span aria-hidden="true">&larr;</span>
              <span>Back to Public Portfolio</span>
            </Link>
            <div>
              <h1 className="font-heading text-base sm:text-lg font-bold text-[var(--text-primary)]">
                SareyBothPortfolio Theme Customizer
              </h1>
              <p className="text-xs text-[var(--text-muted)] hidden sm:block">
                Local browser preview &amp; JSON configuration exporter — does not publish changes automatically.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Mobile view switcher */}
            <div
              role="group"
              aria-label="Customizer view mode"
              className="inline-flex lg:hidden p-0.5 border border-[var(--border-subtle)] bg-[var(--bg-subtle)] rounded-md"
            >
              <button
                type="button"
                aria-pressed={mobileView === "settings"}
                onClick={() => setMobileView("settings")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-xs cursor-pointer ${
                  mobileView === "settings"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs"
                    : "text-[var(--text-muted)]"
                }`}
              >
                Settings
              </button>
              <button
                type="button"
                aria-pressed={mobileView === "preview"}
                onClick={() => setMobileView("preview")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-xs cursor-pointer ${
                  mobileView === "preview"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs"
                    : "text-[var(--text-muted)]"
                }`}
              >
                Live Preview
              </button>
            </div>

            <input
              ref={fileInputRef}
              id="customizer-import-json-input"
              type="file"
              accept=".json,application/json"
              onChange={handleImportFileChange}
              className="sr-only"
              aria-label="Import portfolio JSON configuration"
            />
            <label
              htmlFor="customizer-import-json-input"
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded-md cursor-pointer"
            >
              Import JSON
            </label>

            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] rounded-md cursor-pointer"
            >
              Export JSON
            </button>

            <button
              type="button"
              onClick={handleResetToCommitted}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded-md cursor-pointer"
            >
              Reset to Default
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Workspace */}
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col lg:flex-row">
        {/* Settings Panel */}
        <aside
          aria-label="Customization controls"
          className={`w-full lg:w-[440px] xl:w-[480px] shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-6 space-y-6 lg:max-h-[calc(100vh-61px)] lg:overflow-y-auto ${
            mobileView === "preview" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Local persistence instructions banner */}
          <div className="p-3.5 text-xs bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg space-y-1.5">
            <p className="font-semibold text-[var(--text-primary)]">
              How this local customizer works
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Changes made here are saved only in this browser. To apply them to your site:
            </p>
            <ol className="list-decimal pl-4 space-y-0.5 text-[var(--text-secondary)]">
              <li>
                Click <strong>Export JSON</strong> to download <code>portfolio.json</code>.
              </li>
              <li>
                Replace <code>src/content/portfolio.json</code> in your repository.
              </li>
              <li>
                Run <code>npm run validate:content</code> and <code>npm run build</code>, then deploy.
              </li>
            </ol>
          </div>

          {effectiveStatusMessage && (
            <div
              role="status"
              aria-live="polite"
              className="p-3 text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent-soft-text)] rounded-md"
            >
              {effectiveStatusMessage}
            </div>
          )}

          {importError && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3.5 text-xs bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 rounded-md space-y-2"
            >
              <p className="font-semibold">{importError.summary}</p>
              <ul className="list-disc pl-4 space-y-1">
                {importError.issues.slice(0, 8).map((issue, idx) => (
                  <li key={idx}>
                    <span className="font-mono font-semibold">{issue.path}</span>:{" "}
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!draftValidation.success && (
            <div
              role="alert"
              className="p-3 text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-md space-y-1"
            >
              <p className="font-semibold">
                Please resolve the following before exporting:
              </p>
              <ul className="list-disc pl-4">
                {draftValidation.issues.map((issue, idx) => (
                  <li key={idx}>
                    {issue.path}: {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 1. Visual Preset & Color Mode */}
          <section className="space-y-4 pt-2 border-t border-[var(--border-subtle)]">
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
              1. Visual Preset &amp; Theme
            </h2>

            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-[var(--text-primary)]">
                Color Preset
              </legend>
              <div className="grid grid-cols-1 gap-2">
                {VISUAL_PRESETS.map((preset) => {
                  const active = draft.appearance.defaultPreset === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      aria-pressed={active}
                      onClick={() => updateAppearance("defaultPreset", preset)}
                      className={`text-left p-3 rounded-md border transition-colors cursor-pointer ${
                        active
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-soft-text)]"
                          : "border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <div className="font-semibold text-xs">
                        {PRESET_DESCRIPTIONS[preset].label}
                      </div>
                      <div className="text-[11px] opacity-85">
                        {PRESET_DESCRIPTIONS[preset].summary}
                      </div>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="space-y-1.5">
              <legend className="text-xs font-semibold text-[var(--text-primary)]">
                Default Color Mode
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {COLOR_MODES.map((modeOption: ColorMode) => {
                  const active = draft.appearance.defaultMode === modeOption;
                  return (
                    <button
                      key={modeOption}
                      type="button"
                      aria-pressed={active}
                      onClick={() => updateAppearance("defaultMode", modeOption)}
                      className={`px-3 py-2 text-xs font-semibold capitalize rounded-md border cursor-pointer ${
                        active
                          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]"
                          : "border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {modeOption}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <fieldset className="space-y-1.5">
                <legend className="text-xs font-semibold text-[var(--text-primary)]">
                  Heading Font
                </legend>
                <div className="flex flex-col gap-1.5">
                  {FONT_PRESETS.map((font: FontPreset) => {
                    const active = draft.appearance.fontPreset === font;
                    return (
                      <button
                        key={font}
                        type="button"
                        aria-pressed={active}
                        onClick={() => updateAppearance("fontPreset", font)}
                        className={`px-2.5 py-1.5 text-xs font-medium capitalize rounded-md border cursor-pointer ${
                          active
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-soft-text)] font-semibold"
                            : "border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {font === "sans" ? "Sans-Serif" : "Editorial Serif"}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="space-y-1.5">
                <legend className="text-xs font-semibold text-[var(--text-primary)]">
                  Spacing Density
                </legend>
                <div className="flex flex-col gap-1.5">
                  {DENSITY_PRESETS.map((density: DensityPreset) => {
                    const active = draft.appearance.density === density;
                    return (
                      <button
                        key={density}
                        type="button"
                        aria-pressed={active}
                        onClick={() => updateAppearance("density", density)}
                        className={`px-2.5 py-1.5 text-xs font-medium capitalize rounded-md border cursor-pointer ${
                          active
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-soft-text)] font-semibold"
                            : "border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {density}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="space-y-1.5">
                <legend className="text-xs font-semibold text-[var(--text-primary)]">
                  Corner Radius
                </legend>
                <div className="flex flex-col gap-1.5">
                  {RADIUS_PRESETS.map((radius: RadiusPreset) => {
                    const active = draft.appearance.radius === radius;
                    return (
                      <button
                        key={radius}
                        type="button"
                        aria-pressed={active}
                        onClick={() => updateAppearance("radius", radius)}
                        className={`px-2.5 py-1.5 text-xs font-medium capitalize rounded-md border cursor-pointer ${
                          active
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-soft-text)] font-semibold"
                            : "border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {radius}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          </section>

          {/* 2. Profile Introduction Fields */}
          <section className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
            <div className="space-y-1">
              <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                2. Profile Header Copy
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Edit your name, headline descriptor, and introduction below. Full collections (highlights, journey, articles) are edited in the exported <code>portfolio.json</code>.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label
                  htmlFor="customizer-profile-name"
                  className="block text-xs font-semibold text-[var(--text-primary)]"
                >
                  Profile Name
                </label>
                <input
                  id="customizer-profile-name"
                  type="text"
                  value={draft.profile.name}
                  onChange={(e) => updateProfileField("name", e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-md border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-primary)]"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="customizer-profile-descriptor"
                  className="block text-xs font-semibold text-[var(--text-primary)]"
                >
                  Short Descriptor
                </label>
                <input
                  id="customizer-profile-descriptor"
                  type="text"
                  value={draft.profile.descriptor}
                  onChange={(e) =>
                    updateProfileField("descriptor", e.target.value)
                  }
                  className="w-full px-3 py-1.5 text-sm rounded-md border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-primary)]"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="customizer-profile-intro"
                  className="block text-xs font-semibold text-[var(--text-primary)]"
                >
                  Introduction Paragraph
                </label>
                <textarea
                  id="customizer-profile-intro"
                  rows={3}
                  value={draft.profile.introduction}
                  onChange={(e) =>
                    updateProfileField("introduction", e.target.value)
                  }
                  className="w-full px-3 py-1.5 text-sm rounded-md border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-primary)]"
                />
              </div>
            </div>
          </section>

          {/* 3. Section Visibility, Headings & Order */}
          <section className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
            <div className="space-y-1">
              <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                3. Sections &amp; Navigation Order
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Toggle sections, rename headings, or reorder them. Navigation updates automatically to match enabled, non-empty sections.
              </p>
            </div>

            <ul className="space-y-2.5" aria-label="Section order and visibility">
              {sortedSections.map((sec, idx) => {
                const hasContent = sectionHasContent(draft, sec.id, {
                  resumeAssetExists,
                });
                const isFirst = idx === 0;
                const isLast = idx === sortedSections.length - 1;

                return (
                  <li
                    key={sec.id}
                    className="p-3 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-page)] space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sec.enabled}
                          onChange={() => handleToggleSection(sec.id)}
                          aria-label={`Enable ${sec.id} section`}
                          className="h-4 w-4 accent-[var(--accent)] rounded-xs cursor-pointer"
                        />
                        <span className="uppercase tracking-wider text-[11px] font-mono px-1.5 py-0.5 bg-[var(--bg-subtle)] rounded-xs">
                          {sec.id}
                        </span>
                        {!hasContent && (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400">
                            (Empty data)
                          </span>
                        )}
                      </label>

                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => handleMoveSection(sec.id, "up")}
                          aria-label={`Move ${sec.id} section up`}
                          className="px-2 py-1 text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed rounded-xs"
                        >
                          Move up
                        </button>
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => handleMoveSection(sec.id, "down")}
                          aria-label={`Move ${sec.id} section down`}
                          className="px-2 py-1 text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed rounded-xs"
                        >
                          Move down
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={`section-title-${sec.id}`}
                        className="sr-only"
                      >
                        Heading for {sec.id} section
                      </label>
                      <input
                        id={`section-title-${sec.id}`}
                        type="text"
                        value={sec.title}
                        onChange={(e) =>
                          handleRenameSection(sec.id, e.target.value)
                        }
                        aria-label={`Heading for ${sec.id} section`}
                        className="w-full px-2.5 py-1 text-xs rounded-xs border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>

        {/* Live Homepage Preview Surface */}
        <section
          aria-label="Live homepage preview"
          className={`flex-1 min-w-0 bg-[var(--bg-subtle)] p-2 sm:p-4 lg:p-6 ${
            mobileView === "settings" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-[var(--text-muted)]">
            <span>
              <strong>Live Preview Surface</strong> — Scoped to your draft settings ({draft.appearance.defaultPreset} / {previewResolvedMode} / {draft.appearance.fontPreset})
            </span>
            <span>
              In-page anchors scroll within preview; detail links open committed routes.
            </span>
          </div>

          <div
            {...previewThemeAttributes}
            data-testid="customizer-preview-surface"
            className="openfolio-theme-scope overflow-hidden rounded-xl border border-[var(--border-strong)] shadow-sm flex flex-col min-h-[75vh]"
          >
            <SiteHeader
              profileName={draft.profile.name || "Untitled Portfolio"}
              navItems={previewNavItems}
              showJournalRouteLink={isSectionEnabled(draft, "journal")}
              isPreview
              previewColorMode={draft.appearance.defaultMode}
              onPreviewColorModeChange={(mode) =>
                updateAppearance("defaultMode", mode)
              }
            />

            <main id="preview-main-content" className="flex-1">
              <SectionRenderer
                config={draft}
                resumeAssetExists={resumeAssetExists}
                isPreview
              />
            </main>

            <SiteFooter
              profileName={draft.profile.name || "Untitled Portfolio"}
              descriptor={draft.profile.descriptor}
              navItems={previewNavItems}
              socialLinks={previewSocialLinks}
              isPreview
            />
          </div>
        </section>
      </div>
    </div>
  );
}

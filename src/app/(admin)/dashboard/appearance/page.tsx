"use client";

import React, { useState, useEffect } from "react";
import { FormLayout } from "@/components/admin/FormLayout";
import { VISUAL_PRESETS, COLOR_MODES, FONT_PRESETS, DENSITY_PRESETS, RADIUS_PRESETS } from "@/lib/content/schema";
import { Palette, Sparkles, Check, Sun, Moon, Monitor } from "lucide-react";

export default function AppearancePage() {
  const [defaultPreset, setDefaultPreset] = useState("minimal");
  const [defaultMode, setDefaultMode] = useState("system");
  const [fontPreset, setFontPreset] = useState("sans");
  const [density, setDensity] = useState("comfortable");
  const [radius, setRadius] = useState("subtle");

  const [version, setVersion] = useState(1);
  const [isPublished, setIsPublished] = useState(true);
  const [publishedSnapshot, setPublishedSnapshot] = useState<any>(null);

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState(false);

  useEffect(() => {
    loadAppearance();
  }, []);

  async function loadAppearance() {
    try {
      const res = await fetch("/api/admin/appearance");
      if (res.ok) {
        const json = await res.json();
        const p = json.presentation;
        if (p) {
          setDefaultPreset(p.defaultPreset || "minimal");
          setDefaultMode(p.defaultMode || "system");
          setFontPreset(p.fontPreset || "sans");
          setDensity(p.density || "comfortable");
          setRadius(p.radius || "subtle");
          setVersion(p.version || 1);
          setPublishedSnapshot(p.publishedSnapshot);
          setIsPublished(Boolean(p.publishedSnapshot));
        }
      }
    } catch (err) {
      console.error("Failed to load appearance:", err);
    }
  }

  function handleFieldChange<T>(setter: React.Dispatch<React.SetStateAction<T>>, val: T) {
    setter(val);
    setIsDirty(true);
    setSuccessMessage(null);
  }

  async function saveSettings(publish = false) {
    if (publish) setPublishing(true);
    else setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setConflictError(false);

    try {
      const res = await fetch("/api/admin/appearance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultPreset,
          defaultMode,
          fontPreset,
          density,
          radius,
          version,
          publish,
        }),
      });

      if (res.status === 409) {
        setConflictError(true);
        return;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to update appearance.");
      }

      const json = await res.json();
      const updated = json.presentation;
      setVersion(updated.version);
      setIsDirty(false);

      if (publish) {
        setIsPublished(true);
        setPublishedSnapshot(updated.publishedSnapshot);
        setSuccessMessage("Appearance settings published to public portfolio!");
      } else {
        setSuccessMessage("Appearance draft saved successfully.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save.");
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  }

  return (
    <FormLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Settings" },
        { label: "Appearance" },
      ]}
      title="Appearance & Theme"
      subtitle="Customize your portfolio's visual preset, color mode, typography, density, and border radius."
      isPublished={isPublished}
      isDirty={isDirty}
      version={version}
      saving={saving}
      publishing={publishing}
      errorMessage={errorMessage}
      successMessage={successMessage}
      conflictError={conflictError}
      onSaveDraft={() => saveSettings(false)}
      onPublish={() => saveSettings(true)}
      onReload={() => window.location.reload()}
      previewUrl="/preview"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form Controls */}
        <div className="lg:col-span-2 space-y-8 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 sm:p-8 shadow-xs">
          {/* Preset Selection */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-[var(--text)]">
                Design Preset
              </label>
              <p className="text-xs text-[var(--muted)]">
                Selects the foundational palette, tonal contrast, and mood.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "minimal",
                  name: "Minimal",
                  desc: "Gallery neutral, refined cool gray palette with crisp typography.",
                  colors: ["#FAF9F6", "#202124", "#4F46B8"],
                },
                {
                  id: "warm",
                  name: "Warm Editorial",
                  desc: "Paper tones, terracotta accents, and soft organic contrast.",
                  colors: ["#FCF7F0", "#30251F", "#9F3D26"],
                },
                {
                  id: "modern",
                  name: "Modern Studio",
                  desc: "Cool slate, deep teal accents, and contemporary contrast.",
                  colors: ["#F6F8FA", "#17252B", "#096B64"],
                },
              ].map((p) => {
                const isSelected = defaultPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleFieldChange(setDefaultPreset, p.id)}
                    className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-[var(--accent)] ring-2 ring-[var(--accent)] bg-[var(--accent)]/5"
                        : "border-[var(--border)] hover:border-[var(--muted)]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-[var(--text)]">
                          {p.name}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                        {p.desc}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-[var(--border)]">
                      {p.colors.map((c, idx) => (
                        <div
                          key={idx}
                          className="w-5 h-5 rounded-full border border-black/10"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Mode */}
          <div className="space-y-3 pt-4 border-t border-[var(--border)]">
            <div>
              <label className="text-sm font-semibold text-[var(--text)]">
                Default Color Mode
              </label>
              <p className="text-xs text-[var(--muted)]">
                Initial theme for first-time visitors before browser preference detection.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "system", label: "System Sync", icon: Monitor },
                { id: "light", label: "Light", icon: Sun },
                { id: "dark", label: "Dark", icon: Moon },
              ].map((m) => {
                const isSelected = defaultMode === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleFieldChange(setDefaultMode, m.id)}
                    className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      isSelected
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs"
                        : "border-[var(--border)] text-[var(--text)] hover:bg-[var(--muted)]/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Typography Preset */}
          <div className="space-y-3 pt-4 border-t border-[var(--border)]">
            <div>
              <label className="text-sm font-semibold text-[var(--text)]">
                Typography Font Family
              </label>
              <p className="text-xs text-[var(--muted)]">
                Heading and body font pairings.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "sans", label: "Clean Sans-Serif", sample: "Inter / Arial / Helvetica" },
                { id: "serif", label: "Editorial Serif", sample: "Georgia / Times New Roman" },
              ].map((f) => {
                const isSelected = fontPreset === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleFieldChange(setFontPreset, f.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-[var(--accent)] ring-1 ring-[var(--accent)] bg-[var(--accent)]/5"
                        : "border-[var(--border)] hover:bg-[var(--muted)]/5"
                    }`}
                  >
                    <div className="font-semibold text-sm text-[var(--text)]">
                      {f.label}
                    </div>
                    <div className="text-xs text-[var(--muted)] mt-1">
                      {f.sample}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Density & Border Radius */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[var(--border)]">
            <div className="space-y-2">
              <label
                htmlFor="density-select"
                className="text-sm font-semibold text-[var(--text)]"
              >
                Layout Density
              </label>
              <select
                id="density-select"
                value={density}
                onChange={(e) => handleFieldChange(setDensity, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
              >
                <option value="compact">Compact (Tighter padding & cards)</option>
                <option value="comfortable">Comfortable (Balanced default)</option>
                <option value="spacious">Spacious (Editorial breathing room)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="radius-select"
                className="text-sm font-semibold text-[var(--text)]"
              >
                Corner Radius
              </label>
              <select
                id="radius-select"
                value={radius}
                onChange={(e) => handleFieldChange(setRadius, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
              >
                <option value="sharp">Sharp (0px radius)</option>
                <option value="subtle">Subtle (6px-8px radius)</option>
                <option value="rounded">Rounded (12px-16px radius)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Col: Live Preview Card */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Live Preview
          </h2>

          <div
            className="p-5 border border-[var(--border)] bg-[var(--surface)] rounded-xl shadow-xs space-y-4"
            data-preset={defaultPreset}
            data-theme={defaultMode === "system" ? "light" : defaultMode}
            data-font={fontPreset}
            data-density={density}
            data-radius={radius}
          >
            <div className="border-b border-[var(--border)] pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">
                Sample Card
              </span>
              <h3 className="text-lg font-bold text-[var(--text)] mt-1">
                Portfolio Appearance
              </h3>
            </div>

            <p className="text-xs text-[var(--muted)] leading-relaxed">
              This card reflects your selected preset (<strong className="text-[var(--text)]">{defaultPreset}</strong>), font (<strong className="text-[var(--text)]">{fontPreset}</strong>), and radius (<strong className="text-[var(--text)]">{radius}</strong>).
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs"
              >
                Primary Button
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--border)] text-[var(--text)]"
              >
                Outline Button
              </button>
            </div>
          </div>

          {/* Published Snapshot Info */}
          <div className="p-4 rounded-lg bg-[var(--muted)]/5 border border-[var(--border)] text-xs text-[var(--muted)] space-y-1">
            <p className="font-semibold text-[var(--text)]">Publication Status</p>
            {publishedSnapshot ? (
              <p>
                Public visitors see preset: <strong>{publishedSnapshot.defaultPreset}</strong>, mode: <strong>{publishedSnapshot.defaultMode}</strong>.
              </p>
            ) : (
              <p>No published snapshot found. Save and publish to apply changes to the live site.</p>
            )}
          </div>
        </div>
      </div>
    </FormLayout>
  );
}

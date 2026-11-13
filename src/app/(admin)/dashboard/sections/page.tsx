"use client";

import React, { useState, useEffect } from "react";
import { FormLayout } from "@/components/admin/FormLayout";
import { ArrowUp, ArrowDown, GripVertical, Check, Eye, EyeOff } from "lucide-react";

interface SectionItem {
  id: string;
  title: string;
  navLabel?: string | null;
  subtitle?: string | null;
  enabled: boolean;
  displayOrder: number;
}

export default function SectionsManagerPage() {
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSections();
  }, []);

  async function loadSections() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sections");
      if (res.ok) {
        const json = await res.json();
        setSections(json.sections || []);
      }
    } catch (err) {
      console.error("Failed to load sections:", err);
    } finally {
      setLoading(false);
    }
  }

  function moveSection(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const next = [...sections];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;

    // re-assign display orders
    next.forEach((s, i) => {
      s.displayOrder = i;
    });

    setSections(next);
    setIsDirty(true);
    setSuccessMessage(null);
  }

  function toggleEnabled(index: number) {
    const next = [...sections];
    next[index].enabled = !next[index].enabled;
    setSections(next);
    setIsDirty(true);
    setSuccessMessage(null);
  }

  function updateField(index: number, field: keyof SectionItem, val: any) {
    const next = [...sections];
    (next[index] as any)[field] = val;
    setSections(next);
    setIsDirty(true);
    setSuccessMessage(null);
  }

  async function handleSave() {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/admin/sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });

      if (!res.ok) {
        throw new Error("Failed to save sections configuration.");
      }

      setIsDirty(false);
      setSuccessMessage("Section ordering and visibility updated successfully.");
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Portfolio" },
        { label: "Sections" },
      ]}
      title="Portfolio Sections"
      subtitle="Reorder portfolio sections and toggle their visibility on the public homepage."
      isDirty={isDirty}
      saving={saving}
      errorMessage={errorMessage}
      successMessage={successMessage}
      onSaveDraft={handleSave}
      onReload={() => window.location.reload()}
      previewUrl="/preview"
      backHref="/dashboard"
    >
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-sm text-[var(--muted)]">
            Loading sections...
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((sec, idx) => (
              <div
                key={sec.id}
                className={`p-4 rounded-xl border transition-all bg-[var(--surface)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  sec.enabled
                    ? "border-[var(--border)]"
                    : "border-dashed border-[var(--border)] opacity-60"
                }`}
              >
                {/* Left: Reorder buttons & ID */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveSection(idx, "up")}
                      disabled={idx === 0}
                      aria-label="Move section up"
                      className="p-1 rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--muted)]/10 disabled:opacity-20 transition-colors"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(idx, "down")}
                      disabled={idx === sections.length - 1}
                      aria-label="Move section down"
                      className="p-1 rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--muted)]/10 disabled:opacity-20 transition-colors"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="w-7 h-7 rounded-full bg-[var(--muted)]/10 text-xs font-mono font-bold flex items-center justify-center text-[var(--text)]">
                    {idx + 1}
                  </span>

                  <div>
                    <span className="font-mono text-xs uppercase tracking-wider text-[var(--muted)] font-semibold">
                      #{sec.id}
                    </span>
                  </div>
                </div>

                {/* Center: Title & Subtitle inputs */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--muted)] block">
                      Heading Title
                    </label>
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => updateField(idx, "title", e.target.value)}
                      className="w-full px-2.5 py-1 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-1 focus:ring-[var(--accent)] font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[var(--muted)] block">
                      Navigation Link Label
                    </label>
                    <input
                      type="text"
                      value={sec.navLabel || ""}
                      onChange={(e) => updateField(idx, "navLabel", e.target.value)}
                      placeholder={sec.title}
                      className="w-full px-2.5 py-1 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                </div>

                {/* Right: Enabled toggle */}
                <div className="flex items-center gap-2 shrink-0 sm:border-l sm:border-[var(--border)] sm:pl-4">
                  <button
                    type="button"
                    onClick={() => toggleEnabled(idx)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      sec.enabled
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-[var(--muted)]/10 text-[var(--muted)] border-[var(--border)]"
                    }`}
                  >
                    {sec.enabled ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Disabled</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FormLayout>
  );
}

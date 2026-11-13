"use client";

import React, { useState, useEffect } from "react";
import { FormLayout } from "@/components/admin/FormLayout";

export default function LabelsSettingsPage() {
  const [exploreHighlightsCta, setExploreHighlightsCta] = useState("");
  const [contactCta, setContactCta] = useState("");
  const [downloadResumeCta, setDownloadResumeCta] = useState("");
  const [allCategoriesFilter, setAllCategoriesFilter] = useState("");
  const [emptyHighlightsText, setEmptyHighlightsText] = useState("");
  const [emptyArticlesText, setEmptyArticlesText] = useState("");
  const [sampleTestimonialsNotice, setSampleTestimonialsNotice] = useState("");
  const [version, setVersion] = useState(1);

  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/labels")
      .then((r) => r.json())
      .then((json) => {
        const l = json.labels;
        if (l) {
          setExploreHighlightsCta(l.exploreHighlightsCta || "");
          setContactCta(l.contactCta || "");
          setDownloadResumeCta(l.downloadResumeCta || "");
          setAllCategoriesFilter(l.allCategoriesFilter || "");
          setEmptyHighlightsText(l.emptyHighlightsText || "");
          setEmptyArticlesText(l.emptyArticlesText || "");
          setSampleTestimonialsNotice(l.sampleTestimonialsNotice || "");
          setVersion(l.version || 1);
        }
      })
      .catch(() => {});
  }, []);

  function handleFieldChange<T>(setter: React.Dispatch<React.SetStateAction<T>>, val: T) {
    setter(val);
    setIsDirty(true);
    setSuccessMessage(null);
  }

  async function handleSave() {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setConflictError(false);

    try {
      const res = await fetch("/api/admin/labels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exploreHighlightsCta,
          contactCta,
          downloadResumeCta,
          allCategoriesFilter,
          emptyHighlightsText,
          emptyArticlesText,
          sampleTestimonialsNotice,
          version,
        }),
      });

      if (res.status === 409) {
        setConflictError(true);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update labels.");
      }

      const json = await res.json();
      setVersion(json.labels.version);
      setIsDirty(false);
      setSuccessMessage("Labels & UI copy saved successfully.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Settings" },
        { label: "Labels & Copy" },
      ]}
      title="Labels & UI Copy"
      subtitle="Customize microcopy, default filter labels, and empty state announcements."
      isDirty={isDirty}
      version={version}
      saving={saving}
      errorMessage={errorMessage}
      successMessage={successMessage}
      conflictError={conflictError}
      onSaveDraft={handleSave}
      onReload={() => window.location.reload()}
      previewUrl="/preview"
    >
      <div className="space-y-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label
              htmlFor="cta-highlights"
              className="block text-xs font-semibold text-[var(--text)]"
            >
              Explore Highlights CTA
            </label>
            <input
              id="cta-highlights"
              type="text"
              value={exploreHighlightsCta}
              onChange={(e) =>
                handleFieldChange(setExploreHighlightsCta, e.target.value)
              }
              className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="cta-contact"
              className="block text-xs font-semibold text-[var(--text)]"
            >
              Contact Me CTA
            </label>
            <input
              id="cta-contact"
              type="text"
              value={contactCta}
              onChange={(e) => handleFieldChange(setContactCta, e.target.value)}
              className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label
              htmlFor="cta-resume"
              className="block text-xs font-semibold text-[var(--text)]"
            >
              Download Resume CTA
            </label>
            <input
              id="cta-resume"
              type="text"
              value={downloadResumeCta}
              onChange={(e) =>
                handleFieldChange(setDownloadResumeCta, e.target.value)
              }
              className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="all-filter"
              className="block text-xs font-semibold text-[var(--text)]"
            >
              All Categories Filter Label
            </label>
            <input
              id="all-filter"
              type="text"
              value={allCategoriesFilter}
              onChange={(e) =>
                handleFieldChange(setAllCategoriesFilter, e.target.value)
              }
              className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="empty-highlights"
            className="block text-xs font-semibold text-[var(--text)]"
          >
            Empty Highlights Filter Message
          </label>
          <input
            id="empty-highlights"
            type="text"
            value={emptyHighlightsText}
            onChange={(e) =>
              handleFieldChange(setEmptyHighlightsText, e.target.value)
            }
            className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="empty-articles"
            className="block text-xs font-semibold text-[var(--text)]"
          >
            Empty Journal Articles Message
          </label>
          <input
            id="empty-articles"
            type="text"
            value={emptyArticlesText}
            onChange={(e) =>
              handleFieldChange(setEmptyArticlesText, e.target.value)
            }
            className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
      </div>
    </FormLayout>
  );
}

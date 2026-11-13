"use client";

import React, { useState, useEffect } from "react";
import { FormLayout } from "@/components/admin/FormLayout";

export default function FooterSettingsPage() {
  const [copyrightNotice, setCopyrightNotice] = useState("");
  const [showSectionsNav, setShowSectionsNav] = useState(true);
  const [showSocialLinks, setShowSocialLinks] = useState(true);
  const [customText, setCustomText] = useState("");
  const [version, setVersion] = useState(1);

  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/footer")
      .then((r) => r.json())
      .then((json) => {
        const f = json.footer;
        if (f) {
          setCopyrightNotice(f.copyrightNotice || "");
          setShowSectionsNav(f.showSectionsNav !== false);
          setShowSocialLinks(f.showSocialLinks !== false);
          setCustomText(f.customText || "");
          setVersion(f.version || 1);
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
      const res = await fetch("/api/admin/footer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          copyrightNotice: copyrightNotice.trim() || null,
          showSectionsNav,
          showSocialLinks,
          customText: customText.trim() || null,
          version,
        }),
      });

      if (res.status === 409) {
        setConflictError(true);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update footer.");
      }

      const json = await res.json();
      setVersion(json.footer.version);
      setIsDirty(false);
      setSuccessMessage("Footer settings saved successfully.");
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
        { label: "Footer" },
      ]}
      title="Footer Settings"
      subtitle="Configure copyright text, social links, section links, and custom footer copy."
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
        <div className="space-y-1">
          <label
            htmlFor="copyright"
            className="block text-xs font-semibold text-[var(--text)]"
          >
            Copyright Notice
          </label>
          <input
            id="copyright"
            type="text"
            value={copyrightNotice}
            onChange={(e) => handleFieldChange(setCopyrightNotice, e.target.value)}
            placeholder="© 2026 SareyBoth. Built with SareyBothPortfolio."
            className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="custom-text"
            className="block text-xs font-semibold text-[var(--text)]"
          >
            Custom Secondary Text / Colophon
          </label>
          <textarea
            id="custom-text"
            rows={2}
            value={customText}
            onChange={(e) => handleFieldChange(setCustomText, e.target.value)}
            placeholder="Designed with care. Self-hosted on PostgreSQL."
            className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <label className="inline-flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/5">
            <input
              type="checkbox"
              checked={showSectionsNav}
              onChange={(e) => handleFieldChange(setShowSectionsNav, e.target.checked)}
              className="rounded text-[var(--accent)] focus:ring-[var(--accent)] w-4 h-4"
            />
            <span className="text-xs font-medium text-[var(--text)]">
              Show section navigation links
            </span>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/5">
            <input
              type="checkbox"
              checked={showSocialLinks}
              onChange={(e) => handleFieldChange(setShowSocialLinks, e.target.checked)}
              className="rounded text-[var(--accent)] focus:ring-[var(--accent)] w-4 h-4"
            />
            <span className="text-xs font-medium text-[var(--text)]">
              Show social profile icons in footer
            </span>
          </label>
        </div>
      </div>
    </FormLayout>
  );
}

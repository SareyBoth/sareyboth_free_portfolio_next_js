"use client";

import React, { useState, useEffect } from "react";
import { FormLayout } from "@/components/admin/FormLayout";
import { MediaPicker, SelectedMedia } from "@/components/admin/MediaPicker";
import { Image as ImageIcon, Globe, ShieldAlert } from "lucide-react";

export default function SiteSettingsPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [locale, setLocale] = useState("en-US");
  const [indexable, setIndexable] = useState(false);
  const [socialImage, setSocialImage] = useState<{ src: string; alt: string }>({
    src: "",
    alt: "",
  });
  const [faviconUrl, setFaviconUrl] = useState("");
  const [version, setVersion] = useState(1);

  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch("/api/admin/site-settings");
      if (res.ok) {
        const json = await res.json();
        const s = json.siteSettings;
        if (s) {
          setTitle(s.title || "");
          setDescription(s.description || "");
          setSiteUrl(s.siteUrl || "");
          setLocale(s.locale || "en-US");
          setIndexable(Boolean(s.indexable));
          if (s.socialImage) setSocialImage(s.socialImage);
          setFaviconUrl(s.faviconUrl || "");
          setVersion(s.version || 1);
        }
      }
    } catch (err) {
      console.error("Failed to load site settings:", err);
    }
  }

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
      const payload = {
        title,
        description,
        siteUrl,
        locale,
        indexable,
        socialImage: socialImage.src ? socialImage : null,
        faviconUrl: faviconUrl.trim() || null,
        version,
      };

      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        setConflictError(true);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save site settings.");
      }

      const json = await res.json();
      setVersion(json.siteSettings.version);
      setIsDirty(false);
      setSuccessMessage("Site settings saved successfully.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Settings" },
        { label: "Site Settings" },
      ]}
      title="Global Site Settings"
      subtitle="Configure SEO metadata, search engine indexing, canonical domain, and social card graphics."
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
      <div className="space-y-8 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 sm:p-8 shadow-xs">
        {/* SEO & Identity */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[var(--text)] border-b border-[var(--border)] pb-2">
            SEO & Canonical Metadata
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="site-title"
                className="block text-xs font-semibold text-[var(--text)]"
              >
                Default Page Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="site-title"
                type="text"
                value={title}
                onChange={(e) => handleFieldChange(setTitle, e.target.value)}
                placeholder="SareyBoth — SareyBothPortfolio"
                className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="site-url"
                className="block text-xs font-semibold text-[var(--text)]"
              >
                Canonical Site URL <span className="text-rose-500">*</span>
              </label>
              <input
                id="site-url"
                type="text"
                value={siteUrl}
                onChange={(e) => handleFieldChange(setSiteUrl, e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 text-sm font-mono bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="site-desc"
              className="block text-xs font-semibold text-[var(--text)]"
            >
              Meta Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="site-desc"
              rows={2}
              value={description}
              onChange={(e) => handleFieldChange(setDescription, e.target.value)}
              placeholder="Search engine summary snippet for the root portfolio page..."
              className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="site-locale"
                className="block text-xs font-semibold text-[var(--text)]"
              >
                HTML Locale
              </label>
              <input
                id="site-locale"
                type="text"
                value={locale}
                onChange={(e) => handleFieldChange(setLocale, e.target.value)}
                placeholder="en-US"
                className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="site-favicon"
                className="block text-xs font-semibold text-[var(--text)]"
              >
                Custom Favicon Path
              </label>
              <input
                id="site-favicon"
                type="text"
                value={faviconUrl}
                onChange={(e) => handleFieldChange(setFaviconUrl, e.target.value)}
                placeholder="/favicon.ico"
                className="w-full px-3 py-2 text-sm font-mono bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
        </div>

        {/* Indexing Policy */}
        <div className="space-y-4 pt-4 border-t border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--text)]">
            Search Engine Indexing
          </h2>

          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/5 flex items-start gap-4">
            <input
              id="site-indexable"
              type="checkbox"
              checked={indexable}
              onChange={(e) => handleFieldChange(setIndexable, e.target.checked)}
              className="mt-1 rounded text-[var(--accent)] focus:ring-[var(--accent)] w-5 h-5 cursor-pointer"
            />
            <div className="flex-1 space-y-1">
              <label
                htmlFor="site-indexable"
                className="font-semibold text-sm text-[var(--text)] cursor-pointer"
              >
                Allow Search Engine Indexing (Robots & Sitemap)
              </label>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                When enabled and canonical origin is a production domain (not example.com or localhost), search bots are permitted to crawl published highlights and articles. When disabled, robots.txt emits <code>disallow: /</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Social Share Image */}
        <div className="space-y-4 pt-4 border-t border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--text)] border-b border-[var(--border)] pb-2">
            Social Share Image (OpenGraph / Twitter Card)
          </h2>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={socialImage.src}
                  onChange={(e) =>
                    handleFieldChange(setSocialImage, {
                      ...socialImage,
                      src: e.target.value,
                    })
                  }
                  placeholder="/images/social-card.png or https://..."
                  className="flex-1 px-3 py-1.5 text-sm font-mono bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={() => setShowImagePicker(true)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--muted)]/10 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Choose Image</span>
                </button>
              </div>

              <input
                type="text"
                value={socialImage.alt}
                onChange={(e) =>
                  handleFieldChange(setSocialImage, {
                    ...socialImage,
                    alt: e.target.value,
                  })
                }
                placeholder="Alt description for social sharing image"
                className="w-full px-3 py-1.5 text-xs bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            {socialImage.src && (
              <div className="w-36 h-20 rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--muted)]/10 shrink-0">
                <img
                  src={socialImage.src}
                  alt={socialImage.alt}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {showImagePicker && (
        <MediaPicker
          isOpen={true}
          onClose={() => setShowImagePicker(false)}
          onSelect={(media: SelectedMedia) => {
            handleFieldChange(setSocialImage, {
              src: media.src,
              alt: media.alt || title || "Social card",
            });
          }}
          initialAlt={socialImage.alt || title}
        />
      )}
    </FormLayout>
  );
}

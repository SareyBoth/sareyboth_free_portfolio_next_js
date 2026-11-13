"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FormLayout } from "@/components/admin/FormLayout";
import { BlockEditor } from "@/components/admin/BlockEditor";
import { MediaPicker, SelectedMedia } from "@/components/admin/MediaPicker";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import type { ContentBlock } from "@/types/portfolio";

interface HighlightEditorFormProps {
  initialData?: any;
  isNew?: boolean;
}

export function HighlightEditorForm({
  initialData,
  isNew = false,
}: HighlightEditorFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [summary, setSummary] = useState(initialData?.summary || "");
  const [category, setCategory] = useState(
    initialData?.categoryName || initialData?.category?.name || "General"
  );
  const [featured, setFeatured] = useState(Boolean(initialData?.featured));
  const [date, setDate] = useState(initialData?.date || "");
  const [roleOrContribution, setRoleOrContribution] = useState(
    initialData?.roleOrContribution || ""
  );
  const [context, setContext] = useState(initialData?.context || "");
  const [outcomes, setOutcomes] = useState<string[]>(
    Array.isArray(initialData?.outcomes) ? initialData.outcomes : [""]
  );
  const [tagsString, setTagsString] = useState<string>(
    Array.isArray(initialData?.tags)
      ? initialData.tags.join(", ")
      : Array.isArray(initialData?.tagNames)
      ? initialData.tagNames.join(", ")
      : ""
  );
  const [coverImage, setCoverImage] = useState<{
    src: string;
    alt: string;
    caption?: string;
  }>(initialData?.coverImage || { src: "", alt: "", caption: "" });
  const [body, setBody] = useState<ContentBlock[]>(
    Array.isArray(initialData?.body) ? initialData.body : []
  );

  const [version, setVersion] = useState<number>(initialData?.version || 1);
  const [isPublished, setIsPublished] = useState<boolean>(
    Boolean(initialData?.published)
  );

  // States
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Categories list
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/admin/highlight-categories")
      .then((r) => r.json())
      .then((json) => {
        if (json.categories) setCategories(json.categories);
      })
      .catch(() => {});
  }, []);

  function handleFieldChange<T>(setter: React.Dispatch<React.SetStateAction<T>>, val: T) {
    setter(val);
    setIsDirty(true);
    setSuccessMessage(null);
  }

  function getPayload() {
    const tags = tagsString
      .split(",")
      .map((t: string) => t.trim())
      .filter(Boolean);

    return {
      title,
      slug,
      summary,
      category,
      featured,
      date: date.trim() || undefined,
      roleOrContribution,
      context,
      outcomes: outcomes.map((o) => o.trim()).filter(Boolean),
      tags,
      coverImage: coverImage.src ? coverImage : null,
      body,
      version,
    };
  }

  async function handleSaveDraft() {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setConflictError(false);

    try {
      const payload = getPayload();
      const url = isNew
        ? "/api/admin/highlights"
        : `/api/admin/highlights/${initialData.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        setConflictError(true);
        return;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to save highlight.");
      }

      const json = await res.json();
      const saved = json.highlight;

      setIsDirty(false);
      setVersion(saved.version);
      setSuccessMessage("Draft saved successfully.");

      if (isNew) {
        router.replace(`/dashboard/highlights/${saved.id}/edit`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // If dirty or new, save draft first
      let currentId = initialData?.id;
      if (isDirty || isNew) {
        const payload = getPayload();
        const url = isNew
          ? "/api/admin/highlights"
          : `/api/admin/highlights/${currentId}`;
        const method = isNew ? "POST" : "PUT";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.status === 409) {
          setConflictError(true);
          return;
        }

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to save draft before publishing.");
        }
        const json = await res.json();
        currentId = json.highlight.id;
        setVersion(json.highlight.version);
      }

      // Publish endpoint
      const pubRes = await fetch(`/api/admin/highlights/${currentId}/publish`, {
        method: "POST",
      });

      if (!pubRes.ok) {
        const err = await pubRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to publish highlight.");
      }

      const pubJson = await pubRes.json();
      setIsPublished(true);
      setVersion(pubJson.highlight.version);
      setIsDirty(false);
      setSuccessMessage("Highlight published to public portfolio!");

      if (isNew) {
        router.replace(`/dashboard/highlights/${currentId}/edit`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Publication error.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    if (!initialData?.id) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/admin/highlights/${initialData.id}/publish`, {
        method: "DELETE",
      });
      if (res.ok) {
        const json = await res.json();
        setIsPublished(false);
        setVersion(json.highlight.version);
        setSuccessMessage("Highlight unpublished (now draft).");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to unpublish.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete() {
    if (!initialData?.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/highlights/${initialData.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/dashboard/highlights");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <FormLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Highlights", href: "/dashboard/highlights" },
        { label: isNew ? "New Highlight" : title || "Edit Highlight" },
      ]}
      title={isNew ? "Create Highlight" : `Edit "${title}"`}
      subtitle="Configure project narrative, key outcomes, tags, and media gallery."
      isPublished={isPublished}
      isDirty={isDirty}
      version={version}
      saving={saving}
      publishing={publishing}
      deleting={deleting}
      errorMessage={errorMessage}
      successMessage={successMessage}
      conflictError={conflictError}
      onSaveDraft={handleSaveDraft}
      onPublish={handlePublish}
      onUnpublish={isPublished ? handleUnpublish : undefined}
      onDelete={!isNew ? () => setShowDeleteConfirm(true) : undefined}
      onReload={() => window.location.reload()}
      previewUrl={slug ? `/preview/highlights/${slug}` : undefined}
      backHref="/dashboard/highlights"
    >
      <div className="space-y-8 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 sm:p-8 shadow-xs">
        {/* Core Metadata */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[var(--text)] border-b border-[var(--border)] pb-2">
            Overview & Metadata
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="highlight-title"
                className="block text-xs font-semibold text-[var(--text)]"
              >
                Highlight Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="highlight-title"
                type="text"
                value={title}
                onChange={(e) => {
                  handleFieldChange(setTitle, e.target.value);
                  if (isNew && !slug) {
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9]+/g, "-")
                    );
                  }
                }}
                placeholder="e.g. Community Seed Library"
                className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="highlight-slug"
                className="block text-xs font-semibold text-[var(--text)]"
              >
                URL Slug <span className="text-rose-500">*</span>
              </label>
              <input
                id="highlight-slug"
                type="text"
                value={slug}
                onChange={(e) => handleFieldChange(setSlug, e.target.value)}
                placeholder="community-seed-library"
                className="w-full px-3 py-2 text-sm font-mono bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="highlight-summary"
              className="block text-xs font-semibold text-[var(--text)]"
            >
              Summary / Deck <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="highlight-summary"
              rows={2}
              value={summary}
              onChange={(e) => handleFieldChange(setSummary, e.target.value)}
              placeholder="A brief 1-2 sentence overview shown on index cards and preview snippets..."
              className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="highlight-category"
                className="block text-xs font-semibold text-[var(--text)]"
              >
                Category
              </label>
              <input
                id="highlight-category"
                type="text"
                list="category-suggestions"
                value={category}
                onChange={(e) => handleFieldChange(setCategory, e.target.value)}
                placeholder="Category name"
                className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
              <datalist id="category-suggestions">
                {categories.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="highlight-date"
                className="block text-xs font-semibold text-[var(--text)]"
              >
                Date (YYYY or YYYY-MM)
              </label>
              <input
                id="highlight-date"
                type="text"
                value={date}
                onChange={(e) => handleFieldChange(setDate, e.target.value)}
                placeholder="2025-04"
                className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => handleFieldChange(setFeatured, e.target.checked)}
                  className="rounded text-[var(--accent)] focus:ring-[var(--accent)] w-4 h-4"
                />
                <span className="text-xs font-medium text-[var(--text)]">
                  Feature prominently on home
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Narrative & Context */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[var(--text)] border-b border-[var(--border)] pb-2">
            Narrative & Role
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="highlight-role"
                className="block text-xs font-semibold text-[var(--text)]"
              >
                Role or Contribution
              </label>
              <input
                id="highlight-role"
                type="text"
                value={roleOrContribution}
                onChange={(e) =>
                  handleFieldChange(setRoleOrContribution, e.target.value)
                }
                placeholder="e.g. Lead Coordinator & Facilitator"
                className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="highlight-context"
                className="block text-xs font-semibold text-[var(--text)]"
              >
                Context
              </label>
              <input
                id="highlight-context"
                type="text"
                value={context}
                onChange={(e) => handleFieldChange(setContext, e.target.value)}
                placeholder="e.g. Public Library Community Project"
                className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          </div>

          {/* Outcomes */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[var(--text)]">
              Key Outcomes & Metrics
            </label>
            <div className="space-y-2">
              {outcomes.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const next = [...outcomes];
                      next[idx] = e.target.value;
                      handleFieldChange(setOutcomes, next);
                    }}
                    placeholder={`Outcome ${idx + 1}...`}
                    className="flex-1 px-3 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = outcomes.filter((_, i) => i !== idx);
                      handleFieldChange(
                        setOutcomes,
                        next.length ? next : [""]
                      );
                    }}
                    className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  handleFieldChange(setOutcomes, [...outcomes, ""])
                }
                className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Outcome</span>
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label
              htmlFor="highlight-tags"
              className="block text-xs font-semibold text-[var(--text)]"
            >
              Tags (comma separated)
            </label>
            <input
              id="highlight-tags"
              type="text"
              value={tagsString}
              onChange={(e) => handleFieldChange(setTagsString, e.target.value)}
              placeholder="e.g. Community, Education, Workshop"
              className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
        </div>

        {/* Cover Image */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[var(--text)] border-b border-[var(--border)] pb-2">
            Cover Image
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={coverImage.src}
                  onChange={(e) =>
                    handleFieldChange(setCoverImage, {
                      ...coverImage,
                      src: e.target.value,
                    })
                  }
                  placeholder="/images/example.jpg or https://..."
                  className="flex-1 px-3 py-1.5 text-sm font-mono bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={() => setShowCoverPicker(true)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--muted)]/10 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Select Image</span>
                </button>
              </div>

              <input
                type="text"
                value={coverImage.alt}
                onChange={(e) =>
                  handleFieldChange(setCoverImage, {
                    ...coverImage,
                    alt: e.target.value,
                  })
                }
                placeholder="Alt text describing this image for accessibility"
                className="w-full px-3 py-1.5 text-xs bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            {coverImage.src && (
              <div className="w-24 h-24 rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--muted)]/10 shrink-0">
                <img
                  src={coverImage.src}
                  alt={coverImage.alt}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Structured Body Blocks */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[var(--text)] border-b border-[var(--border)] pb-2">
            Detailed Narrative Blocks
          </h2>
          <BlockEditor
            blocks={body}
            onChange={(newBlocks) => handleFieldChange(setBody, newBlocks)}
          />
        </div>
      </div>

      {showCoverPicker && (
        <MediaPicker
          isOpen={true}
          onClose={() => setShowCoverPicker(false)}
          onSelect={(media: SelectedMedia) => {
            handleFieldChange(setCoverImage, {
              src: media.src,
              alt: media.alt || title || "Highlight cover",
            });
          }}
          initialAlt={coverImage.alt || title}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Highlight"
        message={`Are you sure you want to delete "${title}"? It will be removed from your portfolio.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </FormLayout>
  );
}

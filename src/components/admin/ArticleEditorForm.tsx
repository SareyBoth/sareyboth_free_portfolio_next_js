"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FormLayout } from "@/components/admin/FormLayout";
import { BlockEditor } from "@/components/admin/BlockEditor";
import { MediaPicker, SelectedMedia } from "@/components/admin/MediaPicker";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Image as ImageIcon } from "lucide-react";
import type { ContentBlock } from "@/types/portfolio";

interface ArticleEditorFormProps {
  initialData?: any;
  isNew?: boolean;
}

export function ArticleEditorForm({
  initialData,
  isNew = false,
}: ArticleEditorFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [summary, setSummary] = useState(initialData?.summary || "");
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split("T")[0]
  );
  const [readingTime, setReadingTime] = useState(
    initialData?.readingTime || "3 min read"
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

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      date,
      readingTime: readingTime.trim() || undefined,
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
        ? "/api/admin/articles"
        : `/api/admin/articles/${initialData.id}`;
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
        throw new Error(errJson.error || "Failed to save article.");
      }

      const json = await res.json();
      const saved = json.article;

      setIsDirty(false);
      setVersion(saved.version);
      setSuccessMessage("Article draft saved successfully.");

      if (isNew) {
        router.replace(`/dashboard/articles/${saved.id}/edit`);
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
      let currentId = initialData?.id;
      if (isDirty || isNew) {
        const payload = getPayload();
        const url = isNew
          ? "/api/admin/articles"
          : `/api/admin/articles/${currentId}`;
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
        currentId = json.article.id;
        setVersion(json.article.version);
      }

      const pubRes = await fetch(`/api/admin/articles/${currentId}/publish`, {
        method: "POST",
      });

      if (!pubRes.ok) {
        const err = await pubRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to publish article.");
      }

      const pubJson = await pubRes.json();
      setIsPublished(true);
      setVersion(pubJson.article.version);
      setIsDirty(false);
      setSuccessMessage("Article published to journal!");

      if (isNew) {
        router.replace(`/dashboard/articles/${currentId}/edit`);
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
      const res = await fetch(`/api/admin/articles/${initialData.id}/publish`, {
        method: "DELETE",
      });
      if (res.ok) {
        const json = await res.json();
        setIsPublished(false);
        setVersion(json.article.version);
        setSuccessMessage("Article unpublished (now draft).");
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
      const res = await fetch(`/api/admin/articles/${initialData.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/dashboard/articles");
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
        { label: "Journal Articles", href: "/dashboard/articles" },
        { label: isNew ? "New Article" : title || "Edit Article" },
      ]}
      title={isNew ? "Write Article" : `Edit "${title}"`}
      subtitle="Publish reflections, methodologies, case notes, and thoughts to your journal."
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
      previewUrl={slug ? `/preview/articles/${slug}` : undefined}
      backHref="/dashboard/articles"
    >
      <div className="space-y-8 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 sm:p-8 shadow-xs">
        {/* Core Metadata */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[var(--text)] border-b border-[var(--border)] pb-2">
            Article Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="article-title"
                className="block text-xs font-semibold text-[var(--text)]"
              >
                Article Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="article-title"
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
                placeholder="e.g. How We Set Up a Neighborhood Seed Cabinet"
                className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="article-slug"
                className="block text-xs font-semibold text-[var(--text)]"
              >
                URL Slug <span className="text-rose-500">*</span>
              </label>
              <input
                id="article-slug"
                type="text"
                value={slug}
                onChange={(e) => handleFieldChange(setSlug, e.target.value)}
                placeholder="neighborhood-seed-cabinet"
                className="w-full px-3 py-2 text-sm font-mono bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="article-summary"
              className="block text-xs font-semibold text-[var(--text)]"
            >
              Summary / Deck <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="article-summary"
              rows={2}
              value={summary}
              onChange={(e) => handleFieldChange(setSummary, e.target.value)}
              placeholder="Short summary displayed on journal index and RSS feeds..."
              className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="article-date"
                className="block text-xs font-semibold text-[var(--text)]"
              >
                Publication Date (YYYY-MM-DD) <span className="text-rose-500">*</span>
              </label>
              <input
                id="article-date"
                type="text"
                value={date}
                onChange={(e) => handleFieldChange(setDate, e.target.value)}
                placeholder="2025-05-14"
                className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="article-reading-time"
                className="block text-xs font-semibold text-[var(--text)]"
              >
                Reading Time Estimate
              </label>
              <input
                id="article-reading-time"
                type="text"
                value={readingTime}
                onChange={(e) => handleFieldChange(setReadingTime, e.target.value)}
                placeholder="4 min read"
                className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="article-tags"
                className="block text-xs font-semibold text-[var(--text)]"
              >
                Tags (comma separated)
              </label>
              <input
                id="article-tags"
                type="text"
                value={tagsString}
                onChange={(e) => handleFieldChange(setTagsString, e.target.value)}
                placeholder="e.g. Guide, Community, Reflection"
                className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
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
                placeholder="Alt text describing image for accessibility"
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
            Article Narrative Blocks
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
              alt: media.alt || title || "Article cover",
            });
          }}
          initialAlt={coverImage.alt || title}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Article"
        message={`Are you sure you want to delete "${title}"? It will be removed from your journal.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </FormLayout>
  );
}

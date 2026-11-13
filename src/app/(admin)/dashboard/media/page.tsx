"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Search,
  Trash2,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface MediaAsset {
  id: string;
  url: string;
  filename: string;
  alt: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete modal
  const [deleteItem, setDeleteItem] = useState<MediaAsset | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadMedia();
  }, [search, typeFilter]);

  async function loadMedia() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const res = await fetch(`/api/admin/media?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setItems(json.items || []);
      }
    } catch (err) {
      console.error("Failed to load media:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File exceeds maximum allowed size of 10MB.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("alt", file.name.replace(/\.[^/.]+$/, ""));

    try {
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Upload failed.");
      }

      const uploaded = await res.json();
      setItems((prev) => [uploaded, ...prev]);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/media/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== deleteItem.id));
        setDeleteItem(null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  }

  function copyUrl(asset: MediaAsset) {
    navigator.clipboard.writeText(asset.url);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            Media Library
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Upload, inspect, and manage images and downloadable PDF assets.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 transition-opacity shadow-xs shrink-0"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span>{uploading ? "Uploading..." : "Upload File"}</span>
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,application/pdf"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
        }}
        className="hidden"
      />

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
        }}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] rounded-xl p-8 text-center transition-colors flex flex-col items-center justify-center cursor-pointer bg-[var(--muted)]/5"
      >
        <div className="p-3 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] mb-2">
          <Upload className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-[var(--text)]">
          Drag & drop images or files here, or click to browse
        </p>
        <p className="text-xs text-[var(--muted)] mt-1">
          Supports JPEG, PNG, WebP, GIF, SVG, and PDF documents (Max 10MB)
        </p>
        {uploadError && (
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 font-medium">
            {uploadError}
          </p>
        )}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename or description..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted)] font-medium">Filter:</span>
          {["all", "image", "document"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                typeFilter === t
                  ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs"
                  : "border border-[var(--border)] text-[var(--text)] hover:bg-[var(--muted)]/10"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="py-16 text-center text-[var(--muted)] flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
          <span className="text-sm">Loading media assets...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center border border-[var(--border)] rounded-xl bg-[var(--surface)] p-8">
          <ImageIcon className="w-10 h-10 mx-auto text-[var(--muted)] opacity-30 mb-2" />
          <p className="text-sm font-semibold text-[var(--text)]">
            No media assets found
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">
            Upload images or documents to populate your media library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((asset) => {
            const isImage = asset.mimeType.startsWith("image/");
            return (
              <div
                key={asset.id}
                className="group border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)] flex flex-col justify-between shadow-xs hover:border-[var(--muted)] transition-all"
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-[var(--muted)]/10 relative flex items-center justify-center overflow-hidden">
                  {isImage ? (
                    <img
                      src={asset.url}
                      alt={asset.alt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  ) : (
                    <FileText className="w-10 h-10 text-[var(--muted)]" />
                  )}

                  {/* Hover action overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    <button
                      type="button"
                      onClick={() => copyUrl(asset)}
                      title="Copy URL"
                      className="p-2 rounded-full bg-white/90 text-stone-900 hover:bg-white shadow-xs"
                    >
                      {copiedId === asset.id ? (
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open full size"
                      className="p-2 rounded-full bg-white/90 text-stone-900 hover:bg-white shadow-xs"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setDeleteItem(asset)}
                      title="Delete asset"
                      className="p-2 rounded-full bg-white/90 text-rose-600 hover:bg-white shadow-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="p-3 text-xs space-y-0.5">
                  <p className="font-medium text-[var(--text)] truncate" title={asset.filename}>
                    {asset.filename}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                    <span>{Math.round(asset.sizeBytes / 1024)} KB</span>
                    <span className="uppercase font-mono">
                      {asset.mimeType.split("/")[1]}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteItem !== null}
        title="Delete Media Asset"
        message={`Are you sure you want to delete "${deleteItem?.filename}"? This cannot be undone and will break any references in highlights or articles.`}
        confirmLabel="Delete Asset"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  );
}

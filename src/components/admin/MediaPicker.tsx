"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  X,
  Upload,
  Search,
  Check,
  FileText,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";

export interface SelectedMedia {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

interface MediaAssetItem {
  id: string;
  url: string;
  alt: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
}

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: SelectedMedia) => void;
  allowedTypes?: "image" | "document" | "all";
  initialAlt?: string;
}

export function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  allowedTypes = "image",
  initialAlt = "",
}: MediaPickerProps) {
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [assets, setAssets] = useState<MediaAssetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<MediaAssetItem | null>(null);
  const [altText, setAltText] = useState(initialAlt);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadAssets();
      setAltText(initialAlt);
      setSelectedAsset(null);
      setError(null);
      setUploadError(null);
    }
  }, [isOpen, initialAlt]);

  async function loadAssets() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/media");
      if (!res.ok) {
        throw new Error(`Failed to load media: ${res.statusText}`);
      }
      const data = await res.json();
      setAssets(data.items || data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch media assets.");
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
    formData.append("alt", altText || file.name.replace(/\.[^/.]+$/, ""));

    try {
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to upload file.");
      }

      const uploaded = await res.json();
      // Add to assets and select
      setAssets((prev) => [uploaded, ...prev]);
      setSelectedAsset(uploaded);
      setAltText(uploaded.alt || "");
      setTab("library");
    } catch (err: any) {
      setUploadError(err.message || "Error uploading file.");
    } finally {
      setUploading(false);
    }
  }

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.filename.toLowerCase().includes(search.toLowerCase()) ||
      asset.alt.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (allowedTypes === "image") {
      return asset.mimeType.startsWith("image/");
    }
    if (allowedTypes === "document") {
      return !asset.mimeType.startsWith("image/");
    }
    return true;
  });

  function handleConfirm() {
    if (!selectedAsset) return;
    onSelect({
      src: selectedAsset.url,
      alt: altText.trim() || selectedAsset.alt || "Uploaded media",
      width: selectedAsset.width || undefined,
      height: selectedAsset.height || undefined,
    });
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-picker-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-3xl bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-4">
            <h2 id="media-picker-title" className="text-lg font-semibold text-[var(--text)]">
              Media Picker
            </h2>
            <div className="flex bg-[var(--muted)]/10 p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setTab("library")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  tab === "library"
                    ? "bg-[var(--surface)] text-[var(--text)] shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                Media Library
              </button>
              <button
                type="button"
                onClick={() => setTab("upload")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  tab === "upload"
                    ? "bg-[var(--surface)] text-[var(--text)] shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                Upload File
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[var(--muted)] hover:text-[var(--text)] p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === "library" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by filename or alt text..."
                    className="w-full pl-9 pr-3 py-1.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 text-xs rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="py-16 text-center text-[var(--muted)] flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
                  <span>Loading library...</span>
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="py-16 text-center text-[var(--muted)]">
                  <ImageIcon className="w-10 h-10 mx-auto opacity-30 mb-2" />
                  <p className="text-sm font-medium">No media found</p>
                  <p className="text-xs mt-1">Upload an image or clear your search filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredAssets.map((asset) => {
                    const isSelected = selectedAsset?.id === asset.id;
                    const isImage = asset.mimeType.startsWith("image/");
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => {
                          setSelectedAsset(asset);
                          setAltText(asset.alt || "");
                        }}
                        className={`group relative text-left border rounded-lg overflow-hidden flex flex-col transition-all focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)] ${
                          isSelected
                            ? "border-[var(--accent)] ring-2 ring-[var(--accent)]"
                            : "border-[var(--border)] hover:border-[var(--muted)]"
                        }`}
                      >
                        <div className="aspect-square bg-[var(--muted)]/10 relative flex items-center justify-center overflow-hidden">
                          {isImage ? (
                            <img
                              src={asset.url}
                              alt={asset.alt}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <FileText className="w-8 h-8 text-[var(--muted)]" />
                          )}
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] flex items-center justify-center shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <div className="p-2 text-xs truncate">
                          <p className="font-medium text-[var(--text)] truncate">
                            {asset.filename}
                          </p>
                          <p className="text-[var(--muted)] text-[11px] truncate">
                            {Math.round(asset.sizeBytes / 1024)} KB
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Alt Text input for selected asset */}
              {selectedAsset && (
                <div className="pt-4 border-t border-[var(--border)] space-y-2">
                  <label
                    htmlFor="media-alt-input"
                    className="block text-xs font-semibold text-[var(--text)]"
                  >
                    Alt Text (Accessibility) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="media-alt-input"
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Describe this image for screen readers..."
                    className="w-full px-3 py-1.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)]"
                  />
                  <p className="text-[11px] text-[var(--muted)]">
                    Selected URL: <code className="font-mono text-[var(--text)]">{selectedAsset.url}</code>
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Upload Tab */
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] rounded-xl p-10 text-center transition-colors flex flex-col items-center justify-center cursor-pointer bg-[var(--muted)]/5"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,application/pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div className="p-3 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-[var(--text)]">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Supported formats: JPEG, PNG, WebP, GIF, SVG, PDF (Max 10MB)
                </p>
                {uploading && (
                  <div className="mt-4 inline-flex items-center gap-2 text-xs text-[var(--accent)]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading and generating metadata...</span>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="p-3 text-xs rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--text)] hover:bg-[var(--muted)]/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedAsset || (tab === "upload" && uploading)}
            className="px-4 py-2 text-xs font-medium rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 transition-opacity disabled:opacity-40 shadow-xs"
          >
            Insert Selected Media
          </button>
        </div>
      </div>
    </div>
  );
}

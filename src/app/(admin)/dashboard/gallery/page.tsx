"use client";

import React, { useState, useEffect } from "react";
import { DataTable, ColumnDef, RowAction } from "@/components/admin/DataTable";
import { MediaPicker, SelectedMedia } from "@/components/admin/MediaPicker";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Plus, Edit2, Trash2, X, Image as ImageIcon } from "lucide-react";

interface GalleryRow {
  id: string;
  title: string;
  caption: string;
  date?: string | null;
  image: { src: string; alt: string; caption?: string };
  displayOrder: number;
}

export default function GalleryManagerPage() {
  const [items, setItems] = useState<GalleryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Partial<GalleryRow> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [deleteItem, setDeleteItem] = useState<GalleryRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadGallery();
  }, []);

  async function loadGallery() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gallery");
      if (res.ok) {
        const json = await res.json();
        setItems(json.items || []);
      }
    } catch (err) {
      console.error("Failed to load gallery items:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem?.title || !editingItem?.image?.src) return;
    setSaving(true);

    try {
      const url = isNew ? "/api/admin/gallery" : `/api/admin/gallery/${editingItem.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem),
      });
      if (res.ok) {
        setEditingItem(null);
        await loadGallery();
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/gallery/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteItem(null);
        await loadGallery();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  }

  const columns: ColumnDef<GalleryRow>[] = [
    {
      key: "image",
      header: "Photo",
      className: "w-20",
      render: (item) => (
        <div className="w-14 h-14 rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--muted)]/10 shrink-0">
          <img
            src={item.image.src}
            alt={item.image.alt}
            className="w-full h-full object-cover"
          />
        </div>
      ),
    },
    {
      key: "title",
      header: "Title & Caption",
      render: (item) => (
        <div>
          <span className="font-semibold text-sm text-[var(--text)]">
            {item.title}
          </span>
          <p className="text-xs text-[var(--muted)] line-clamp-1">
            {item.caption}
          </p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (item) => (
        <span className="text-xs text-[var(--muted)]">{item.date || "—"}</span>
      ),
    },
  ];

  const actions: RowAction<GalleryRow>[] = [
    {
      label: "Edit",
      icon: Edit2,
      onClick: (item) => {
        setIsNew(false);
        setEditingItem(item);
      },
    },
    {
      label: "Delete",
      icon: Trash2,
      variant: "danger",
      onClick: (item) => setDeleteItem(item),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            Portfolio Gallery
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Visual field notes, project snapshots, and workshop photography.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsNew(true);
            setEditingItem({
              title: "",
              caption: "",
              date: "2025-05",
              image: { src: "", alt: "" },
            });
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Photo</span>
        </button>
      </div>

      <DataTable
        data={items}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        actions={actions}
        emptyMessage="No gallery photos added yet."
      />

      {editingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <form
            onSubmit={handleSaveItem}
            className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-bold text-[var(--text)]">
                {isNew ? "Add Photo to Gallery" : "Edit Photo"}
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-[var(--muted)] hover:text-[var(--text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text)]">
                Photo Title *
              </label>
              <input
                type="text"
                required
                value={editingItem.title || ""}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, title: e.target.value })
                }
                placeholder="e.g. Spring Seed Packing Session"
                className="w-full px-3 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text)]">
                Date (YYYY-MM or YYYY)
              </label>
              <input
                type="text"
                value={editingItem.date || ""}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, date: e.target.value })
                }
                placeholder="2025-05"
                className="w-full px-3 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
              />
            </div>

            {/* Photo Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text)]">
                Image Source & Alt Text *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={editingItem.image?.src || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      image: {
                        src: e.target.value,
                        alt: editingItem.image?.alt || "",
                      },
                    })
                  }
                  placeholder="/images/example.jpg or https://..."
                  className="flex-1 px-3 py-1.5 text-sm font-mono bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
                />
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--text)] hover:bg-[var(--muted)]/10 shrink-0"
                >
                  Choose Media
                </button>
              </div>

              <input
                type="text"
                required
                value={editingItem.image?.alt || ""}
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    image: {
                      src: editingItem.image?.src || "",
                      alt: e.target.value,
                    },
                  })
                }
                placeholder="Alt description for screen readers *"
                className="w-full px-3 py-1.5 text-xs bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text)]">
                Caption
              </label>
              <textarea
                rows={2}
                value={editingItem.caption || ""}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, caption: e.target.value })
                }
                placeholder="Descriptive caption describing context..."
                className="w-full px-3 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 text-xs font-semibold rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 disabled:opacity-40"
              >
                {saving ? "Saving..." : "Save Photo"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showMediaPicker && (
        <MediaPicker
          isOpen={true}
          onClose={() => setShowMediaPicker(false)}
          onSelect={(media: SelectedMedia) => {
            if (editingItem) {
              setEditingItem({
                ...editingItem,
                image: {
                  src: media.src,
                  alt: media.alt || editingItem.title || "Gallery image",
                },
              });
            }
          }}
          initialAlt={editingItem?.image?.alt || editingItem?.title || ""}
        />
      )}

      <ConfirmDialog
        isOpen={deleteItem !== null}
        title="Delete Photo"
        message={`Are you sure you want to delete "${deleteItem?.title}" from the gallery?`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  );
}

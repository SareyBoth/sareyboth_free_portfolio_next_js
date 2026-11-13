"use client";

import React, { useState, useEffect } from "react";
import { DataTable, ColumnDef, RowAction } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Plus, Edit2, Trash2, X, Tag } from "lucide-react";

interface TagRow {
  id: string;
  name: string;
  slug: string;
  _count?: { highlightTags: number; articleTags: number };
}

export default function TagsManagerPage() {
  const [items, setItems] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState("");
  const [editingItem, setEditingItem] = useState<Partial<TagRow> | null>(null);
  const [deleteItem, setDeleteItem] = useState<TagRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tags");
      if (res.ok) {
        const json = await res.json();
        setItems(json.tags || []);
      }
    } catch (err) {
      console.error("Failed to load tags:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim() }),
      });
      if (res.ok) {
        setNewTagName("");
        await loadTags();
      }
    } catch (err) {
      console.error("Add tag error:", err);
    }
  }

  async function handleUpdateTag(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem?.id || !editingItem?.name) return;

    try {
      const res = await fetch(`/api/admin/tags/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingItem.name }),
      });
      if (res.ok) {
        setEditingItem(null);
        await loadTags();
      }
    } catch (err) {
      console.error("Update tag error:", err);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/tags/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteItem(null);
        await loadTags();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  }

  const columns: ColumnDef<TagRow>[] = [
    {
      key: "name",
      header: "Tag Name",
      render: (item) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--muted)]/10 text-[var(--text)]">
          <Tag className="w-3 h-3 text-[var(--accent)]" />
          <span>{item.name}</span>
        </span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      render: (item) => (
        <span className="text-xs font-mono text-[var(--muted)]">{item.slug}</span>
      ),
    },
    {
      key: "usage",
      header: "Usage Count",
      render: (item) => {
        const count =
          (item._count?.highlightTags || 0) + (item._count?.articleTags || 0);
        return (
          <span className="text-xs text-[var(--muted)]">
            {count} reference{count !== 1 ? "s" : ""}
          </span>
        );
      },
    },
  ];

  const actions: RowAction<TagRow>[] = [
    {
      label: "Edit",
      icon: Edit2,
      onClick: (item) => setEditingItem(item),
    },
    {
      label: "Delete",
      icon: Trash2,
      variant: "danger",
      onClick: (item) => setDeleteItem(item),
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            Content Tags
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Taxonomy tags shared across portfolio highlights and journal reflections.
          </p>
        </div>
      </div>

      {/* Add Tag Form */}
      <form
        onSubmit={handleAddTag}
        className="flex items-center gap-2 max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 shadow-xs"
      >
        <Tag className="w-4 h-4 text-[var(--accent)] ml-1 shrink-0" />
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="New tag name (e.g. Workshop)..."
          className="flex-1 px-2 py-1 text-sm bg-transparent border-none text-[var(--text)] focus:outline-hidden"
        />
        <button
          type="submit"
          disabled={!newTagName.trim()}
          className="px-3 py-1 text-xs font-semibold rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 disabled:opacity-40 shrink-0"
        >
          Add Tag
        </button>
      </form>

      <DataTable
        data={items}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        actions={actions}
        emptyMessage="No tags created yet."
      />

      {/* Edit Tag Modal */}
      {editingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <form
            onSubmit={handleUpdateTag}
            className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-bold text-[var(--text)]">
                Edit Tag
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
                Tag Name *
              </label>
              <input
                type="text"
                required
                value={editingItem.name || ""}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, name: e.target.value })
                }
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
                className="px-4 py-1.5 text-xs font-semibold rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteItem !== null}
        title="Delete Tag"
        message={`Are you sure you want to delete tag "${deleteItem?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { DataTable, ColumnDef, RowAction } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Plus, Edit2, Trash2, X, FolderTree } from "lucide-react";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count?: { highlights: number };
}

export default function HighlightCategoriesPage() {
  const [items, setItems] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Partial<CategoryRow> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteItem, setDeleteItem] = useState<CategoryRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/highlight-categories");
      if (res.ok) {
        const json = await res.json();
        setItems(json.categories || []);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem?.name) return;
    setSaving(true);
    try {
      const url = isNew
        ? "/api/admin/highlight-categories"
        : `/api/admin/highlight-categories/${editingItem.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem),
      });

      if (res.ok) {
        setEditingItem(null);
        await loadCategories();
      }
    } catch (err) {
      console.error("Failed to save category:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/highlight-categories/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteItem(null);
        await loadCategories();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  }

  const columns: ColumnDef<CategoryRow>[] = [
    {
      key: "name",
      header: "Category Name & Slug",
      render: (item) => (
        <div>
          <span className="font-semibold text-sm text-[var(--text)]">
            {item.name}
          </span>
          <p className="text-xs font-mono text-[var(--muted)]">{item.slug}</p>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (item) => (
        <span className="text-xs text-[var(--muted)]">
          {item.description || "—"}
        </span>
      ),
    },
    {
      key: "highlights",
      header: "Associated Projects",
      render: (item) => (
        <span className="text-xs text-[var(--muted)]">
          {item._count?.highlights || 0} project{item._count?.highlights !== 1 ? "s" : ""}
        </span>
      ),
    },
  ];

  const actions: RowAction<CategoryRow>[] = [
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
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            Highlight Categories
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Taxonomy terms used for filtering and organizing highlight portfolio cards.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsNew(true);
            setEditingItem({ name: "", slug: "", description: "" });
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      <DataTable
        data={items}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        actions={actions}
        emptyMessage="No highlight categories created yet."
      />

      {editingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <form
            onSubmit={handleSave}
            className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-bold text-[var(--text)]">
                {isNew ? "Create Category" : "Edit Category"}
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
                Category Name *
              </label>
              <input
                type="text"
                required
                value={editingItem.name || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditingItem({
                    ...editingItem,
                    name: val,
                    slug: isNew && !editingItem.slug ? val.toLowerCase().replace(/[^a-z0-9]+/g, "-") : editingItem.slug,
                  });
                }}
                placeholder="e.g. Community Projects"
                className="w-full px-3 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text)]">
                Slug
              </label>
              <input
                type="text"
                value={editingItem.slug || ""}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, slug: e.target.value })
                }
                placeholder="community-projects"
                className="w-full px-3 py-1.5 text-sm font-mono bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text)]">
                Description
              </label>
              <textarea
                rows={2}
                value={editingItem.description || ""}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, description: e.target.value })
                }
                placeholder="Short explanation of this taxonomy..."
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
                {saving ? "Saving..." : "Save Category"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteItem !== null}
        title="Delete Category"
        message={`Are you sure you want to delete category "${deleteItem?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  );
}

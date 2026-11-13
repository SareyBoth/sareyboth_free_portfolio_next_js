"use client";

import React, { useState, useEffect } from "react";
import { DataTable, ColumnDef, RowAction } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Plus, Edit2, Trash2, X, MessageSquareQuote } from "lucide-react";

interface TestimonialRow {
  id: string;
  quote: string;
  name: string;
  relationship: string;
  isSample: boolean;
  displayOrder: number;
}

export default function TestimonialsManagerPage() {
  const [items, setItems] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Partial<TestimonialRow> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteItem, setDeleteItem] = useState<TestimonialRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTestimonials();
  }, []);

  async function loadTestimonials() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/testimonials");
      if (res.ok) {
        const json = await res.json();
        setItems(json.items || []);
      }
    } catch (err) {
      console.error("Failed to load testimonials:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem?.quote || !editingItem?.name) return;
    setSaving(true);
    try {
      const url = isNew ? "/api/admin/testimonials" : `/api/admin/testimonials/${editingItem.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem),
      });
      if (res.ok) {
        setEditingItem(null);
        await loadTestimonials();
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
      const res = await fetch(`/api/admin/testimonials/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteItem(null);
        await loadTestimonials();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  }

  const columns: ColumnDef<TestimonialRow>[] = [
    {
      key: "name",
      header: "Person & Relationship",
      render: (item) => (
        <div>
          <span className="font-semibold text-sm text-[var(--text)]">
            {item.name}
          </span>
          <p className="text-xs text-[var(--muted)]">{item.relationship}</p>
        </div>
      ),
    },
    {
      key: "quote",
      header: "Reflection Quote",
      render: (item) => (
        <p className="text-xs text-[var(--muted)] line-clamp-2 italic max-w-md">
          &ldquo;{item.quote}&rdquo;
        </p>
      ),
    },
    {
      key: "isSample",
      header: "Demonstration Sample",
      render: (item) => (
        <span className="text-xs text-[var(--muted)]">
          {item.isSample ? "Yes (Template Sample)" : "No (Real Testimonial)"}
        </span>
      ),
    },
  ];

  const actions: RowAction<TestimonialRow>[] = [
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
            Testimonials & Reflections
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Display peer endorsements, supervisor reflections, and collaborative quotes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsNew(true);
            setEditingItem({
              name: "",
              relationship: "Colleague",
              quote: "",
              isSample: false,
            });
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Testimonial</span>
        </button>
      </div>

      <DataTable
        data={items}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        actions={actions}
        emptyMessage="No testimonials added yet."
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
                {isNew ? "Add Testimonial" : "Edit Testimonial"}
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-[var(--muted)] hover:text-[var(--text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text)]">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.name || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, name: e.target.value })
                  }
                  placeholder="e.g. Maria Gonzalez"
                  className="w-full px-3 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text)]">
                  Relationship / Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.relationship || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, relationship: e.target.value })
                  }
                  placeholder="e.g. Director, Library System"
                  className="w-full px-3 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text)]">
                Quote Text *
              </label>
              <textarea
                rows={4}
                required
                value={editingItem.quote || ""}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, quote: e.target.value })
                }
                placeholder="The endorsement or reflection quote..."
                className="w-full px-3 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
              />
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={editingItem.isSample ?? false}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, isSample: e.target.checked })
                }
                className="rounded text-[var(--accent)]"
              />
              <span className="text-xs text-[var(--muted)]">
                Mark as template demonstration sample (notices shown on public card)
              </span>
            </label>

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
                {saving ? "Saving..." : "Save Testimonial"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteItem !== null}
        title="Delete Testimonial"
        message={`Are you sure you want to delete the testimonial from "${deleteItem?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  );
}

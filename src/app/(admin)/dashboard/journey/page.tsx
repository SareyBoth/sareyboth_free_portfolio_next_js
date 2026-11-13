"use client";

import React, { useState, useEffect } from "react";
import { DataTable, ColumnDef, RowAction } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Plus, Edit2, Trash2, X, Milestone } from "lucide-react";
import { JOURNEY_TYPES } from "@/lib/content/schema";

interface JourneyItemRow {
  id: string;
  type: string;
  title: string;
  organization?: string | null;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  description: string;
  displayOrder: number;
}

export default function JourneyManagerPage() {
  const [items, setItems] = useState<JourneyItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Add Modal state
  const [editingItem, setEditingItem] = useState<Partial<JourneyItemRow> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteItem, setDeleteItem] = useState<JourneyItemRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadJourney();
  }, []);

  async function loadJourney() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/journey");
      if (res.ok) {
        const json = await res.json();
        setItems(json.items || []);
      }
    } catch (err) {
      console.error("Failed to load journey entries:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem?.title || !editingItem?.startDate) return;

    setSaving(true);
    try {
      const url = isNew ? "/api/admin/journey" : `/api/admin/journey/${editingItem.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem),
      });

      if (res.ok) {
        setEditingItem(null);
        await loadJourney();
      }
    } catch (err) {
      console.error("Save journey error:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/journey/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteItem(null);
        await loadJourney();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  }

  const columns: ColumnDef<JourneyItemRow>[] = [
    {
      key: "title",
      header: "Title & Org",
      render: (item) => (
        <div>
          <span className="font-semibold text-sm text-[var(--text)]">
            {item.title}
          </span>
          <p className="text-xs text-[var(--muted)]">
            {item.organization || "—"} {item.location ? `• ${item.location}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (item) => (
        <span className="text-xs px-2 py-0.5 rounded-full capitalize bg-[var(--muted)]/10 text-[var(--text)]">
          {item.type}
        </span>
      ),
    },
    {
      key: "dates",
      header: "Period",
      render: (item) => (
        <span className="text-xs text-[var(--muted)]">
          {item.startDate} — {item.endDate || "Present"}
        </span>
      ),
    },
  ];

  const actions: RowAction<JourneyItemRow>[] = [
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
            Journey & Experience
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Employment, education, volunteering, courses, and milestones timeline.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsNew(true);
            setEditingItem({
              type: "employment",
              title: "",
              organization: "",
              location: "",
              startDate: "2024",
              endDate: "",
              description: "",
            });
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Journey Entry</span>
        </button>
      </div>

      <DataTable
        data={items}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        actions={actions}
        emptyMessage="No journey milestones recorded yet."
      />

      {/* Edit / New Modal */}
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
                {isNew ? "Add Journey Entry" : "Edit Journey Entry"}
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
                  Role / Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.title || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, title: e.target.value })
                  }
                  placeholder="e.g. Program Coordinator"
                  className="w-full px-3 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text)]">
                  Type
                </label>
                <select
                  value={editingItem.type || "employment"}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, type: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
                >
                  {JOURNEY_TYPES.map((t) => (
                    <option key={t} value={t} className="capitalize">
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text)]">
                  Organization
                </label>
                <input
                  type="text"
                  value={editingItem.organization || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, organization: e.target.value })
                  }
                  placeholder="e.g. Neighborhood Guild"
                  className="w-full px-3 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text)]">
                  Location
                </label>
                <input
                  type="text"
                  value={editingItem.location || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, location: e.target.value })
                  }
                  placeholder="e.g. Portland, OR"
                  className="w-full px-3 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text)]">
                  Start Date (YYYY or YYYY-MM) *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.startDate || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, startDate: e.target.value })
                  }
                  placeholder="2024-01"
                  className="w-full px-3 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text)]">
                  End Date (Leave blank for Present)
                </label>
                <input
                  type="text"
                  value={editingItem.endDate || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, endDate: e.target.value })
                  }
                  placeholder="Present or 2025-05"
                  className="w-full px-3 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text)]">
                Description
              </label>
              <textarea
                rows={3}
                value={editingItem.description || ""}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, description: e.target.value })
                }
                placeholder="Key accomplishments and scope of responsibility..."
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
                {saving ? "Saving..." : "Save Entry"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteItem !== null}
        title="Delete Journey Entry"
        message={`Are you sure you want to delete "${deleteItem?.title}"?`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  );
}

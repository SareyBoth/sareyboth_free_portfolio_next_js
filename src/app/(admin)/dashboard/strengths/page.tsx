"use client";

import React, { useState, useEffect } from "react";
import { FormLayout } from "@/components/admin/FormLayout";
import { Plus, Trash2, Zap, Edit2, Check, X } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface StrengthGroupItem {
  id: string;
  category: string;
  description?: string | null;
  items: { id: string; name: string; displayOrder: number }[];
}

export default function StrengthsManagerPage() {
  const [groups, setGroups] = useState<StrengthGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingGroup, setAddingGroup] = useState(false);
  const [newItemNames, setNewItemNames] = useState<Record<string, string>>({});

  const [deleteGroup, setDeleteGroup] = useState<StrengthGroupItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/strength-groups");
      if (res.ok) {
        const json = await res.json();
        setGroups(json.groups || []);
      }
    } catch (err) {
      console.error("Failed to load strength groups:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setAddingGroup(true);
    try {
      const res = await fetch("/api/admin/strength-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCategoryName.trim() }),
      });
      if (res.ok) {
        setNewCategoryName("");
        await loadGroups();
      }
    } catch (err) {
      console.error("Failed to add group:", err);
    } finally {
      setAddingGroup(false);
    }
  }

  async function handleAddItem(groupId: string) {
    const itemName = (newItemNames[groupId] || "").trim();
    if (!itemName) return;
    try {
      const res = await fetch("/api/admin/strengths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, name: itemName }),
      });
      if (res.ok) {
        setNewItemNames((prev) => ({ ...prev, [groupId]: "" }));
        await loadGroups();
      }
    } catch (err) {
      console.error("Failed to add item:", err);
    }
  }

  async function handleDeleteItem(itemId: string) {
    try {
      const res = await fetch(`/api/admin/strengths/${itemId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadGroups();
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  }

  async function handleConfirmDeleteGroup() {
    if (!deleteGroup) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/strength-groups/${deleteGroup.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteGroup(null);
        await loadGroups();
      }
    } catch (err) {
      console.error("Failed to delete group:", err);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            Strengths & Core Skills
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Group your proficiencies, methods, and specialized capabilities into categories.
          </p>
        </div>
      </div>

      {/* Add New Group Form */}
      <form
        onSubmit={handleAddGroup}
        className="flex items-center gap-2 max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 shadow-xs"
      >
        <Zap className="w-4 h-4 text-[var(--accent)] ml-1 shrink-0" />
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="New Skill Group (e.g. Program Design)..."
          className="flex-1 px-2 py-1 text-sm bg-transparent border-none text-[var(--text)] focus:outline-hidden"
        />
        <button
          type="submit"
          disabled={addingGroup || !newCategoryName.trim()}
          className="px-3 py-1 text-xs font-semibold rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 disabled:opacity-40 shrink-0"
        >
          {addingGroup ? "Adding..." : "Add Group"}
        </button>
      </form>

      {/* Groups Listing */}
      {loading ? (
        <div className="py-16 text-center text-sm text-[var(--muted)]">
          Loading strength groups...
        </div>
      ) : groups.length === 0 ? (
        <div className="p-8 text-center border border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm text-[var(--muted)]">
          No strength groups defined yet. Add your first skill category above.
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-xs space-y-4"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <h3 className="text-base font-semibold text-[var(--text)]">
                    {group.category}
                  </h3>
                  {group.description && (
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {group.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setDeleteGroup(group)}
                  className="p-1 text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Items Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {group.items.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-[var(--border)] bg-[var(--muted)]/5 text-[var(--text)]"
                  >
                    <span>{item.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-[var(--muted)] hover:text-rose-600 transition-colors"
                      title="Remove skill"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {/* Inline Add Item Input */}
                <div className="inline-flex items-center gap-1.5 border border-dashed border-[var(--border)] rounded-full px-2 py-0.5">
                  <input
                    type="text"
                    value={newItemNames[group.id] || ""}
                    onChange={(e) =>
                      setNewItemNames({ ...newItemNames, [group.id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddItem(group.id);
                      }
                    }}
                    placeholder="+ Add skill..."
                    className="text-xs bg-transparent border-none text-[var(--text)] focus:outline-hidden w-28"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItem(group.id)}
                    className="text-xs text-[var(--accent)] font-semibold hover:underline"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteGroup !== null}
        title="Delete Strength Group"
        message={`Are you sure you want to delete "${deleteGroup?.category}" and all skills inside it?`}
        confirmLabel="Delete Group"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDeleteGroup}
        onCancel={() => setDeleteGroup(null)}
      />
    </div>
  );
}

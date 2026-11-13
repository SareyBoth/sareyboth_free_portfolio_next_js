"use client";

import React, { useState, useEffect } from "react";
import { DataTable, ColumnDef, RowAction } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Plus, Trash2, UserPlus, Shield, X, UserCog, Ban, CheckCircle } from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  banReason?: string | null;
  createdAt: string;
}

export default function UsersManagerPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("EDITOR");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit / Role modal
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editRole, setEditRole] = useState("EDITOR");
  const [updating, setUpdating] = useState(false);

  // Delete modal
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const json = await res.json();
        setUsers(json.users || []);
      } else {
        const err = await res.json().catch(() => ({}));
        setActionError(err.error || "Failed to load users. Ensure you have OWNER permissions.");
      }
    } catch (err) {
      console.error("Failed to load staff users:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create user.");
      }

      setShowCreateModal(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("EDITOR");
      await loadUsers();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create staff account.");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setUpdating(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editRole }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update user role.");
      }

      setEditingUser(null);
      await loadUsers();
    } catch (err: any) {
      setActionError(err.message || "Failed to update role.");
    } finally {
      setUpdating(false);
    }
  }

  async function toggleBan(user: UserRow) {
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banned: !user.banned,
          banReason: !user.banned ? "Deactivated by owner" : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to toggle status.");
      }

      await loadUsers();
    } catch (err: any) {
      setActionError(err.message || "Failed to toggle user status.");
    }
  }

  async function handleConfirmDelete() {
    if (!deleteUser) return;
    setDeleting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/users/${deleteUser.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete user.");
      }

      setDeleteUser(null);
      await loadUsers();
    } catch (err: any) {
      setActionError(err.message || "Failed to delete user.");
      setDeleteUser(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns: ColumnDef<UserRow>[] = [
    {
      key: "name",
      header: "Staff Member",
      render: (item) => (
        <div>
          <span className="font-semibold text-sm text-[var(--text)]">
            {item.name}
          </span>
          <p className="text-xs text-[var(--muted)]">{item.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (item) => (
        <StatusBadge
          status={item.role}
          variant={item.role === "OWNER" ? "owner" : "editor"}
        />
      ),
    },
    {
      key: "status",
      header: "Access Status",
      render: (item) => (
        <span className="text-xs">
          {item.banned ? (
            <span className="text-rose-600 dark:text-rose-400 font-semibold inline-flex items-center gap-1">
              <Ban className="w-3.5 h-3.5" /> Deactivated
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Active
            </span>
          )}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Member Since",
      render: (item) => (
        <span className="text-xs text-[var(--muted)]">
          {new Date(item.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
  ];

  const actions: RowAction<UserRow>[] = [
    {
      label: "Role",
      icon: UserCog,
      onClick: (item) => {
        setEditingUser(item);
        setEditRole(item.role);
      },
    },
    {
      label: "Toggle Access",
      icon: Ban,
      onClick: (item) => toggleBan(item),
    },
    {
      label: "Delete",
      icon: Trash2,
      variant: "danger",
      onClick: (item) => setDeleteUser(item),
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            Staff Accounts & Roles
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Manage owner and editor permissions for collaborating on portfolio content.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 shadow-xs shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Account</span>
        </button>
      </div>

      {actionError && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-sm">
          {actionError}
        </div>
      )}

      <DataTable
        data={users}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        actions={actions}
        emptyMessage="No staff accounts found."
      />

      {/* Add User Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <form
            onSubmit={handleCreateUser}
            className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[var(--accent)]" />
                <span>Create Staff Account</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[var(--muted)] hover:text-[var(--text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 text-xs rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                {createError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text)]">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Robin Chen"
                className="w-full px-3 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text)]">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="robin.chen@example.com"
                className="w-full px-3 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text)]">
                Initial Password * (minimum 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text)]">
                Role Permission
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
              >
                <option value="EDITOR">EDITOR — Edit drafts, manage messages</option>
                <option value="OWNER">OWNER — Full access, publish content, manage staff & settings</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-1.5 text-xs font-semibold rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 disabled:opacity-40"
              >
                {creating ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <form
            onSubmit={handleUpdateRole}
            className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-bold text-[var(--text)]">
                Change Role for {editingUser.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-[var(--muted)] hover:text-[var(--text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text)]">
                Select Account Role:
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
              >
                <option value="EDITOR">EDITOR</option>
                <option value="OWNER">OWNER</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-1.5 text-xs font-semibold rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 disabled:opacity-40"
              >
                {updating ? "Saving..." : "Update Role"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteUser !== null}
        title="Delete Staff Account"
        message={`Are you sure you want to delete ${deleteUser?.name} (${deleteUser?.email})? They will immediately lose access.`}
        confirmLabel="Delete User"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteUser(null)}
      />
    </div>
  );
}

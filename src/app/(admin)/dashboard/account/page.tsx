"use client";

import React, { useState } from "react";
import { FormLayout } from "@/components/admin/FormLayout";
import { authClient } from "@/lib/auth-client";
import { Lock, KeyRound, Shield, CheckCircle2, AlertCircle } from "lucide-react";

export default function AccountSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (res.error) {
        throw new Error(res.error.message || "Failed to change password.");
      }

      setStatusMessage("Password changed successfully! All other sessions have been logged out.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setErrorMessage(err.message || "Error updating password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <div className="pb-2 border-b border-[var(--border)]">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
          Account Security
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Manage your credentials, password, and session access.
        </p>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form
        onSubmit={handleChangePassword}
        className="space-y-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 sm:p-8 shadow-xs"
      >
        <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
          <KeyRound className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-base font-semibold text-[var(--text)]">
            Change Password
          </h2>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="current-pw"
            className="block text-xs font-semibold text-[var(--text)]"
          >
            Current Password <span className="text-rose-500">*</span>
          </label>
          <input
            id="current-pw"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="new-pw"
            className="block text-xs font-semibold text-[var(--text)]"
          >
            New Password <span className="text-rose-500">*</span>
          </label>
          <input
            id="new-pw"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            placeholder="At least 8 characters"
            className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="confirm-pw"
            className="block text-xs font-semibold text-[var(--text)]"
          >
            Confirm New Password <span className="text-rose-500">*</span>
          </label>
          <input
            id="confirm-pw"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-xs"
        >
          <Lock className="w-4 h-4" />
          <span>{loading ? "Updating Password..." : "Update Password"}</span>
        </button>
      </form>
    </div>
  );
}

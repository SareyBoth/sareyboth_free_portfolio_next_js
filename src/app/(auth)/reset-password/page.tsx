"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/auth-client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="font-heading text-lg font-bold text-red-600 dark:text-red-400">
          Invalid or Missing Token
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          The password reset token is missing, expired, or malformed. Please request a new reset link.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] rounded-md hover:bg-[var(--accent-hover)]"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword({
        newPassword: password,
        token,
      });

      if (res.error) {
        setError(res.error.message || "Failed to reset password. The token may be expired.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="font-heading text-lg font-bold text-green-600 dark:text-green-400">
          Password Reset Complete
        </h1>
        <p className="text-xs text-[var(--text-secondary)]">
          Your password has been successfully updated. Redirecting you to sign in...
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] rounded-md"
        >
          Sign in now
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1">
        <h1 className="font-heading text-xl font-bold text-[var(--text-primary)]">
          Set New Password
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          Enter a secure new password for your staff account.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3 text-xs bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900 rounded-md"
        >
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="new-password"
          className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
        >
          New Password
        </label>
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm bg-[var(--bg-page)] text-[var(--text-primary)] border border-[var(--border-subtle)] focus:border-[var(--accent)]"
          style={{ borderRadius: "var(--radius-sm)", height: "var(--control-height, 44px)" }}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="confirm-password"
          className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
        >
          Confirm New Password
        </label>
        <input
          id="confirm-password"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm bg-[var(--bg-page)] text-[var(--text-primary)] border border-[var(--border-subtle)] focus:border-[var(--accent)]"
          style={{ borderRadius: "var(--radius-sm)", height: "var(--control-height, 44px)" }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center items-center px-4 py-2.5 text-sm font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors cursor-pointer"
        style={{ borderRadius: "var(--radius-md)", height: "var(--control-height, 44px)" }}
      >
        {loading ? "Updating password..." : "Reset Password"}
      </button>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="text-xs text-[var(--accent)] hover:underline"
        >
          Back to login
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--text-muted)]">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

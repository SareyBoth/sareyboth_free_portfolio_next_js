"use client";

import React, { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (res.error) {
        // Safe operational error or log
        console.error("Forget password error:", res.error);
      }

      // Always show generic acknowledgement regardless of account existence to prevent email enumeration
      setSubmitted(true);
    } catch (err: any) {
      console.error("Forget password exception:", err);
      // Still show generic acknowledgement to protect account privacy
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="font-heading text-xl font-bold text-[var(--text-primary)]">
          Reset Password
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          Enter your staff email to receive a password reset link.
        </p>
      </div>

      {submitted ? (
        <div className="space-y-4">
          <div
            role="status"
            className="p-4 text-xs bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded-md space-y-2"
          >
            <p className="font-semibold text-[var(--text-primary)]">
              Password reset requested
            </p>
            <p className="leading-relaxed">
              If an active staff account exists for <strong className="text-[var(--text-primary)]">{email}</strong>, a reset link has been dispatched via configured SMTP. Please check your inbox and spam folder.
            </p>
          </div>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-colors rounded-md"
            >
              Return to login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[var(--bg-page)] text-[var(--text-primary)] border border-[var(--border-subtle)] focus:border-[var(--accent)]"
              style={{ borderRadius: "var(--radius-sm)", height: "var(--control-height, 44px)" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full flex justify-center items-center px-4 py-2.5 text-sm font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors cursor-pointer"
            style={{ borderRadius: "var(--radius-md)", height: "var(--control-height, 44px)" }}
          >
            {loading ? "Sending reset link..." : "Send reset link"}
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
      )}
    </div>
  );
}

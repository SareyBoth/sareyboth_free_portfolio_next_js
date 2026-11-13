"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn.email({
        email,
        password,
        rememberMe,
      });

      if (res.error) {
        setError(res.error.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      // Successful login
      const target = returnTo.startsWith("/") ? returnTo : "/dashboard";
      router.push(target);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during login");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-1">
        <h1 className="font-heading text-xl font-bold text-[var(--text-primary)]">
          Sign In
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          Access the portfolio dashboard and draft publishing workspace.
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

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-[var(--accent)] hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm bg-[var(--bg-page)] text-[var(--text-primary)] border border-[var(--border-subtle)] focus:border-[var(--accent)]"
          style={{ borderRadius: "var(--radius-sm)", height: "var(--control-height, 44px)" }}
        />
      </div>

      <div className="flex items-center">
        <input
          id="remember-me"
          name="remember-me"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="h-4 w-4 rounded border-[var(--border-subtle)] text-[var(--accent)] focus:ring-[var(--focus-ring)]"
        />
        <label
          htmlFor="remember-me"
          className="ml-2 block text-xs text-[var(--text-secondary)]"
        >
          Remember me on this browser
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center items-center px-4 py-2.5 text-sm font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors cursor-pointer"
        style={{ borderRadius: "var(--radius-md)", height: "var(--control-height, 44px)" }}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--text-muted)]">Loading login...</div>}>
      <LoginForm />
    </Suspense>
  );
}

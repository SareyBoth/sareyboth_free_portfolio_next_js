"use client";

import React from "react";
import Link from "next/link";

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="main-content"
      className="min-h-screen flex items-center justify-center px-4 py-20"
    >
      <div className="surface-card max-w-lg w-full text-center space-y-5">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
          Unexpected Error
        </p>
        <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
          Something went wrong while rendering this view
        </h1>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          You can try reloading this section or return to the portfolio homepage.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-2.5 text-sm font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] rounded-md cursor-pointer"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-4 py-2.5 text-sm font-semibold border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-primary)] rounded-md"
          >
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}

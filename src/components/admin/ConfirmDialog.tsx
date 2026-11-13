"use client";

import React, { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !loading) {
        onCancel();
      }
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const confirmColors =
    variant === "danger"
      ? "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500"
      : variant === "warning"
      ? "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500"
      : "bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] focus:ring-[var(--accent)]";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          {variant === "danger" || variant === "warning" ? (
            <div
              className={`p-2 rounded-full shrink-0 ${
                variant === "danger"
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          ) : null}
          <div className="flex-1 min-w-0">
            <h3
              id="confirm-dialog-title"
              className="text-lg font-semibold text-[var(--text)] tracking-tight"
            >
              {title}
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Close dialog"
            className="text-[var(--muted)] hover:text-[var(--text)] rounded-md p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-md border border-[var(--border)] text-[var(--text)] hover:bg-[var(--muted)]/10 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all shadow-xs focus:outline-hidden focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${confirmColors}`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

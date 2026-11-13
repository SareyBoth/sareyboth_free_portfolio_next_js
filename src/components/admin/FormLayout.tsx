"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  RotateCcw,
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface FormLayoutProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  isPublished?: boolean;
  isDirty?: boolean;
  version?: number | string;
  saving?: boolean;
  publishing?: boolean;
  deleting?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  conflictError?: boolean;
  onSaveDraft?: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
  onDelete?: () => void;
  onReload?: () => void;
  previewUrl?: string;
  backHref?: string;
  canPublish?: boolean;
  children: React.ReactNode;
}

export function FormLayout({
  breadcrumbs,
  title,
  subtitle,
  isPublished,
  isDirty = false,
  version,
  saving = false,
  publishing = false,
  deleting = false,
  errorMessage,
  successMessage,
  conflictError = false,
  onSaveDraft,
  onPublish,
  onUnpublish,
  onDelete,
  onReload,
  previewUrl,
  backHref,
  canPublish = true,
  children,
}: FormLayoutProps) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="opacity-40">/</span>}
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="hover:text-[var(--text)] transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={isLast ? "font-medium text-[var(--text)]" : ""}
                  aria-current={isLast ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            {backHref && (
              <Link
                href={backHref}
                className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--muted)]/10 transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">
              {title}
            </h1>
            {isPublished !== undefined && (
              <StatusBadge
                status={isPublished ? "Published" : "Draft"}
                variant={isPublished ? "published" : "draft"}
              />
            )}
            {isDirty && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </span>
            )}
            {version !== undefined && (
              <span className="text-xs text-[var(--muted)] opacity-70">
                v{version}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-[var(--muted)] max-w-2xl">{subtitle}</p>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {previewUrl && (
            <Link
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--muted)]/10 transition-colors shadow-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </Link>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting || saving || publishing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          {isPublished && onUnpublish && canPublish && (
            <button
              type="button"
              onClick={onUnpublish}
              disabled={publishing || saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--text)] hover:bg-[var(--muted)]/10 transition-colors disabled:opacity-50"
            >
              <span>Unpublish</span>
            </button>
          )}

          {onSaveDraft && (
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={saving || publishing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--muted)]/10 transition-colors shadow-xs disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{saving ? "Saving..." : "Save Draft"}</span>
            </button>
          )}

          {onPublish && canPublish && (
            <button
              type="button"
              onClick={onPublish}
              disabled={publishing || saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 transition-opacity shadow-xs disabled:opacity-50"
            >
              {publishing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{publishing ? "Publishing..." : isPublished ? "Update Published" : "Publish"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 409 Concurrency Conflict Alert */}
      {conflictError && (
        <div
          role="alert"
          className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm space-y-1">
            <p className="font-semibold">Conflict Detected (409)</p>
            <p>
              This document was updated by another user or session while you were editing it. Your changes were not overwritten. Please reload the latest version before applying your edits.
            </p>
            {onReload && (
              <button
                type="button"
                onClick={onReload}
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-md text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reload latest data
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && !conflictError && (
        <div
          role="alert"
          className="p-4 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200 flex items-start gap-3 text-sm"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Error</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div
          role="status"
          className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 flex items-start gap-3 text-sm"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {/* Form Content */}
      <div className="space-y-6">{children}</div>
    </div>
  );
}

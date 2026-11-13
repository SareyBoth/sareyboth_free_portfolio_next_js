import React from "react";

export type StatusVariant =
  | "published"
  | "draft"
  | "archived"
  | "unread"
  | "read"
  | "replied"
  | "owner"
  | "editor"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

export function StatusBadge({ status, variant, className = "" }: StatusBadgeProps) {
  // Infer variant if not provided
  const normalized = (variant || status).toLowerCase() as StatusVariant;

  const variantStyles: Record<StatusVariant, { bg: string; text: string; border: string }> = {
    published: {
      bg: "bg-emerald-500/10 dark:bg-emerald-400/15",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-600/20 dark:border-emerald-400/30",
    },
    success: {
      bg: "bg-emerald-500/10 dark:bg-emerald-400/15",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-600/20 dark:border-emerald-400/30",
    },
    draft: {
      bg: "bg-amber-500/10 dark:bg-amber-400/15",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-600/20 dark:border-amber-400/30",
    },
    warning: {
      bg: "bg-amber-500/10 dark:bg-amber-400/15",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-600/20 dark:border-amber-400/30",
    },
    archived: {
      bg: "bg-stone-500/10 dark:bg-stone-400/15",
      text: "text-stone-700 dark:text-stone-400",
      border: "border-stone-600/20 dark:border-stone-400/30",
    },
    neutral: {
      bg: "bg-stone-500/10 dark:bg-stone-400/15",
      text: "text-stone-700 dark:text-stone-400",
      border: "border-stone-600/20 dark:border-stone-400/30",
    },
    unread: {
      bg: "bg-blue-500/10 dark:bg-blue-400/15",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-600/20 dark:border-blue-400/30",
    },
    read: {
      bg: "bg-stone-500/10 dark:bg-stone-400/15",
      text: "text-stone-600 dark:text-stone-400",
      border: "border-stone-600/20 dark:border-stone-400/30",
    },
    replied: {
      bg: "bg-purple-500/10 dark:bg-purple-400/15",
      text: "text-purple-700 dark:text-purple-400",
      border: "border-purple-600/20 dark:border-purple-400/30",
    },
    owner: {
      bg: "bg-[var(--accent)]/10",
      text: "text-[var(--accent)]",
      border: "border-[var(--accent)]/20",
    },
    editor: {
      bg: "bg-sky-500/10 dark:bg-sky-400/15",
      text: "text-sky-700 dark:text-sky-400",
      border: "border-sky-600/20 dark:border-sky-400/30",
    },
    danger: {
      bg: "bg-rose-500/10 dark:bg-rose-400/15",
      text: "text-rose-700 dark:text-rose-400",
      border: "border-rose-600/20 dark:border-rose-400/30",
    },
  };

  const style = variantStyles[normalized] ?? variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 mr-1.5" />
      {status}
    </span>
  );
}

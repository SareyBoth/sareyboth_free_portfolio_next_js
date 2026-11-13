import React from "react";
import Link from "next/link";
import { prisma } from "@/server/prisma-client";
import {
  Sparkles,
  BookOpen,
  Mail,
  Film,
  Plus,
  Eye,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
} from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";


// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;


export default async function DashboardOverviewPage() {
  const [
    highlightsTotal,
    highlightsPublished,
    articlesTotal,
    articlesPublished,
    unreadMessages,
    mediaCount,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.highlight.count({ where: { archivedAt: null } }),
    prisma.highlight.count({ where: { published: true, archivedAt: null } }),
    prisma.article.count({ where: { archivedAt: null } }),
    prisma.article.count({ where: { published: true, archivedAt: null } }),
    prisma.contactMessage.count({ where: { status: "unread" } }),
    prisma.mediaAsset.count(),
    prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const highlightDrafts = highlightsTotal - highlightsPublished;
  const articleDrafts = articlesTotal - articlesPublished;
  const totalDrafts = highlightDrafts + articleDrafts;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Welcome Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Content Overview
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Real-time status of your portfolio content, publications, and visitor messages.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/preview"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--muted)]/10 transition-colors shadow-xs"
          >
            <Eye className="w-4 h-4 text-[var(--muted)]" />
            <span>Preview Drafts</span>
          </Link>
          <Link
            href="/dashboard/highlights/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 transition-opacity shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Highlight</span>
          </Link>
        </div>
      </div>

      {/* Draft Notification Banner */}
      {totalDrafts > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-sm">
              You have <strong className="font-semibold">{totalDrafts}</strong> uncommitted draft item{totalDrafts > 1 ? "s" : ""} ({highlightDrafts} highlight{highlightDrafts !== 1 ? "s" : ""}, {articleDrafts} article{articleDrafts !== 1 ? "s" : ""}). Review them in Preview Mode before publishing.
            </p>
          </div>
          <Link
            href="/preview"
            target="_blank"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors shrink-0 self-start sm:self-auto"
          >
            <span>Open Preview</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Highlights */}
        <Link
          href="/dashboard/highlights"
          className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/50 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-semibold tracking-wider uppercase">
              Highlights
            </span>
            <Sparkles className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[var(--text)]">
              {highlightsPublished}
            </span>
            <span className="text-xs text-[var(--muted)]">
              / {highlightsTotal} total
            </span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between">
            <span className="text-[var(--muted)]">
              {highlightDrafts} draft{highlightDrafts !== 1 ? "s" : ""}
            </span>
            <span className="text-[var(--accent)] group-hover:underline flex items-center gap-0.5 font-medium">
              Manage <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </Link>

        {/* Journal Articles */}
        <Link
          href="/dashboard/articles"
          className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/50 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-semibold tracking-wider uppercase">
              Articles
            </span>
            <BookOpen className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[var(--text)]">
              {articlesPublished}
            </span>
            <span className="text-xs text-[var(--muted)]">
              / {articlesTotal} total
            </span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between">
            <span className="text-[var(--muted)]">
              {articleDrafts} draft{articleDrafts !== 1 ? "s" : ""}
            </span>
            <span className="text-[var(--accent)] group-hover:underline flex items-center gap-0.5 font-medium">
              Manage <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </Link>

        {/* Unread Messages */}
        <Link
          href="/dashboard/messages"
          className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/50 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-semibold tracking-wider uppercase">
              Inbox
            </span>
            <Mail className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[var(--text)]">
              {unreadMessages}
            </span>
            <span className="text-xs text-[var(--muted)]">unread</span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between">
            <span className="text-[var(--muted)]">Contact form submissions</span>
            <span className="text-[var(--accent)] group-hover:underline flex items-center gap-0.5 font-medium">
              View <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </Link>

        {/* Media Library */}
        <Link
          href="/dashboard/media"
          className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/50 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-semibold tracking-wider uppercase">
              Media Assets
            </span>
            <Film className="w-5 h-5 text-sky-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[var(--text)]">
              {mediaCount}
            </span>
            <span className="text-xs text-[var(--muted)]">files</span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between">
            <span className="text-[var(--muted)]">Images & documents</span>
            <span className="text-[var(--accent)] group-hover:underline flex items-center gap-0.5 font-medium">
              Browse <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </Link>
      </div>

      {/* Quick Links & Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Content Management Shortcuts */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text)]">
            Content Sections
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: "Profile & Bio", desc: "Name, introduction, bio paragraphs, CTA buttons", href: "/dashboard/profile" },
              { title: "Sections Order", desc: "Enable, disable, and order portfolio sections", href: "/dashboard/sections" },
              { title: "Strengths & Skills", desc: "Grouped skills and expertise areas", href: "/dashboard/strengths" },
              { title: "Journey & Career", desc: "Employment, education, volunteering timeline", href: "/dashboard/journey" },
              { title: "Achievements", desc: "Awards, credentials, and certifications", href: "/dashboard/achievements" },
              { title: "Testimonials", desc: "Client, peer, and supervisor reflections", href: "/dashboard/testimonials" },
              { title: "Services", desc: "Service offerings, descriptions, and deliverables", href: "/dashboard/services" },
              { title: "Appearance & Themes", desc: "Presets (Minimal, Warm, Modern), density, radius", href: "/dashboard/appearance" },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--muted)]/5 transition-colors flex items-center justify-between group"
              >
                <div className="min-w-0 pr-3">
                  <h3 className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                    {card.desc}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Right Col: Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--text)] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--accent)]" />
              <span>Recent Activity</span>
            </h2>
            <Link
              href="/dashboard/audit"
              className="text-xs text-[var(--accent)] hover:underline font-medium"
            >
              All Logs
            </Link>
          </div>

          <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] p-4 shadow-xs divide-y divide-[var(--border)]">
            {recentAuditLogs.length === 0 ? (
              <p className="py-6 text-center text-xs text-[var(--muted)]">
                No activity recorded yet.
              </p>
            ) : (
              recentAuditLogs.map((log) => (
                <div key={log.id} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[var(--text)] capitalize">
                      {log.action} {log.entityType.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] text-[var(--muted)] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-[var(--muted)] text-[11px] mt-0.5 truncate">
                    by {log.actorEmail || "system"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DataTable, ColumnDef, DataTableFilter, RowAction } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Edit2, Trash2, Send, Eye, Sparkles } from "lucide-react";

interface HighlightItemRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categoryName: string;
  published: boolean;
  featured: boolean;
  date?: string | null;
  displayOrder: number;
  version: number;
}

export default function HighlightsListPage() {
  const [data, setData] = useState<HighlightItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  // Dialog state
  const [deleteItem, setDeleteItem] = useState<HighlightItemRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadHighlights();
  }, [search, statusFilter, page, pageSize]);

  async function loadHighlights() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        status: statusFilter,
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/highlights?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.items || []);
        if (json.pagination) {
          setTotal(json.pagination.total);
        }
      }
    } catch (err) {
      console.error("Failed to load highlights:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/highlights/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteItem(null);
        await loadHighlights();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  }

  const columns: ColumnDef<HighlightItemRow>[] = [
    {
      key: "title",
      header: "Title & Slug",
      render: (item) => (
        <div className="space-y-0.5">
          <Link
            href={`/dashboard/highlights/${item.id}/edit`}
            className="font-medium text-[var(--text)] hover:text-[var(--accent)] transition-colors"
          >
            {item.title}
          </Link>
          <p className="text-xs text-[var(--muted)] font-mono">{item.slug}</p>
        </div>
      ),
    },
    {
      key: "categoryName",
      header: "Category",
      render: (item) => (
        <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--muted)]/10 text-[var(--text)]">
          {item.categoryName}
        </span>
      ),
    },
    {
      key: "published",
      header: "Status",
      render: (item) => (
        <StatusBadge
          status={item.published ? "Published" : "Draft"}
          variant={item.published ? "published" : "draft"}
        />
      ),
    },
    {
      key: "featured",
      header: "Featured",
      render: (item) => (
        <span className="text-xs text-[var(--muted)]">
          {item.featured ? (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Yes
            </span>
          ) : (
            "No"
          )}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (item) => (
        <span className="text-xs text-[var(--muted)]">{item.date || "—"}</span>
      ),
    },
  ];

  const filters: DataTableFilter[] = [
    {
      key: "status",
      label: "Status",
      value: statusFilter,
      options: [
        { label: "All Statuses", value: "all" },
        { label: "Published", value: "published" },
        { label: "Drafts", value: "draft" },
        { label: "Archived", value: "archived" },
      ],
      onChange: (val) => {
        setStatusFilter(val);
        setPage(1);
      },
    },
  ];

  const actions: RowAction<HighlightItemRow>[] = [
    {
      label: "Preview",
      icon: Eye,
      href: (item) => `/preview/highlights/${item.slug}`,
    },
    {
      label: "Edit",
      icon: Edit2,
      href: (item) => `/dashboard/highlights/${item.id}/edit`,
    },
    {
      label: "Delete",
      icon: Trash2,
      variant: "danger",
      onClick: (item) => setDeleteItem(item),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            Portfolio Highlights
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Manage your key projects, outcomes, and case study narratives.
          </p>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        searchQuery={search}
        onSearchChange={(q) => {
          setSearch(q);
          setPage(1);
        }}
        searchPlaceholder="Search highlights by title, slug, summary..."
        filters={filters}
        actions={actions}
        newItemHref="/dashboard/highlights/new"
        newItemLabel="New Highlight"
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: (p) => setPage(p),
          onPageSizeChange: (s) => {
            setPageSize(s);
            setPage(1);
          },
        }}
        emptyMessage="No highlights found. Create your first project highlight to showcase on your portfolio."
      />

      <ConfirmDialog
        isOpen={deleteItem !== null}
        title="Delete Highlight"
        message={`Are you sure you want to delete "${deleteItem?.title}"? It will be archived or permanently removed.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  );
}

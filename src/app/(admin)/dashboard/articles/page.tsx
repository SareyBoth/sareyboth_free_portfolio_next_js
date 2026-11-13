"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DataTable, ColumnDef, DataTableFilter, RowAction } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Edit2, Trash2, Eye } from "lucide-react";

interface ArticleItemRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  date: string;
  readingTime?: string | null;
  published: boolean;
  version: number;
}

export default function ArticlesListPage() {
  const [data, setData] = useState<ArticleItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const [deleteItem, setDeleteItem] = useState<ArticleItemRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadArticles();
  }, [search, statusFilter, page, pageSize]);

  async function loadArticles() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        status: statusFilter,
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/articles?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.items || []);
        if (json.pagination) {
          setTotal(json.pagination.total);
        }
      }
    } catch (err) {
      console.error("Failed to load articles:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/articles/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteItem(null);
        await loadArticles();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  }

  const columns: ColumnDef<ArticleItemRow>[] = [
    {
      key: "title",
      header: "Title & Slug",
      render: (item) => (
        <div className="space-y-0.5">
          <Link
            href={`/dashboard/articles/${item.id}/edit`}
            className="font-medium text-[var(--text)] hover:text-[var(--accent)] transition-colors"
          >
            {item.title}
          </Link>
          <p className="text-xs text-[var(--muted)] font-mono">{item.slug}</p>
        </div>
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
      key: "date",
      header: "Date",
      render: (item) => (
        <span className="text-xs text-[var(--muted)]">{item.date}</span>
      ),
    },
    {
      key: "readingTime",
      header: "Reading Time",
      render: (item) => (
        <span className="text-xs text-[var(--muted)]">
          {item.readingTime || "—"}
        </span>
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

  const actions: RowAction<ArticleItemRow>[] = [
    {
      label: "Preview",
      icon: Eye,
      href: (item) => `/preview/articles/${item.slug}`,
    },
    {
      label: "Edit",
      icon: Edit2,
      href: (item) => `/dashboard/articles/${item.id}/edit`,
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
            Journal Articles
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Write, review drafts, and publish entries to your public journal.
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
        searchPlaceholder="Search articles by title, slug, summary..."
        filters={filters}
        actions={actions}
        newItemHref="/dashboard/articles/new"
        newItemLabel="Write Article"
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
        emptyMessage="No journal articles found. Write your first reflection or case study."
      />

      <ConfirmDialog
        isOpen={deleteItem !== null}
        title="Delete Article"
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

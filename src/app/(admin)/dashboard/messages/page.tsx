"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DataTable, ColumnDef, DataTableFilter, RowAction } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Mail, MailOpen, Trash2, Eye } from "lucide-react";

interface MessageRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  createdAt: string;
}

export default function MessagesInboxPage() {
  const [data, setData] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const [deleteItem, setDeleteItem] = useState<MessageRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [search, statusFilter, page, pageSize]);

  async function loadMessages() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        status: statusFilter,
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/messages?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.items || []);
        if (json.pagination) {
          setTotal(json.pagination.total);
        }
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/messages/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteItem(null);
        await loadMessages();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  }

  const columns: ColumnDef<MessageRow>[] = [
    {
      key: "status",
      header: "Status",
      className: "w-24",
      render: (item) => (
        <StatusBadge
          status={item.status}
          variant={item.status === "unread" ? "unread" : item.status === "read" ? "read" : "archived"}
        />
      ),
    },
    {
      key: "name",
      header: "Sender",
      render: (item) => (
        <div>
          <Link
            href={`/dashboard/messages/${item.id}`}
            className="font-semibold text-sm text-[var(--text)] hover:text-[var(--accent)] transition-colors"
          >
            {item.name}
          </Link>
          <p className="text-xs text-[var(--muted)]">{item.email}</p>
        </div>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      render: (item) => (
        <Link
          href={`/dashboard/messages/${item.id}`}
          className="text-sm text-[var(--text)] hover:underline truncate block max-w-md"
        >
          {item.subject}
        </Link>
      ),
    },
    {
      key: "createdAt",
      header: "Received",
      render: (item) => (
        <span className="text-xs text-[var(--muted)]">
          {new Date(item.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
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
        { label: "All Messages", value: "all" },
        { label: "Unread", value: "unread" },
        { label: "Read", value: "read" },
        { label: "Archived", value: "archived" },
      ],
      onChange: (val) => {
        setStatusFilter(val);
        setPage(1);
      },
    },
  ];

  const actions: RowAction<MessageRow>[] = [
    {
      label: "View",
      icon: Eye,
      href: (item) => `/dashboard/messages/${item.id}`,
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
      <div className="pb-2 border-b border-[var(--border)]">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
          Message Inbox
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Review incoming visitor submissions, inquiries, and partnership notes.
        </p>
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
        searchPlaceholder="Search messages by sender, email, subject..."
        filters={filters}
        actions={actions}
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
        emptyMessage="No messages found in your inbox."
      />

      <ConfirmDialog
        isOpen={deleteItem !== null}
        title="Delete Message"
        message={`Are you sure you want to permanently delete the message from "${deleteItem?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  );
}

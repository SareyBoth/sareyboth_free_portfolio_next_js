"use client";

import React, { useState, useEffect } from "react";
import { DataTable, ColumnDef, DataTableFilter } from "@/components/admin/DataTable";
import { History, Search, Code2, ChevronDown, ChevronRight } from "lucide-react";

interface AuditLogRow {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  actorEmail?: string | null;
  details?: any | null;
  createdAt: string;
}

export default function AuditLogPage() {
  const [items, setItems] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter, entityTypeFilter, page, pageSize]);

  async function loadAuditLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (actionFilter) params.set("action", actionFilter);
      if (entityTypeFilter) params.set("entityType", entityTypeFilter);

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setItems(json.items || []);
        if (json.pagination) {
          setTotal(json.pagination.total);
        }
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  }

  const columns: ColumnDef<AuditLogRow>[] = [
    {
      key: "createdAt",
      header: "Timestamp",
      className: "w-40",
      render: (item) => (
        <span className="text-xs font-mono text-[var(--muted)]">
          {new Date(item.createdAt).toLocaleString(undefined, {
            dateStyle: "short",
            timeStyle: "medium",
          })}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      className: "w-28",
      render: (item) => (
        <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--muted)]/10 text-[var(--text)]">
          {item.action}
        </span>
      ),
    },
    {
      key: "entityType",
      header: "Target Entity",
      render: (item) => (
        <div className="space-y-0.5">
          <span className="text-xs font-medium text-[var(--text)] capitalize">
            {item.entityType.replace(/_/g, " ")}
          </span>
          {item.entityId && (
            <p className="text-[11px] font-mono text-[var(--muted)] truncate max-w-xs">
              ID: {item.entityId}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "actorEmail",
      header: "Actor",
      render: (item) => (
        <span className="text-xs text-[var(--muted)]">
          {item.actorEmail || "System Automation"}
        </span>
      ),
    },
    {
      key: "details",
      header: "Details",
      render: (item) => {
        const isExpanded = expandedRowId === item.id;
        return (
          <div>
            {item.details ? (
              <button
                type="button"
                onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                <span>{isExpanded ? "Hide diff" : "Inspect diff"}</span>
              </button>
            ) : (
              <span className="text-xs text-[var(--muted)] opacity-50">—</span>
            )}
            {isExpanded && item.details && (
              <pre className="mt-2 p-2 rounded bg-black/5 dark:bg-black/30 border border-[var(--border)] text-[11px] font-mono text-[var(--text)] overflow-x-auto max-w-md">
                {JSON.stringify(item.details, null, 2)}
              </pre>
            )}
          </div>
        );
      },
    },
  ];

  const filters: DataTableFilter[] = [
    {
      key: "action",
      label: "Action",
      value: actionFilter,
      options: [
        { label: "All Actions", value: "" },
        { label: "Create", value: "create" },
        { label: "Update", value: "update" },
        { label: "Publish", value: "publish" },
        { label: "Unpublish", value: "unpublish" },
        { label: "Delete", value: "delete" },
        { label: "Import", value: "import" },
        { label: "Export", value: "export" },
      ],
      onChange: (val) => {
        setActionFilter(val);
        setPage(1);
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] flex items-center gap-2">
            <History className="w-6 h-6 text-[var(--accent)]" />
            <span>Audit Event Log</span>
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Immutable inspection trail of content publishing, configuration edits, and administrative actions.
          </p>
        </div>
      </div>

      <DataTable
        data={items}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        filters={filters}
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
        emptyMessage="No audit log events recorded matching the criteria."
      />
    </div>
  );
}

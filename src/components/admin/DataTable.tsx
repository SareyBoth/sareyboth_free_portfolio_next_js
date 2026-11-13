"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Plus,
  MoreVertical,
  Loader2,
} from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  className?: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

export interface DataTableFilter {
  key: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
}

export interface RowAction<T> {
  label: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  variant?: "default" | "danger" | "warning";
  onClick?: (item: T) => void;
  href?: (item: T) => string;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string;
  loading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  filters?: DataTableFilter[];
  actions?: RowAction<T>[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (newPage: number) => void;
    onPageSizeChange: (newSize: number) => void;
    pageSizeOptions?: number[];
  };
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSortChange?: (columnKey: string) => void;
  newItemHref?: string;
  newItemLabel?: string;
  emptyMessage?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search records...",
  filters,
  actions,
  pagination,
  sortColumn,
  sortDirection,
  onSortChange,
  newItemHref,
  newItemLabel = "Create New",
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    : 1;

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {onSearchChange !== undefined && (
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
              <input
                type="text"
                value={searchQuery ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder-[var(--muted)] focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          )}

          {filters?.map((filter) => (
            <div key={filter.key} className="flex items-center gap-1.5">
              <label
                htmlFor={`filter-${filter.key}`}
                className="text-xs font-medium text-[var(--muted)] shrink-0"
              >
                {filter.label}:
              </label>
              <select
                id={`filter-${filter.key}`}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                aria-label={`Filter by ${filter.label}`}
                className="px-2.5 py-1.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)]"
              >
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {newItemHref && (
          <Link
            href={newItemHref}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 transition-opacity shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{newItemLabel}</span>
          </Link>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse" role="table">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/5">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-3 font-medium text-[var(--muted)] text-xs tracking-wider uppercase ${
                      col.sortable ? "cursor-pointer select-none hover:text-[var(--text)]" : ""
                    } ${col.className ?? ""}`}
                    onClick={() => {
                      if (col.sortable && onSortChange) {
                        onSortChange(col.key);
                      }
                    }}
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span>
                          {sortColumn === col.key ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[var(--accent)]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-[var(--accent)]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {actions && actions.length > 0 && (
                  <th
                    scope="col"
                    className="px-4 py-3 font-medium text-[var(--muted)] text-xs tracking-wider uppercase text-right w-24"
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="px-4 py-12 text-center text-[var(--muted)]"
                  >
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
                      <span>Loading records...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="px-4 py-12 text-center text-[var(--muted)]"
                  >
                    <p className="text-sm">{emptyMessage}</p>
                    {newItemHref && (
                      <Link
                        href={newItemHref}
                        className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-[var(--accent)] hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{newItemLabel}</span>
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                data.map((item) => {
                  const key = keyExtractor(item);
                  return (
                    <tr
                      key={key}
                      className="hover:bg-[var(--muted)]/5 transition-colors group"
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-4 py-3 text-[var(--text)] ${col.className ?? ""}`}
                        >
                          {col.render ? (
                            col.render(item)
                          ) : (
                            String((item as any)[col.key] ?? "")
                          )}
                        </td>
                      ))}
                      {actions && actions.length > 0 && (
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1">
                            {actions.map((act, idx) => {
                              const Icon = act.icon;
                              const variantStyle =
                                act.variant === "danger"
                                  ? "text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                                  : act.variant === "warning"
                                  ? "text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
                                  : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--muted)]/10";

                              if (act.href) {
                                return (
                                  <Link
                                    key={idx}
                                    href={act.href(item)}
                                    title={act.label}
                                    className={`p-1.5 rounded-md transition-colors ${variantStyle}`}
                                  >
                                    {Icon ? (
                                      <Icon size={16} />
                                    ) : (
                                      <span className="text-xs font-medium">
                                        {act.label}
                                      </span>
                                    )}
                                  </Link>
                                );
                              }

                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => act.onClick?.(item)}
                                  title={act.label}
                                  className={`p-1.5 rounded-md transition-colors ${variantStyle}`}
                                >
                                  {Icon ? (
                                    <Icon size={16} />
                                  ) : (
                                    <span className="text-xs font-medium">
                                      {act.label}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination && pagination.total > 0 && (
          <div className="px-4 py-3 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--muted)]">
            <div className="flex items-center gap-3">
              <span>
                Showing{" "}
                <strong className="text-[var(--text)]">
                  {Math.min(
                    (pagination.page - 1) * pagination.pageSize + 1,
                    pagination.total
                  )}
                </strong>{" "}
                to{" "}
                <strong className="text-[var(--text)]">
                  {Math.min(
                    pagination.page * pagination.pageSize,
                    pagination.total
                  )}
                </strong>{" "}
                of <strong className="text-[var(--text)]">{pagination.total}</strong> results
              </span>

              <div className="flex items-center gap-1.5">
                <span>Per page:</span>
                <select
                  value={pagination.pageSize}
                  onChange={(e) =>
                    pagination.onPageSizeChange(Number(e.target.value))
                  }
                  className="px-2 py-0.5 bg-[var(--surface)] border border-[var(--border)] rounded text-[var(--text)] text-xs focus:ring-1 focus:ring-[var(--accent)]"
                >
                  {(pagination.pageSizeOptions ?? [10, 25, 50, 100]).map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => pagination.onPageChange(1)}
                disabled={pagination.page <= 1}
                aria-label="First page"
                className="p-1 rounded border border-[var(--border)] hover:bg-[var(--muted)]/10 disabled:opacity-40 transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                aria-label="Previous page"
                className="p-1 rounded border border-[var(--border)] hover:bg-[var(--muted)]/10 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium text-[var(--text)]">
                Page {pagination.page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= totalPages}
                aria-label="Next page"
                className="p-1 rounded border border-[var(--border)] hover:bg-[var(--muted)]/10 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => pagination.onPageChange(totalPages)}
                disabled={pagination.page >= totalPages}
                aria-label="Last page"
                className="p-1 rounded border border-[var(--border)] hover:bg-[var(--muted)]/10 disabled:opacity-40 transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

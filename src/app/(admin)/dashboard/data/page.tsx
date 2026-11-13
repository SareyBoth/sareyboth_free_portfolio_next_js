"use client";

import React, { useState, useRef } from "react";
import {
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Loader2,
  FileText,
  Database,
  ArrowRight,
} from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export default function DataToolsPage() {
  const [jsonText, setJsonText] = useState("");
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<any | null>(null);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      setDryRunResult(null);
      setImportResult(null);
      setErrorMessage(null);
    };
    reader.readAsText(file);
  }

  async function handleDryRun() {
    setValidating(true);
    setErrorMessage(null);
    setDryRunResult(null);
    setImportResult(null);

    try {
      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        throw new Error("Invalid JSON syntax. Please check file format.");
      }

      const res = await fetch("/api/admin/data/import?dryRun=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Dry run validation failed.");
      }

      setDryRunResult(json);
    } catch (err: any) {
      setErrorMessage(err.message || "Validation failed.");
    } finally {
      setValidating(false);
    }
  }

  async function handleExecuteImport() {
    setShowConfirmModal(false);
    setImporting(true);
    setErrorMessage(null);

    try {
      const parsed = JSON.parse(jsonText);
      const res = await fetch("/api/admin/data/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Import execution failed.");
      }

      setImportResult(json);
      setDryRunResult(null);
    } catch (err: any) {
      setErrorMessage(err.message || "Import execution error.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      <div className="pb-2 border-b border-[var(--border)]">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
          Data Export & Import
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Export your PostgreSQL portfolio as schema-compliant JSON, or run safe validated imports.
        </p>
      </div>

      {/* Export Card */}
      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-3">
          <Download className="w-5 h-5 text-[var(--accent)]" />
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">
              Export Portfolio Content (JSON)
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Downloads all current draft & published portfolio items, sections, bio, and settings as a portable portfolio.json file.
            </p>
          </div>
        </div>

        <div>
          <a
            href="/api/admin/data/export"
            download="portfolio.json"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download portfolio.json</span>
          </a>
        </div>
      </div>

      {/* Import Card */}
      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-3">
          <Upload className="w-5 h-5 text-indigo-500" />
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">
              Import Content (JSON)
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Upload a valid SareyBothPortfolio JSON file. Use &ldquo;Validate & Dry Run&rdquo; to test schema compatibility before committing changes.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Validation Error</p>
              <p className="text-xs mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {dryRunResult && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-sm space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Dry Run Succeeded — Schema is 100% Valid</span>
            </div>
            {dryRunResult.summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                {Object.entries(dryRunResult.summary).map(([key, count]) => (
                  <div key={key} className="p-2 rounded bg-[var(--surface)] border border-[var(--border)]">
                    <span className="capitalize text-[var(--muted)] block">{key}</span>
                    <strong className="text-sm text-[var(--text)]">{String(count)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {importResult && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-sm space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Database Updated Successfully!</span>
            </div>
            <p className="text-xs">
              All portfolio records were imported and updated in PostgreSQL.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--text)] hover:bg-[var(--muted)]/10"
            >
              <FileText className="w-4 h-4" />
              <span>Load from File...</span>
            </button>
            <span className="text-xs text-[var(--muted)]">or paste JSON below</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelected}
            className="hidden"
          />

          <textarea
            rows={10}
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setDryRunResult(null);
              setImportResult(null);
              setErrorMessage(null);
            }}
            placeholder='Paste your {"schemaVersion": 1, "site": {...}, ...} JSON here...'
            className="w-full px-3 py-2 text-xs font-mono bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleDryRun}
            disabled={validating || !jsonText.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md border border-[var(--border)] text-[var(--text)] hover:bg-[var(--muted)]/10 disabled:opacity-40"
          >
            {validating ? (
              <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
            ) : (
              <FileCheck className="w-4 h-4" />
            )}
            <span>{validating ? "Validating Schema..." : "Validate & Dry Run"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={importing || !jsonText.trim() || !dryRunResult}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 disabled:opacity-40 shadow-xs"
          >
            {importing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            <span>{importing ? "Importing Data..." : "Execute Database Import"}</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmModal}
        title="Execute Database Import"
        message="This will update your PostgreSQL portfolio tables with the imported JSON data. All existing sections, highlights, and articles with matching slugs will be overwritten with the imported content."
        confirmLabel="Proceed with Import"
        variant="warning"
        loading={importing}
        onConfirm={handleExecuteImport}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
}

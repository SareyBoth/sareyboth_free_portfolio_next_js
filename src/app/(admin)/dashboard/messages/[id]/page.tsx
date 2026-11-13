"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Trash2,
  Reply,
  Archive,
  CheckCircle2,
  Clock,
  User,
  Save,
  Loader2,
} from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface MessageDetail {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  internalNotes?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export default function MessageDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [message, setMessage] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [internalNotes, setInternalNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadMessage();
    }
  }, [id]);

  async function loadMessage() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/messages/${id}`);
      if (res.ok) {
        const json = await res.json();
        const m = json.message;
        setMessage(m);
        setInternalNotes(m.internalNotes || "");
      }
    } catch (err) {
      console.error("Failed to load message:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const json = await res.json();
        setMessage(json.message);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  async function saveNotes() {
    setSavingNotes(true);
    setNotesSuccess(false);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalNotes }),
      });
      if (res.ok) {
        setNotesSuccess(true);
        setTimeout(() => setNotesSuccess(false), 2500);
      }
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/dashboard/messages");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-[var(--muted)]">
        Loading message details...
      </div>
    );
  }

  if (!message) {
    return (
      <div className="py-24 text-center space-y-3">
        <p className="text-base text-[var(--text)]">Message not found.</p>
        <Link
          href="/dashboard/messages"
          className="text-xs font-semibold text-[var(--accent)] hover:underline"
        >
          Return to Inbox
        </Link>
      </div>
    );
  }

  const mailtoReplyHref = `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(
    `Re: ${message.subject}`
  )}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Back button & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/messages"
            className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--muted)]/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[var(--text)]">
                {message.subject}
              </h1>
              <StatusBadge
                status={message.status}
                variant={message.status === "unread" ? "unread" : message.status === "read" ? "read" : "archived"}
              />
            </div>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              From {message.name} &lt;{message.email}&gt;
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={mailtoReplyHref}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 shadow-xs"
          >
            <Reply className="w-3.5 h-3.5" />
            <span>Reply via Email</span>
          </a>

          {message.status !== "archived" ? (
            <button
              type="button"
              onClick={() => updateStatus("archived")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--text)] hover:bg-[var(--muted)]/10"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => updateStatus("read")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--text)] hover:bg-[var(--muted)]/10"
            >
              <span>Move to Inbox</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Message Metadata Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs">
        <div>
          <span className="text-[var(--muted)] block">Sender</span>
          <span className="font-semibold text-[var(--text)]">{message.name}</span>
          <a
            href={`mailto:${message.email}`}
            className="text-[var(--accent)] hover:underline block truncate"
          >
            {message.email}
          </a>
        </div>
        <div>
          <span className="text-[var(--muted)] block">Date Received</span>
          <span className="font-semibold text-[var(--text)]">
            {new Date(message.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        </div>
        <div>
          <span className="text-[var(--muted)] block">Origin IP</span>
          <span className="font-mono text-[var(--text)]">
            {message.ipAddress || "unknown"}
          </span>
        </div>
      </div>

      {/* Message Body Card */}
      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Message Content
        </h2>
        <div className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap font-sans">
          {message.message}
        </div>
      </div>

      {/* Internal Staff Notes */}
      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label
            htmlFor="internal-notes"
            className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]"
          >
            Internal Staff Notes (Private)
          </label>
          {notesSuccess && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>
        <textarea
          id="internal-notes"
          rows={3}
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          placeholder="Record private context, follow-up dates, or collaboration notes visible only to staff..."
          className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={saveNotes}
            disabled={savingNotes}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 disabled:opacity-50"
          >
            {savingNotes ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Notes</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Message"
        message="Are you sure you want to permanently delete this message?"
        confirmLabel="Delete Message"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

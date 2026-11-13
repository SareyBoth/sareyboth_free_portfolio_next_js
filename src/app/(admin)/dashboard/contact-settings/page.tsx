"use client";

import React, { useState, useEffect } from "react";
import { FormLayout } from "@/components/admin/FormLayout";

export default function ContactSettingsPage() {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [mode, setMode] = useState("form");
  const [subjectPrefix, setSubjectPrefix] = useState("");
  const [acknowledgementText, setAcknowledgementText] = useState("");
  const [openEmailAppButtonLabel, setOpenEmailAppButtonLabel] = useState("");
  const [emailAppHelperText, setEmailAppHelperText] = useState("");
  const [directEmailFallbackLabel, setDirectEmailFallbackLabel] = useState("");
  const [version, setVersion] = useState(1);

  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/contact-settings")
      .then((r) => r.json())
      .then((json) => {
        const c = json.contactSettings;
        if (c) {
          setRecipientEmail(c.recipientEmail || "");
          setMode(c.mode || "form");
          setSubjectPrefix(c.subjectPrefix || "");
          setAcknowledgementText(c.acknowledgementText || "");
          setOpenEmailAppButtonLabel(c.openEmailAppButtonLabel || "");
          setEmailAppHelperText(c.emailAppHelperText || "");
          setDirectEmailFallbackLabel(c.directEmailFallbackLabel || "");
          setVersion(c.version || 1);
        }
      })
      .catch(() => {});
  }, []);

  function handleFieldChange<T>(setter: React.Dispatch<React.SetStateAction<T>>, val: T) {
    setter(val);
    setIsDirty(true);
    setSuccessMessage(null);
  }

  async function handleSave() {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setConflictError(false);

    try {
      const res = await fetch("/api/admin/contact-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail,
          mode,
          subjectPrefix: subjectPrefix.trim() || null,
          acknowledgementText,
          openEmailAppButtonLabel,
          emailAppHelperText,
          directEmailFallbackLabel,
          version,
        }),
      });

      if (res.status === 409) {
        setConflictError(true);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update contact settings.");
      }

      const json = await res.json();
      setVersion(json.contactSettings.version);
      setIsDirty(false);
      setSuccessMessage("Contact settings saved successfully.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Communication" },
        { label: "Contact Settings" },
      ]}
      title="Contact Form Settings"
      subtitle="Configure how visitors message you: database storage inbox or direct email application launch."
      isDirty={isDirty}
      version={version}
      saving={saving}
      errorMessage={errorMessage}
      successMessage={successMessage}
      conflictError={conflictError}
      onSaveDraft={handleSave}
      onReload={() => window.location.reload()}
      previewUrl="/preview"
    >
      <div className="space-y-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label
              htmlFor="recipient-email"
              className="block text-xs font-semibold text-[var(--text)]"
            >
              Primary Recipient Email <span className="text-rose-500">*</span>
            </label>
            <input
              id="recipient-email"
              type="email"
              value={recipientEmail}
              onChange={(e) => handleFieldChange(setRecipientEmail, e.target.value)}
              className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="submission-mode"
              className="block text-xs font-semibold text-[var(--text)]"
            >
              Submission Handling Mode
            </label>
            <select
              id="submission-mode"
              value={mode}
              onChange={(e) => handleFieldChange(setMode, e.target.value)}
              className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="form">Direct API & Database Inbox</option>
              <option value="mailto">Default Mail Client (mailto:)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="ack-text"
            className="block text-xs font-semibold text-[var(--text)]"
          >
            Form Submission Confirmation Message
          </label>
          <input
            id="ack-text"
            type="text"
            value={acknowledgementText}
            onChange={(e) => handleFieldChange(setAcknowledgementText, e.target.value)}
            className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label
              htmlFor="btn-label"
              className="block text-xs font-semibold text-[var(--text)]"
            >
              Email App Button Label
            </label>
            <input
              id="btn-label"
              type="text"
              value={openEmailAppButtonLabel}
              onChange={(e) =>
                handleFieldChange(setOpenEmailAppButtonLabel, e.target.value)
              }
              className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="helper-text"
              className="block text-xs font-semibold text-[var(--text)]"
            >
              Email App Helper Explanation
            </label>
            <input
              id="helper-text"
              type="text"
              value={emailAppHelperText}
              onChange={(e) =>
                handleFieldChange(setEmailAppHelperText, e.target.value)
              }
              className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="direct-fallback"
            className="block text-xs font-semibold text-[var(--text)]"
          >
            Direct Email Fallback Intro
          </label>
          <input
            id="direct-fallback"
            type="text"
            value={directEmailFallbackLabel}
            onChange={(e) =>
              handleFieldChange(setDirectEmailFallbackLabel, e.target.value)
            }
            className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
      </div>
    </FormLayout>
  );
}

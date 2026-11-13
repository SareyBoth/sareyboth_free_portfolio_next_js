"use client";

import React, { useState } from "react";
import {
  buildMailtoHref,
  type ContactFormErrors,
  type ContactFormInput,
  validateContactForm,
} from "@/lib/contact/mailto";

export function ContactForm({
  recipientEmail,
  openEmailAppButtonLabel,
  emailAppHelperText,
}: {
  recipientEmail: string;
  openEmailAppButtonLabel: string;
  emailAppHelperText: string;
}) {
  const [values, setValues] = useState<ContactFormInput>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [preparedMailtoUrl, setPreparedMailtoUrl] = useState<string | null>(
    null
  );

  const handleChange = (
    field: keyof ContactFormInput,
    nextValue: string
  ) => {
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
    setPreparedMailtoUrl(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateContactForm(values);
    if (!validation.valid) {
      setErrors(validation.errors);
      setPreparedMailtoUrl(null);
      return;
    }

    setErrors({});
    const href = buildMailtoHref(recipientEmail, validation.cleaned);
    setPreparedMailtoUrl(href);
    if (typeof window !== "undefined") {
      window.location.assign(href);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="surface-card space-y-5"
      aria-label="Compose an email draft"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="contact-name"
            className="block text-sm font-medium text-[var(--text-primary)]"
          >
            Your name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={values.name}
            onChange={(e) => handleChange("name", e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            className="w-full px-3.5 py-2 text-sm bg-[var(--bg-page)] text-[var(--text-primary)] border border-[var(--border-subtle)] focus:border-[var(--accent)]"
            style={{ borderRadius: "var(--radius-sm)" }}
          />
          {errors.name && (
            <p
              id="contact-name-error"
              role="alert"
              className="text-xs font-medium text-red-600 dark:text-red-400"
            >
              {errors.name}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="contact-email"
            className="block text-sm font-medium text-[var(--text-primary)]"
          >
            Your email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={values.email}
            onChange={(e) => handleChange("email", e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            className="w-full px-3.5 py-2 text-sm bg-[var(--bg-page)] text-[var(--text-primary)] border border-[var(--border-subtle)] focus:border-[var(--accent)]"
            style={{ borderRadius: "var(--radius-sm)" }}
          />
          {errors.email && (
            <p
              id="contact-email-error"
              role="alert"
              className="text-xs font-medium text-red-600 dark:text-red-400"
            >
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="contact-subject"
          className="block text-sm font-medium text-[var(--text-primary)]"
        >
          Subject
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          required
          value={values.subject}
          onChange={(e) => handleChange("subject", e.target.value)}
          aria-invalid={Boolean(errors.subject)}
          aria-describedby={
            errors.subject ? "contact-subject-error" : undefined
          }
          className="w-full px-3.5 py-2 text-sm bg-[var(--bg-page)] text-[var(--text-primary)] border border-[var(--border-subtle)] focus:border-[var(--accent)]"
          style={{ borderRadius: "var(--radius-sm)" }}
        />
        {errors.subject && (
          <p
            id="contact-subject-error"
            role="alert"
            className="text-xs font-medium text-red-600 dark:text-red-400"
          >
            {errors.subject}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-[var(--text-primary)]"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          required
          value={values.message}
          onChange={(e) => handleChange("message", e.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={
            errors.message ? "contact-message-error" : undefined
          }
          className="w-full px-3.5 py-2 text-sm bg-[var(--bg-page)] text-[var(--text-primary)] border border-[var(--border-subtle)] focus:border-[var(--accent)]"
          style={{ borderRadius: "var(--radius-sm)" }}
        />
        {errors.message && (
          <p
            id="contact-message-error"
            role="alert"
            className="text-xs font-medium text-red-600 dark:text-red-400"
          >
            {errors.message}
          </p>
        )}
      </div>

      <div className="space-y-3 pt-1">
        <button
          type="submit"
          className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          {openEmailAppButtonLabel}
        </button>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          {emailAppHelperText}
        </p>

        {preparedMailtoUrl && (
          <div
            role="status"
            aria-live="polite"
            className="p-3 text-xs bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            Your email app has been prompted with a draft to{" "}
            <strong className="text-[var(--text-primary)]">
              {recipientEmail}
            </strong>
            . Please review and send the message inside your email client, or{" "}
            <a
              href={preparedMailtoUrl}
              className="underline font-semibold text-[var(--accent)]"
            >
              open the prepared mailto link again
            </a>
            .
          </div>
        )}
      </div>
    </form>
  );
}

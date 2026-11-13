"use client";

import React, { useState, useEffect } from "react";
import { FormLayout } from "@/components/admin/FormLayout";
import { MediaPicker, SelectedMedia } from "@/components/admin/MediaPicker";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";

export default function ProfileSettingsPage() {
  const [name, setName] = useState("");
  const [descriptor, setDescriptor] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [biography, setBiography] = useState<string[]>([""]);
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [portrait, setPortrait] = useState<{ src: string; alt: string }>({
    src: "",
    alt: "",
  });
  const [primaryCta, setPrimaryCta] = useState({ label: "", href: "" });
  const [secondaryCta, setSecondaryCta] = useState({ label: "", href: "" });
  const [version, setVersion] = useState(1);

  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState(false);
  const [showPortraitPicker, setShowPortraitPicker] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const res = await fetch("/api/admin/profile");
      if (res.ok) {
        const json = await res.json();
        const p = json.profile;
        if (p) {
          setName(p.name || "");
          setDescriptor(p.descriptor || "");
          setIntroduction(p.introduction || "");
          setBiography(
            Array.isArray(p.biography) && p.biography.length
              ? p.biography
              : [""]
          );
          setLocation(p.location || "");
          setAvailability(p.availability || "");
          setResumeUrl(p.resumeUrl || "");
          setContactEmail(p.contactEmail || "");
          if (p.portrait) setPortrait(p.portrait);
          if (p.primaryCta) setPrimaryCta(p.primaryCta);
          if (p.secondaryCta) setSecondaryCta(p.secondaryCta);
          setVersion(p.version || 1);
        }
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  }

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
      const payload = {
        name,
        descriptor,
        introduction,
        biography: biography.map((b) => b.trim()).filter(Boolean),
        location: location.trim() || null,
        availability: availability.trim() || null,
        resumeUrl: resumeUrl.trim() || null,
        contactEmail,
        portrait: portrait.src ? portrait : null,
        primaryCta: primaryCta.label ? primaryCta : null,
        secondaryCta: secondaryCta.label ? secondaryCta : null,
        version,
      };

      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        setConflictError(true);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save profile.");
      }

      const json = await res.json();
      setVersion(json.profile.version);
      setIsDirty(false);
      setSuccessMessage("Profile updated successfully.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Portfolio" },
        { label: "Profile" },
      ]}
      title="Profile & Bio"
      subtitle="Manage your identity, personal descriptor, hero introduction, and biography paragraphs."
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
      <div className="space-y-8 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 sm:p-8 shadow-xs">
        {/* Basic Identity */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[var(--text)] border-b border-[var(--border)] pb-2">
            Identity & Contact
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="profile-name"
                className="block text-xs font-semibold text-[var(--text)]"
              >
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => handleFieldChange(setName, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="profile-descriptor"
                className="block text-xs font-semibold text-[var(--text)]"
              >
                Professional Descriptor <span className="text-rose-500">*</span>
              </label>
              <input
                id="profile-descriptor"
                type="text"
                value={descriptor}
                onChange={(e) => handleFieldChange(setDescriptor, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="profile-email"
                className="block text-xs font-semibold text-[var(--text)]"
              >
                Contact Email <span className="text-rose-500">*</span>
              </label>
              <input
                id="profile-email"
                type="email"
                value={contactEmail}
                onChange={(e) => handleFieldChange(setContactEmail, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="profile-location"
                className="block text-xs font-semibold text-[var(--text)]"
              >
                Location
              </label>
              <input
                id="profile-location"
                type="text"
                value={location}
                onChange={(e) => handleFieldChange(setLocation, e.target.value)}
                placeholder="Portland, OR"
                className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="profile-availability"
                className="block text-xs font-semibold text-[var(--text)]"
              >
                Availability Status
              </label>
              <input
                id="profile-availability"
                type="text"
                value={availability}
                onChange={(e) => handleFieldChange(setAvailability, e.target.value)}
                placeholder="Available for select projects"
                className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
        </div>

        {/* Hero Introduction & Portrait */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[var(--text)] border-b border-[var(--border)] pb-2">
            Hero Introduction & Portrait
          </h2>

          <div className="space-y-1">
            <label
              htmlFor="profile-intro"
              className="block text-xs font-semibold text-[var(--text)]"
            >
              Hero Introduction Paragraph <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="profile-intro"
              rows={3}
              value={introduction}
              onChange={(e) => handleFieldChange(setIntroduction, e.target.value)}
              placeholder="Leading statement rendered in the hero section..."
              className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          {/* Portrait Image */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <div className="flex-1 space-y-3">
              <label className="block text-xs font-semibold text-[var(--text)]">
                Portrait Photo
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={portrait.src}
                  onChange={(e) =>
                    handleFieldChange(setPortrait, { ...portrait, src: e.target.value })
                  }
                  placeholder="/images/portrait.jpg or https://..."
                  className="flex-1 px-3 py-1.5 text-sm font-mono bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPortraitPicker(true)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--muted)]/10 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Choose Image</span>
                </button>
              </div>

              <input
                type="text"
                value={portrait.alt}
                onChange={(e) =>
                  handleFieldChange(setPortrait, { ...portrait, alt: e.target.value })
                }
                placeholder="Portrait alt text for screen readers"
                className="w-full px-3 py-1.5 text-xs bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            {portrait.src && (
              <div className="w-24 h-24 rounded-full border border-[var(--border)] overflow-hidden bg-[var(--muted)]/10 shrink-0">
                <img
                  src={portrait.src}
                  alt={portrait.alt}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Biography Paragraphs */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[var(--text)] border-b border-[var(--border)] pb-2">
            Biography Paragraphs (About Section)
          </h2>

          <div className="space-y-3">
            {biography.map((para, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <textarea
                  rows={3}
                  value={para}
                  onChange={(e) => {
                    const next = [...biography];
                    next[idx] = e.target.value;
                    handleFieldChange(setBiography, next);
                  }}
                  placeholder={`Paragraph ${idx + 1}...`}
                  className="flex-1 px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = biography.filter((_, i) => i !== idx);
                    handleFieldChange(setBiography, next.length ? next : [""]);
                  }}
                  className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded transition-colors mt-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => handleFieldChange(setBiography, [...biography, ""])}
              className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Paragraph</span>
            </button>
          </div>
        </div>

        {/* CTA Buttons & Resume */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[var(--text)] border-b border-[var(--border)] pb-2">
            Call to Action Buttons & Resume
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/5">
              <span className="text-xs font-semibold text-[var(--text)]">
                Primary Call to Action
              </span>
              <input
                type="text"
                value={primaryCta.label}
                onChange={(e) =>
                  handleFieldChange(setPrimaryCta, { ...primaryCta, label: e.target.value })
                }
                placeholder="Button Label (e.g. Explore My Highlights)"
                className="w-full px-3 py-1.5 text-xs bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
              />
              <input
                type="text"
                value={primaryCta.href}
                onChange={(e) =>
                  handleFieldChange(setPrimaryCta, { ...primaryCta, href: e.target.value })
                }
                placeholder="Link Target (e.g. #highlights)"
                className="w-full px-3 py-1.5 text-xs bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
              />
            </div>

            <div className="space-y-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/5">
              <span className="text-xs font-semibold text-[var(--text)]">
                Secondary Call to Action
              </span>
              <input
                type="text"
                value={secondaryCta.label}
                onChange={(e) =>
                  handleFieldChange(setSecondaryCta, {
                    ...secondaryCta,
                    label: e.target.value,
                  })
                }
                placeholder="Button Label (e.g. Contact Me)"
                className="w-full px-3 py-1.5 text-xs bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
              />
              <input
                type="text"
                value={secondaryCta.href}
                onChange={(e) =>
                  handleFieldChange(setSecondaryCta, {
                    ...secondaryCta,
                    href: e.target.value,
                  })
                }
                placeholder="Link Target (e.g. #contact)"
                className="w-full px-3 py-1.5 text-xs bg-transparent border border-[var(--border)] rounded-md text-[var(--text)]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="profile-resume"
              className="block text-xs font-semibold text-[var(--text)]"
            >
              Resume Document URL / Path
            </label>
            <input
              id="profile-resume"
              type="text"
              value={resumeUrl}
              onChange={(e) => handleFieldChange(setResumeUrl, e.target.value)}
              placeholder="/documents/sareyboth-resume.pdf"
              className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
        </div>
      </div>

      {showPortraitPicker && (
        <MediaPicker
          isOpen={true}
          onClose={() => setShowPortraitPicker(false)}
          onSelect={(media: SelectedMedia) => {
            handleFieldChange(setPortrait, {
              src: media.src,
              alt: media.alt || name || "Profile portrait",
            });
          }}
          initialAlt={portrait.alt || name}
        />
      )}
    </FormLayout>
  );
}

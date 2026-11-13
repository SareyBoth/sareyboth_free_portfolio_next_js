"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ColorMode, NavItem } from "@/types/portfolio";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function SiteHeader({
  profileName,
  navItems,
  showJournalRouteLink = false,
  isPreview = false,
  previewColorMode,
  onPreviewColorModeChange,
}: {
  profileName: string;
  navItems: NavItem[];
  showJournalRouteLink?: boolean;
  isPreview?: boolean;
  previewColorMode?: ColorMode;
  onPreviewColorModeChange?: (mode: ColorMode) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        toggleButtonRef.current?.focus();
        return;
      }

      if (event.key === "Tab" && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const closeMenuAndRestoreFocus = () => {
    setMenuOpen(false);
  };

  const brandHref = isPreview ? "#home" : "/";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1160px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 min-w-0">
          {isPreview ? (
            <a
              href={brandHref}
              className="font-heading text-lg font-semibold tracking-tight text-[var(--text-primary)] truncate"
            >
              {profileName}
            </a>
          ) : (
            <Link
              href={brandHref}
              className="font-heading text-lg font-semibold tracking-tight text-[var(--text-primary)] truncate"
            >
              {profileName}
            </Link>
          )}
        </div>

        {/* Desktop navigation */}
        <nav
          aria-label="Primary"
          className="hidden lg:flex items-center flex-wrap gap-1"
        >
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="px-2.5 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors truncate max-w-[160px]"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              {item.label}
            </a>
          ))}
          {showJournalRouteLink && !isPreview && (
            <Link
              href="/journal"
              className="px-2.5 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              All Articles
            </Link>
          )}
        </nav>

        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <ThemeToggle
            controlledMode={previewColorMode}
            onSelectMode={onPreviewColorModeChange}
          />
          {!isPreview && (
            <Link
              href="/customize"
              className="px-3 py-1.5 text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
              style={{ borderRadius: "var(--radius-md)" }}
            >
              Customize
            </Link>
          )}
        </div>

        {/* Mobile / Tablet controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            ref={toggleButtonRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation-drawer"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex items-center justify-center p-2 text-sm font-medium border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
            style={{ borderRadius: "var(--radius-md)", minWidth: "40px", minHeight: "40px" }}
          >
            <span className="sr-only">
              {menuOpen ? "Close navigation menu" : "Open navigation menu"}
            </span>
            {menuOpen ? (
              <svg
                aria-hidden="true"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {menuOpen && (
        <div
          id="mobile-navigation-drawer"
          ref={drawerRef}
          role="region"
          aria-label="Mobile navigation"
          className="lg:hidden border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 pt-3 pb-5 sm:px-6"
        >
          <nav aria-label="Mobile primary" className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={closeMenuAndRestoreFocus}
                className="px-3 py-2.5 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                style={{ borderRadius: "var(--radius-sm)" }}
              >
                {item.label}
              </a>
            ))}
            {showJournalRouteLink && !isPreview && (
              <Link
                href="/journal"
                onClick={closeMenuAndRestoreFocus}
                className="px-3 py-2.5 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                style={{ borderRadius: "var(--radius-sm)" }}
              >
                All Articles
              </Link>
            )}
          </nav>

          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
            <ThemeToggle
              controlledMode={previewColorMode}
              onSelectMode={onPreviewColorModeChange}
            />
            {!isPreview && (
              <Link
                href="/customize"
                onClick={closeMenuAndRestoreFocus}
                className="px-3.5 py-2 text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-primary)]"
                style={{ borderRadius: "var(--radius-md)" }}
              >
                Customize Theme
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

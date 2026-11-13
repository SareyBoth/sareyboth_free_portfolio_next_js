import React from "react";
import Link from "next/link";
import type { NavItem, SocialLink } from "@/types/portfolio";

export function SiteFooter({
  profileName,
  descriptor,
  navItems,
  socialLinks,
  isPreview = false,
}: {
  profileName: string;
  descriptor: string;
  navItems: NavItem[];
  socialLinks: SocialLink[];
  isPreview?: boolean;
}) {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] mt-auto">
      <div className="mx-auto max-w-[1160px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-2">
            <p className="font-heading text-lg font-semibold text-[var(--text-primary)]">
              {profileName}
            </p>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              {descriptor}
            </p>
          </div>

          <div className="flex flex-wrap gap-8 sm:gap-12">
            {navItems.length > 0 && (
              <nav aria-label="Footer navigation" className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Sections
                </p>
                <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  {navItems.map((item) => (
                    <li key={item.id}>
                      <a
                        href={item.href}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {socialLinks.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Elsewhere
                </p>
                <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  {socialLinks.map((social) => (
                    <li key={`${social.platform}-${social.url}`}>
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline decoration-[var(--border-strong)] underline-offset-4 transition-colors"
                      >
                        {social.platform}
                        {isPreview ? " (External)" : ""}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-[var(--text-muted)]">
          <p>
            &copy; {profileName}. Built with the SareyBothPortfolio template.
          </p>
          {!isPreview && (
            <p>
              <Link
                href="/customize"
                className="underline decoration-[var(--border-strong)] underline-offset-4 hover:text-[var(--text-primary)]"
              >
                Open local theme customizer
              </Link>
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  LayoutDashboard,
  User,
  Sliders,
  Sparkles,
  Zap,
  Milestone,
  Award,
  MessageSquareQuote,
  Briefcase,
  Heart,
  Image as ImageIcon,
  BookOpen,
  FolderTree,
  Tag,
  Film,
  Mail,
  Contact,
  Palette,
  Globe,
  PanelBottom,
  Type,
  UserCog,
  Users,
  Database,
  History,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  ownerOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Portfolio",
    items: [
      { label: "Profile", href: "/dashboard/profile", icon: User },
      { label: "Sections", href: "/dashboard/sections", icon: Sliders },
      { label: "Highlights", href: "/dashboard/highlights", icon: Sparkles },
      { label: "Strengths", href: "/dashboard/strengths", icon: Zap },
      { label: "Journey", href: "/dashboard/journey", icon: Milestone },
      { label: "Achievements", href: "/dashboard/achievements", icon: Award },
      { label: "Testimonials", href: "/dashboard/testimonials", icon: MessageSquareQuote },
      { label: "Services", href: "/dashboard/services", icon: Briefcase },
      { label: "Interests", href: "/dashboard/interests", icon: Heart },
      { label: "Gallery", href: "/dashboard/gallery", icon: ImageIcon },
    ],
  },
  {
    title: "Publishing",
    items: [
      { label: "Journal", href: "/dashboard/articles", icon: BookOpen },
      { label: "Categories", href: "/dashboard/highlight-categories", icon: FolderTree },
      { label: "Tags", href: "/dashboard/tags", icon: Tag },
      { label: "Media Library", href: "/dashboard/media", icon: Film },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Messages", href: "/dashboard/messages", icon: Mail },
      { label: "Contact Settings", href: "/dashboard/contact-settings", icon: Contact },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Appearance", href: "/dashboard/appearance", icon: Palette },
      { label: "Site Settings", href: "/dashboard/site-settings", icon: Globe },
      { label: "Footer", href: "/dashboard/footer", icon: PanelBottom },
      { label: "Labels & Copy", href: "/dashboard/labels", icon: Type },
      { label: "Account", href: "/dashboard/account", icon: UserCog },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Users & Staff", href: "/dashboard/users", icon: Users, ownerOnly: true },
      { label: "Data Tools", href: "/dashboard/data", icon: Database, ownerOnly: true },
      { label: "Audit Log", href: "/dashboard/audit", icon: History, ownerOnly: true },
    ],
  },
];

export function DashboardShell({
  user,
  children,
}: {
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isOwner = (user.role ?? "EDITOR").toUpperCase() === "OWNER";
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);

  // Close drawer on path change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Handle escape & focus containment in mobile drawer
  useEffect(() => {
    if (!drawerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        toggleBtnRef.current?.focus();
        return;
      }

      if (e.key === "Tab" && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  // Generate breadcrumb items from pathname
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const label =
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    return { label, href };
  });

  const renderNavContent = () => (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-6 py-4">
        {NAV_GROUPS.map((group) => {
          // If group is owner-only and user is not owner, skip
          const visibleItems = group.items.filter(
            (item) => !item.ownerOnly || isOwner
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                        }`}
                        style={{ borderRadius: "var(--radius-sm)" }}
                      >
                        <Icon size={20} className="shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-[var(--border-subtle)] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--text-muted)]">Appearance</span>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
              {user.name}
            </p>
            <p className="text-[11px] text-[var(--accent)] font-medium uppercase tracking-wider">
              {user.role ?? "EDITOR"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            aria-label="Sign out"
            className="p-1.5 text-[var(--text-muted)] hover:text-red-600 transition-colors cursor-pointer rounded"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* Desktop Sidebar (248px) */}
      <aside
        aria-label="Sidebar navigation"
        className="hidden lg:flex flex-col w-[248px] shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] sticky top-0 h-screen overflow-y-auto"
      >
        <div className="flex items-center justify-between px-4 h-[64px] border-b border-[var(--border-subtle)]">
          <Link
            href="/dashboard"
            className="font-heading text-lg font-bold tracking-tight text-[var(--text-primary)]"
          >
            SareyBothPortfolio CMS
          </Link>
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-[var(--accent-soft)] text-[var(--accent-soft-text)] rounded">
            v1.0
          </span>
        </div>
        <div className="flex-1 px-2">{renderNavContent()}</div>
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Dashboard navigation menu"
          className="lg:hidden fixed inset-0 z-50 flex"
        >
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            ref={drawerRef}
            className="relative flex flex-col w-[280px] max-w-[85%] bg-[var(--bg-surface)] h-full border-r border-[var(--border-subtle)] shadow-xl z-10 overflow-y-auto"
          >
            <div className="flex items-center justify-between px-4 h-[64px] border-b border-[var(--border-subtle)]">
              <span className="font-heading text-lg font-bold text-[var(--text-primary)]">
                SareyBothPortfolio CMS
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 px-3">{renderNavContent()}</div>
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar (64px) */}
        <header className="h-[64px] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <button
              ref={toggleBtnRef}
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              className="lg:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-md"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="min-w-0 hidden sm:flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={crumb.href}>
                    {idx > 0 && <ChevronRight size={14} className="shrink-0 text-[var(--border-strong)]" />}
                    {isLast ? (
                      <span className="font-semibold text-[var(--text-primary)] truncate">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="hover:text-[var(--text-primary)] transition-colors truncate"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
              style={{ borderRadius: "var(--radius-md)" }}
            >
              <span>View Portfolio</span>
              <ExternalLink size={14} />
            </Link>

            <Link
              href="/preview"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--accent-soft)] text-[var(--accent-soft-text)] hover:opacity-90 transition-opacity"
              style={{ borderRadius: "var(--radius-md)" }}
            >
              <span>Preview Draft</span>
            </Link>
          </div>
        </header>

        {/* Page Main Content Area */}
        <main
          id="dashboard-main"
          className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto"
        >
          <div className="mx-auto max-w-[1160px] w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

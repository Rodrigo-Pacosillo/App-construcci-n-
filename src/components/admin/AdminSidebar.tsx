"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  FileText,
  Users,
  FileCheck,
  HardHat,
  FolderOpen,
  Wrench,
  MessageSquare,
  Award,
  HelpCircle,
  UserCog,
  Package,
  type LucideIcon,
} from "lucide-react";
import { ADMIN_NAV_SECTIONS, type NavSection, type NavItem } from "@/lib/constants";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  FileText,
  Users,
  FileCheck,
  HardHat,
  FolderOpen,
  Wrench,
  MessageSquare,
  Award,
  HelpCircle,
  UserCog,
  Package,
};

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

interface SectionState {
  isExpanded: boolean;
}

function SidebarFooter({ email }: { email: string }) {
  return (
    <div className="border-t border-border p-4">
      <p className="truncate text-xs text-ink-faint">{email}</p>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-2 flex w-full items-center gap-3 rounded px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Salir
      </button>
    </div>
  );
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = ICONS[item.icon];
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-ink/5 font-medium text-ink"
          : "text-ink-muted hover:bg-ink/5 hover:text-ink"
      }`}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      {item.label}
    </Link>
  );
}

interface NavSectionsProps {
  pathname: string;
  onNavigate?: () => void;
  sectionStates?: Record<string, SectionState>;
  toggleSection?: (sectionId: string) => void;
}

function NavSections({
  pathname,
  onNavigate,
  sectionStates,
  toggleSection,
}: NavSectionsProps) {
  return (
    <div className="space-y-6">
      {ADMIN_NAV_SECTIONS.map((section) => {
        const state = sectionStates?.[section.id];
        const isExpanded = state?.isExpanded ?? true;

        return (
          <div key={section.id} className="accordion-item">
            <button
              type="button"
              className={`flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors hover:bg-ink/5 cursor-pointer w-full justify-between ${
                isExpanded
                  ? "text-ink font-medium"
                  : "text-ink-muted"
              }`}
              onClick={() => toggleSection?.(section.id)}
            >
              <span className="flex items-center gap-2">
                <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                  {section.label}
                </p>
                {isExpanded ? (
                  <svg
                    className="h-4 w-4 shrink-0 rotate-180 text-ink-faint"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4 shrink-0 text-ink-faint"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M9 16l7-7 7 7" />
                  </svg>
                )}
              </span>
              <span className="hidden md:block">{section.label}</span>
            </button>
            {isExpanded && (
              <div className="space-y-1 pt-2">
                {section.items.map((item) => (
                  <NavLink
                    key={item.id}
                    item={item}
                    active={isActive(pathname, item.href)}
                    onClick={onNavigate}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function AdminSidebar({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Initialize section states: all expanded by default
  const [sectionStates, setSectionStates] = useState<
    Record<string, SectionState>
  >(
    Object.fromEntries(
      ADMIN_NAV_SECTIONS.map((section) => [section.id, { isExpanded: true }])
    )
  );

  return (
    <>
      {/* Mobile header */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <Link href="/admin" className="font-heading text-lg font-bold">
          ADMIN
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 items-center justify-center rounded border border-border"
          aria-label="Menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        >
          <nav
            className="absolute left-0 top-0 flex h-full w-64 flex-col bg-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-12 shrink-0 items-center border-b border-border px-4">
              <Link
                href="/admin"
                className="font-heading text-lg font-bold"
                onClick={() => setOpen(false)}
              >
                ADMIN
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <NavSections
                pathname={pathname}
                onNavigate={() => setOpen(false)}
                sectionStates={sectionStates}
                toggleSection={(id) => {
                  setSectionStates((prev) => {
                    const newStates = { ...prev };
                    newStates[id].isExpanded = !newStates[id].isExpanded;
                    return newStates;
                  });
                }}
              />
            </div>
            <div className="shrink-0">
              <SidebarFooter email={email} />
            </div>
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex"
      >
        <div className="flex h-16 shrink-0 items-center border-b border-border px-6">
          <Link href="/admin" className="font-heading text-lg font-bold">
            ADMIN
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          <NavSections
            pathname={pathname}
            sectionStates={sectionStates}
            toggleSection={(id) => {
              setSectionStates((prev) => {
                const newStates = { ...prev };
                newStates[id].isExpanded = !newStates[id].isExpanded;
                return newStates;
              });
            }}
          />
        </nav>
        <div className="shrink-0">
          <SidebarFooter email={email} />
        </div>
      </aside>
    </>
  );
}

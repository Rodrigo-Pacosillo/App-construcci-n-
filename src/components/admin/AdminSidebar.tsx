"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  FileText,
  FolderOpen,
  HardHat,
  MessageSquare,
  Wrench,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { ADMIN_NAV_ITEMS } from "@/lib/constants";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  FileText,
  FolderOpen,
  HardHat,
  MessageSquare,
  Wrench,
  HelpCircle,
};

function SidebarFooter({ email }: { email: string }) {
  return (
    <div className="border-t border-border p-4">
      <p className="truncate text-xs text-ink/40">{email}</p>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-2 flex w-full items-center gap-3 rounded px-3 py-2 text-sm text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Salir
      </button>
    </div>
  );
}

export function AdminSidebar({ email }: { email: string }) {
  const [open, setOpen] = useState(false);

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
              <Link href="/admin" className="font-heading text-lg font-bold" onClick={() => setOpen(false)}>
                ADMIN
              </Link>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto p-4">
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = ICONS[item.icon];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded px-3 py-2 text-sm text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="shrink-0">
              <SidebarFooter email={email} />
            </div>
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-border px-6">
          <Link href="/admin" className="font-heading text-lg font-bold">
            ADMIN
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded px-3 py-2 text-sm text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0">
          <SidebarFooter email={email} />
        </div>
      </aside>
    </>
  );
}

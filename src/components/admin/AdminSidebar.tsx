"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ADMIN_NAV_ITEMS } from "@/lib/constants";

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
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)}>
          <nav className="absolute left-0 top-0 h-full w-64 bg-surface p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-12 items-center border-b border-border">
              <Link href="/admin" className="font-heading text-lg font-bold" onClick={() => setOpen(false)}>
                ADMIN
              </Link>
            </div>
            <div className="mt-4 space-y-1">
              {ADMIN_NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded px-3 py-2 text-sm text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  <span className="text-xs text-ink/30">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="absolute bottom-0 left-0 w-64 border-t border-border p-4">
              <p className="text-xs text-ink/40">
                {email}
              </p>
            </div>
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/admin" className="font-heading text-lg font-bold">
            ADMIN
          </Link>
        </div>
        <nav className="p-4">
          {ADMIN_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded px-3 py-2 text-sm text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <span className="text-xs text-ink/30">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-64 border-t border-border p-4">
          <p className="text-xs text-ink/40">
            {email}
          </p>
        </div>
      </aside>
    </>
  );
}

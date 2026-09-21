"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  MessageSquare,
  Wrench,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Resumen", href: "/cliente", icon: LayoutDashboard },
  { id: "cotizaciones", label: "Mis cotizaciones", href: "/cliente/cotizaciones", icon: FileText },
  { id: "contratos", label: "Mis contratos", href: "/cliente/contratos", icon: Wrench },
  { id: "proyectos", label: "Mis proyectos", href: "/cliente/proyectos", icon: FolderOpen },
  { id: "obra", label: "Mi obra", href: "/cliente/obra", icon: MessageSquare },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function ClienteSidebar({ email }: { email: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <Link href="/cliente" className="font-heading text-lg font-bold">
          MI CUENTA
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 items-center justify-center rounded border border-border"
          aria-label="Menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <div className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-border px-6">
          <Link href="/cliente" className="font-heading text-lg font-bold">
            MI CUENTA
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          <NavLinks />
        </nav>
        <div className="shrink-0 border-t border-border p-4">
          <p className="truncate text-xs text-ink-faint">{email}</p>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-2 flex w-full items-center gap-3 rounded px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Salir
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      >
        <nav
          className="absolute left-0 top-0 h-full w-64 flex-col bg-surface p-4 transition-transform lg:hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-12 shrink-0 items-center border-b border-border px-4">
            <Link href="/cliente" className="font-heading text-lg font-bold">
              MI CUENTA
            </Link>
          </div>
          <div className="mt-4 space-y-1 overflow-y-auto">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
          <div className="shrink-0 border-t border-border p-4">
            <p className="truncate text-xs text-ink-faint">{email}</p>
            <button
              onClick={() => {
                signOut({ callbackUrl: "/" });
                setOpen(false);
              }}
              className="mt-2 flex w-full items-center gap-3 rounded px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Salir
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}

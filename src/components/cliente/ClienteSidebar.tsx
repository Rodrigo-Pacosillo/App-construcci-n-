"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Wrench,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  FileCheck,
  DollarSign,
  FileText as FileTextIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = 
  | { id: string; label: string; href: string; icon: LucideIcon; children?: never }
  | { id: string; label: string; icon: LucideIcon; children: { id: string; label: string; href: string; icon: LucideIcon }[] };

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Resumen", href: "/cliente", icon: LayoutDashboard },
  { id: "obra", label: "Mi obra", icon: MessageSquare, children: [
    { id: "avance", label: "Avance", href: "/cliente/avance", icon: FileCheck },
    { id: "pagos", label: "Pagos", href: "/cliente/pagos", icon: DollarSign },
    { id: "documentos", label: "Documentos", href: "/cliente/documentos", icon: FileTextIcon },
  ]},
  { id: "cotizaciones", label: "Mis cotizaciones", href: "/cliente/cotizaciones", icon: FileText },
  { id: "contratos", label: "Mis contratos", href: "/cliente/contratos", icon: Wrench },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const [expanded, setExpanded] = useState<string | null>("obra");

  return (
    <>
      {NAV_ITEMS.map((item) => {
        if (item.children) {
          const isExpanded = expanded === item.id;
          return (
            <div key={item.id}>
              <button
                onClick={() => setExpanded(isExpanded ? null : item.id)}
                className="flex items-center justify-between w-full rounded px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <span className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-ink-faint" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
                )}
              </button>
              {isExpanded && (
                <div className="mt-1 ml-7 space-y-1 border-l border-border pl-3">
                  {item.children.map((child) => (
                    <Link
                      key={child.id}
                      href={child.href}
                      onClick={onNavigate}
                      className="flex items-center gap-2 rounded px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
                    >
                      <child.icon className="h-3.5 w-3.5 shrink-0" />
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }
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

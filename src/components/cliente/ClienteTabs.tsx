"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  MessageSquare,
  Wrench,
} from "lucide-react";

const TABS = [
  { id: "dashboard", label: "Resumen", icon: LayoutDashboard },
  { id: "cotizaciones", label: "Mis cotizaciones", icon: FileText },
  { id: "contratos", label: "Mis contratos", icon: Wrench },
  { id: "proyectos", label: "Mis proyectos", icon: FolderOpen },
  { id: "obra", label: "Mi obra", icon: MessageSquare },
] as const;

export function ClienteTabs() {
  const pathname = usePathname();

  const isActive = (tabId: string) =>
    pathname === `/cliente/${tabId}` || (tabId === "dashboard" && pathname === "/cliente");

  return (
    <div className="border-b border-border bg-surface p-4 lg:p-6">
      <p className="section-label mb-3 text-ink/40">SECCIONES</p>
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActiveTab = isActive(tab.id);
          return (
            <Link
              key={tab.id}
              href={tab.id === "dashboard" ? "/cliente" : `/cliente/${tab.id}`}
              className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors ${
                isActiveTab
                  ? "bg-ink/5 text-ink"
                  : "text-ink/60 hover:bg-ink/5 hover:text-ink"
              }`}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const VARIANTES = {
  neutral: "bg-ink/5 text-ink-muted",
  info: "bg-blue-100 text-blue-800",
  warning: "bg-yellow-100 text-yellow-800",
  success: "bg-green-100 text-green-800",
  danger: "bg-red-100 text-red-800",
  accent: "bg-orange-100 text-orange-800",
} as const;

export type BadgeVariante = keyof typeof VARIANTES;

/**
 * Etiqueta de estado. No depende solo del color (§4.2):
 * el texto siempre es visible.
 */
export function Badge({
  children,
  variante = "neutral",
  className,
}: {
  children: ReactNode;
  variante?: BadgeVariante;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-1 text-xs font-medium",
        VARIANTES[variante],
        className
      )}
    >
      {children}
    </span>
  );
}

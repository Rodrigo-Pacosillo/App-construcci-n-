import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const VARIANTES = {
  primary: "bg-ink text-white hover:opacity-90",
  secondary: "border border-border text-ink hover:border-accent",
  accent: "bg-accent text-ink hover:opacity-90",
  danger: "bg-red-600 text-white hover:bg-red-700",
} as const;

export type ButtonVariante = keyof typeof VARIANTES;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: ButtonVariante;
  children: ReactNode;
};

export function Button({ variante = "primary", className, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={cn(
        "rounded px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
        VARIANTES[variante],
        className
      )}
    >
      {children}
    </button>
  );
}

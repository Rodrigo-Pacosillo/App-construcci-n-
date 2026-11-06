"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ESTADO_OBRA_LABELS } from "@/lib/constants";

interface Obra {
  id: string;
  direccionObra: string;
  estado: string;
}

interface Props {
  obras: Obra[];
  obraId?: string;
  className?: string;
}

export default function ObraSelector({ obras, obraId, className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (obras.length <= 1) return null;

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("obraId", value);
    else params.delete("obraId");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div
      className={
        className ??
        "rounded border border-border bg-surface p-4"
      }
    >
      <label
        htmlFor="obra-selector"
        className="section-label block text-ink-faint mb-2"
      >
        Seleccionar obra
      </label>
      <select
        id="obra-selector"
        value={obraId ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full max-w-xs rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
      >
        <option value="">-- Seleccione una obra --</option>
        {obras.map((o) => (
          <option key={o.id} value={o.id}>
            {o.direccionObra} (
            {ESTADO_OBRA_LABELS[o.estado as keyof typeof ESTADO_OBRA_LABELS] ??
              o.estado.replace(/_/g, " ")}
            )
          </option>
        ))}
      </select>
    </div>
  );
}

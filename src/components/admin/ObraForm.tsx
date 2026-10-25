"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createObra } from "@/app/admin/(panel)/obras/actions";
import {
  ESTADO_OBRA_LABELS,
  ESTADOS_OBRA,
} from "@/lib/constants";

export type ClienteOption = { id: string; nombre: string; apellidos: string };
export type ContratoOption = {
  id: string;
  montoTotal: number;
  clienteNombre: string;
};

/**
 * Formulario de alta de obra (§8.3). Se usa en /admin/obras/new y
 * como formulario en línea en la lista. Valida en servidor vía
 * `obraSchema`, que exige progreso entero entre 0 y 100.
 */
export function ObraForm({
  clientes,
  contratos,
  clienteIdInicial,
  onSuccess,
}: {
  clientes: ClienteOption[];
  contratos: ContratoOption[];
  clienteIdInicial?: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setError("");
    startTransition(async () => {
      const res = await createObra(formData);
      if (res?.success) {
        form.reset();
        onSuccess?.();
        router.refresh();
      } else {
        const err = (res && "error" in res ? res.error : null) as
          | { _form?: string[]; progreso?: string[]; clienteId?: string[] }
          | undefined;
        setError(
          err?._form?.[0] ??
            err?.progreso?.[0] ??
            err?.clienteId?.[0] ??
            "Error al crear la obra."
        );
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded border border-border bg-surface p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          name="clienteId"
          required
          defaultValue={clienteIdInicial ?? ""}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="" disabled>
            Cliente
          </option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} {c.apellidos}
            </option>
          ))}
        </select>
        <select
          name="contratoId"
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          defaultValue=""
        >
          <option value="">Sin contrato</option>
          {contratos.map((ct) => (
            <option key={ct.id} value={ct.id}>
              {ct.clienteNombre} — ${ct.montoTotal.toLocaleString("es-AR")}
            </option>
          ))}
        </select>
      </div>
      <input
        name="direccionObra"
        required
        placeholder="Dirección de la obra"
        className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-ink-muted">
          Fecha de inicio
          <input
            name="fechaInicio"
            type="date"
            required
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="text-sm text-ink-muted">
          Fecha estimada de finalización
          <input
            name="fechaFinEstimada"
            type="date"
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          name="estado"
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          defaultValue="en_curso"
        >
          {ESTADOS_OBRA.map((s) => (
            <option key={s} value={s}>
              {ESTADO_OBRA_LABELS[s]}
            </option>
          ))}
        </select>
        <input
          name="progreso"
          type="number"
          min={0}
          max={100}
          step={1}
          defaultValue={0}
          placeholder="Progreso (0-100)"
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="accent-btn rounded px-4 py-2 text-xs font-medium"
      >
        {isPending ? "Creando..." : "Crear obra"}
      </button>
    </form>
  );
}

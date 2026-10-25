"use client";

import { useState, useTransition } from "react";
import {
  toggleProyectoPublicado,
  toggleProyectoDestacado,
  deleteProyecto,
} from "@/app/admin/(panel)/proyectos/actions";

type Proyecto = {
  id: string;
  titulo: string;
  slug: string;
  tipoConstruccion: string;
  m2Construidos: number;
  diasEjecucion: number;
  ubicacion: string;
  publicado: boolean;
  destacado: boolean;
  creadoEn: Date;
};

export function ProyectosList({ proyectos }: { proyectos: Proyecto[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este proyecto?")) return;
    startTransition(async () => {
      const res = await deleteProyecto(id);
      if (res && !res.success) setError("No se pudo eliminar el proyecto.");
    });
  }

  return (
    <div className="rounded border border-border bg-surface">
      {error && (
        <p className="border-b border-border px-4 py-2 text-sm text-red-500">{error}</p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 section-label text-ink-faint">Proyecto</th>
              <th className="px-4 py-3 section-label text-ink-faint">Tipo</th>
              <th className="px-4 py-3 section-label text-ink-faint">M2</th>
              <th className="px-4 py-3 section-label text-ink-faint">Dias</th>
              <th className="px-4 py-3 section-label text-ink-faint">Publicado</th>
              <th className="px-4 py-3 section-label text-ink-faint">Destacado</th>
              <th className="px-4 py-3 section-label text-ink-faint">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proyectos.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{p.titulo}</p>
                  <p className="text-xs text-ink-faint">{p.ubicacion}</p>
                </td>
                <td className="px-4 py-3 capitalize text-ink-muted">{p.tipoConstruccion}</td>
                <td className="px-4 py-3 text-ink-muted">{p.m2Construidos}</td>
                <td className="px-4 py-3 text-ink-muted">{p.diasEjecucion}</td>
                <td className="px-4 py-3">
<button
                      type="button"
                      onClick={() => startTransition(async () => {
                        const res = await toggleProyectoPublicado(p.id);
                        if (res && !res.success) setError("No se pudo actualizar el proyecto.");
                      })}
                      disabled={isPending}
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      p.publicado ? "bg-accent text-ink" : "border border-border bg-surface text-ink-faint"
                    }`}
                  >
                    {p.publicado ? "Si" : "No"}
                  </button>
                </td>
                <td className="px-4 py-3">
<button
                      type="button"
                      onClick={() => startTransition(async () => {
                        const res = await toggleProyectoDestacado(p.id);
                        if (res && !res.success) setError("No se pudo actualizar el proyecto.");
                      })}
                      disabled={isPending}
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      p.destacado ? "bg-accent text-ink" : "border border-border bg-surface text-ink-faint"
                    }`}
                  >
                    {p.destacado ? "Si" : "No"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    disabled={isPending}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {proyectos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-faint">
                  No hay proyectos aun
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

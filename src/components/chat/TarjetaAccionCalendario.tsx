"use client";

import { useState } from "react";
import { CalendarDays, Check, Loader2, X } from "lucide-react";

/**
 * Resumen que la herramienta de IA devuelve al proponer una acción de
 * calendario. Lo construye el servidor (`/api/chat`) con el nombre del
 * cliente ya resuelto y la obra que el resolver determinista eligió.
 *
 * La tarjeta es la red de seguridad: el admin ve a qué obra cuelga la nota
 * y si el cliente la verá ANTES de confirmar.
 */
export type AccionCalendarioPendiente = {
  accionId: string;
  tipo: "nota" | "visita";
  titulo: string;
  clienteNombre: string;
  obraEtiqueta: string | null;
  obraEstado: string | null;
  fechaInicio: string;
  fechaFin?: string | null;
  todoElDia: boolean;
  visibleCliente: boolean;
};

const ETIQUETA_ESTADO: Record<string, string> = {
  en_curso: "En ejecución",
  pausada: "Pausada",
  finalizada: "Finalizada",
  entregada: "Entregada",
};

function formatearFecha(iso: string, todoElDia: boolean): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  if (todoElDia) {
    return fecha.toLocaleDateString("es", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }
  return fecha.toLocaleString("es", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  accion: AccionCalendarioPendiente;
  resuelto?: { exito: boolean; mensaje?: string };
  onFinalizada: (accionId: string, exito: boolean, mensaje?: string) => void;
}

export function TarjetaAccionCalendario({
  accion,
  resuelto,
  onFinalizada,
}: Props) {
  const [enviando, setEnviando] = useState<"confirmar" | "rechazar" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const decidir = async (decision: "confirmar" | "rechazar") => {
    if (enviando) return;
    setEnviando(decision);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/chat-acciones/${accion.accionId}/${decision}`,
        { method: "POST" }
      );
      if (!res.ok) {
        let mensaje = "No se pudo completar la operación.";
        try {
          const body = await res.json();
          if (body?.error?.message) mensaje = body.error.message;
        } catch {
          // respuesta sin JSON: usar mensaje por defecto
        }
        setError(mensaje);
        setEnviando(null);
        return;
      }
      onFinalizada(
        accion.accionId,
        true,
        decision === "confirmar"
          ? "Acción confirmada y ejecutada."
          : "Acción rechazada."
      );
    } catch {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
      setEnviando(null);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-neutral-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-50">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-800 dark:text-amber-300">
        <CalendarDays size={14} />
        {accion.tipo === "nota" ? "Nota de calendario" : "Visita técnica"}
      </div>

      <dl className="mt-2 space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-neutral-500 dark:text-amber-200/70">
            Cliente
          </dt>
          <dd className="font-medium">{accion.clienteNombre}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-neutral-500 dark:text-amber-200/70">
            Obra
          </dt>
          <dd>
            {accion.obraEtiqueta ?? "Sin obra"}
            {accion.obraEstado && (
              <span className="ml-1 text-xs text-neutral-500 dark:text-amber-200/70">
                ({ETIQUETA_ESTADO[accion.obraEstado] ?? accion.obraEstado})
              </span>
            )}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-neutral-500 dark:text-amber-200/70">
            Fecha
          </dt>
          <dd>
            {formatearFecha(accion.fechaInicio, accion.todoElDia)}
            {accion.fechaFin && (
              <span className="text-neutral-500 dark:text-amber-200/70">
                {" "}
                → {formatearFecha(accion.fechaFin, accion.todoElDia)}
              </span>
            )}
            {accion.todoElDia && (
              <span className="ml-1 text-xs text-neutral-500 dark:text-amber-200/70">
                (todo el día)
              </span>
            )}
          </dd>
        </div>
        {accion.titulo && accion.tipo === "nota" && (
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-neutral-500 dark:text-amber-200/70">
              Asunto
            </dt>
            <dd>{accion.titulo}</dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-neutral-500 dark:text-amber-200/70">
            Visibilidad
          </dt>
          <dd>
            <span
              className={`inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                accion.visibleCliente
                  ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"
                  : "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200"
              }`}
            >
              {accion.visibleCliente
                ? "Visible para el cliente"
                : "Solo administrador"}
            </span>
          </dd>
        </div>
      </dl>

      {error && (
        <p className="mt-2 text-xs text-red-700 dark:text-red-300">{error}</p>
      )}

      {resuelto ? (
        <p
          className={`mt-3 text-xs font-semibold ${
            resuelto.exito
              ? "text-green-700 dark:text-green-300"
              : "text-red-700 dark:text-red-300"
          }`}
        >
          {resuelto.mensaje ??
            (resuelto.exito ? "Acción completada." : "Acción no completada.")}
        </p>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => decidir("confirmar")}
            disabled={enviando !== null}
            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            {enviando === "confirmar" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            Confirmar
          </button>
          <button
            type="button"
            onClick={() => decidir("rechazar")}
            disabled={enviando !== null}
            className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {enviando === "rechazar" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <X size={14} />
            )}
            Rechazar
          </button>
        </div>
      )}
    </div>
  );
}

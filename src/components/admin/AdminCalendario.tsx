"use client";

import { useState, useTransition } from "react";
import { crearEventoCalendario, eliminarEventoCalendario } from "@/app/admin/(panel)/calendario/actions";

const TIPO_LABEL: Record<string, string> = {
  nota: "Nota",
  recordatorio: "Recordatorio",
  inicio_etapa: "Inicio de etapa",
  fin_etapa: "Fin de etapa",
  entrega: "Entrega",
  reunion: "Reunión",
  otro: "Otro",
};

type Evento = {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  fechaInicio: string;
  fechaFin: string | null;
  todoElDia: boolean;
  visibleCliente: boolean;
  obraId: string | null;
  obraDireccion: string | null;
  clienteNombre: string | null;
};

type Obra = { id: string; direccionObra: string; clienteNombre: string };

const TIPOS = [
  { value: "nota", label: "Nota" },
  { value: "recordatorio", label: "Recordatorio" },
  { value: "inicio_etapa", label: "Inicio de etapa" },
  { value: "fin_etapa", label: "Fin de etapa" },
  { value: "entrega", label: "Entrega" },
  { value: "reunion", label: "Reunión" },
  { value: "otro", label: "Otro" },
];

function formatearFecha(iso: string, todoElDia: boolean): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  if (todoElDia) {
    return d.toLocaleDateString("es", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return d.toLocaleString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminCalendario({
  eventos: eventosIniciales,
  obras,
}: {
  eventos: Evento[];
  obras: Obra[];
}) {
  const [eventos, setEventos] = useState<Evento[]>(eventosIniciales);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  // Form state
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("nota");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [todoElDia, setTodoElDia] = useState(true);
  const [visibleCliente, setVisibleCliente] = useState(false);
  const [obraId, setObraId] = useState("");

  const resetForm = () => {
    setTitulo("");
    setDescripcion("");
    setTipo("nota");
    setFechaInicio("");
    setFechaFin("");
    setTodoElDia(true);
    setVisibleCliente(false);
    setObraId("");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);
    const fd = new FormData();
    fd.set("titulo", titulo);
    fd.set("descripcion", descripcion);
    fd.set("tipo", tipo);
    fd.set("fechaInicio", fechaInicio);
    fd.set("fechaFin", fechaFin);
    if (todoElDia) fd.set("todoElDia", "on");
    if (obraId && visibleCliente) fd.set("visibleCliente", "on");
    fd.set("obraId", obraId);

    startTransition(async () => {
      const res = await crearEventoCalendario(fd);
      if (!res.ok) {
        setError(res.error ?? "No se pudo crear el evento");
        return;
      }
      setOk("Evento creado correctamente.");
      resetForm();
      // Refrescar lista desde el servidor revalidando la ruta
      window.location.reload();
    });
  };

  const onEliminar = (id: string) => {
    if (!confirm("¿Eliminar este evento?")) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      const res = await eliminarEventoCalendario(fd);
      if (!res.ok) {
        setError(res.error ?? "No se pudo eliminar");
        return;
      }
      setEventos((prev) => prev.filter((ev) => ev.id !== id));
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Calendario</h1>
        <p className="mt-1 text-ink-muted">
          Eventos y notas del calendario de obras
        </p>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {ok && (
        <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {ok}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="rounded border border-border bg-surface p-4 space-y-4"
      >
        <p className="section-label text-ink-faint">NUEVO EVENTO</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Obra</label>
            <select
              value={obraId}
              onChange={(e) => {
                setObraId(e.target.value);
                if (!e.target.value) setVisibleCliente(false);
              }}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Sin obra (nota interna)</option>
              {obras.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.direccionObra} — {o.clienteNombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Fecha de inicio
            </label>
            <input
              type={todoElDia ? "date" : "datetime-local"}
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              required
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Fecha de fin (opcional)
            </label>
            <input
              type={todoElDia ? "date" : "datetime-local"}
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-4 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={todoElDia}
                onChange={(e) => setTodoElDia(e.target.checked)}
              />
              Todo el día
            </label>
            <label
              className={`flex items-center gap-2 text-sm ${
                !obraId ? "opacity-50" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={visibleCliente}
                onChange={(e) => setVisibleCliente(e.target.checked)}
                disabled={!obraId}
              />
              Visible para el cliente
              {!obraId && (
                <span className="text-xs text-ink-faint">
                  (requiere una obra)
                </span>
              )}
            </label>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pendiente}
            className="rounded bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {pendiente ? "Guardando..." : "Crear evento"}
          </button>
        </div>
      </form>

      <div>
        <p className="section-label text-ink-faint mb-2">
          EVENTOS ({eventos.length})
        </p>
        {eventos.length === 0 ? (
          <p className="text-sm text-ink-muted">No hay eventos registrados.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 section-label text-ink-faint">Fecha</th>
                  <th className="px-4 py-3 section-label text-ink-faint">Tipo</th>
                  <th className="px-4 py-3 section-label text-ink-faint">Título</th>
                  <th className="px-4 py-3 section-label text-ink-faint">Obra / Cliente</th>
                  <th className="px-4 py-3 section-label text-ink-faint">Visible</th>
                  <th className="px-4 py-3 section-label text-ink-faint">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatearFecha(e.fechaInicio, e.todoElDia)}
                    </td>
                    <td className="px-4 py-3">
                      {TIPO_LABEL[e.tipo] ?? e.tipo}
                    </td>
                    <td className="px-4 py-3 font-medium">{e.titulo}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {e.obraDireccion ?? "Sin obra (interna)"}
                      {e.clienteNombre && (
                        <span className="block text-xs">
                          {e.clienteNombre}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {e.visibleCliente ? "Sí" : "No"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onEliminar(e.id)}
                        disabled={pendiente}
                        className="text-xs text-red-600 hover:underline disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

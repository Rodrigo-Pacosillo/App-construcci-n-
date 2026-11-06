"use client";

import { useMemo, useState, useTransition } from "react";
import {
  crearEventoCalendario,
  actualizarEventoCalendario,
  eliminarEventoCalendario,
  alternarEventoVisible,
} from "@/app/admin/(panel)/calendario/actions";

export type EventoAdmin = {
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
  clienteId: string | null;
  clienteNombre: string | null;
  creadoPor: string | null;
};

export type ObraOpcion = {
  id: string;
  direccionObra: string;
  clienteId: string;
  clienteNombre: string;
};

const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const TIPO_LABEL: Record<string, string> = {
  nota: "Nota",
  recordatorio: "Recordatorio",
  inicio_etapa: "Inicio de etapa",
  fin_etapa: "Fin de etapa",
  entrega: "Entrega",
  reunion: "Reunión",
  otro: "Otro",
};

const TIPO_COLOR: Record<string, string> = {
  nota: "bg-ink/10 text-ink border-ink/20",
  recordatorio: "bg-amber-50 text-amber-700 border-amber-200/50",
  inicio_etapa: "bg-green-50 text-green-700 border-green-200/50",
  fin_etapa: "bg-blue-50 text-blue-700 border-blue-200/50",
  entrega: "bg-purple-50 text-purple-700 border-purple-200/50",
  reunion: "bg-indigo-50 text-indigo-700 border-indigo-200/50",
  otro: "bg-neutral-50 text-neutral-700 border-neutral-200/50",
};

function formatoFechaISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isoADatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

interface FormState {
  titulo: string;
  descripcion: string;
  tipo: string;
  fechaInicio: string;
  fechaFin: string;
  todoElDia: boolean;
  visibleCliente: boolean;
  obraId: string;
}

const FORM_VACIO: FormState = {
  titulo: "",
  descripcion: "",
  tipo: "nota",
  fechaInicio: "",
  fechaFin: "",
  todoElDia: true,
  visibleCliente: true,
  obraId: "",
};

interface Props {
  eventos: EventoAdmin[];
  obras: ObraOpcion[];
}

export function AdminCalendarioGrid({ eventos: eventosIniciales, obras }: Props) {
  const [eventos, setEventos] = useState<EventoAdmin[]>(eventosIniciales);
  const [fechaActual, setFechaActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const [filtroCliente, setFiltroCliente] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [formPara, setFormPara] = useState<{ fechaISO: string; evento?: EventoAdmin } | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const clientesUnicos = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of obras) map.set(o.clienteId, o.clienteNombre);
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [obras]);

  const filtrados = useMemo(() => {
    return eventos.filter((e) => {
      if (filtroCliente !== "todos" && e.clienteId !== filtroCliente) return false;
      if (filtroTipo !== "todos" && e.tipo !== filtroTipo) return false;
      return true;
    });
  }, [eventos, filtroCliente, filtroTipo]);

  const eventosPorDia = useMemo(() => {
    const map = new Map<string, EventoAdmin[]>();
    for (const e of filtrados) {
      const d = e.fechaInicio.slice(0, 10);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(e);
    }
    return map;
  }, [filtrados]);

  const year = fechaActual.getFullYear();
  const month = fechaActual.getMonth();

  const diasDelMes = useMemo(() => {
    const primero = new Date(year, month, 1);
    const ultimo = new Date(year, month + 1, 0);
    const offset = (primero.getDay() + 6) % 7; // lunes=0
    const dias: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) dias.push(null);
    for (let d = 1; d <= ultimo.getDate(); d++) dias.push(new Date(year, month, d));
    return dias;
  }, [year, month]);

  const eventosDelDia = diaSeleccionado ? (eventosPorDia.get(diaSeleccionado) ?? []) : [];

  const abrirForm = (fechaISO: string, evento?: EventoAdmin) => {
    setError(null);
    if (evento) {
      setForm({
        titulo: evento.titulo,
        descripcion: evento.descripcion ?? "",
        tipo: evento.tipo,
        fechaInicio: isoADatetimeLocal(evento.fechaInicio),
        fechaFin: isoADatetimeLocal(evento.fechaFin),
        todoElDia: evento.todoElDia,
        visibleCliente: evento.visibleCliente,
        obraId: evento.obraId ?? "",
      });
    } else {
      setForm({
        ...FORM_VACIO,
        fechaInicio: formPara?.fechaISO ? `${formPara.fechaISO}T09:00` : `${fechaISO}T09:00`,
      });
    }
    setFormPara({ fechaISO, evento });
  };

  const cerrarForm = () => {
    setFormPara(null);
    setForm(FORM_VACIO);
    setError(null);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPara) return;
    setError(null);
    const fd = new FormData();
    fd.set("titulo", form.titulo);
    fd.set("descripcion", form.descripcion);
    fd.set("tipo", form.tipo);
    fd.set("fechaInicio", form.todoElDia ? form.fechaInicio.slice(0, 10) : form.fechaInicio);
    fd.set("fechaFin", form.fechaFin ? (form.todoElDia ? form.fechaFin.slice(0, 10) : form.fechaFin) : "");
    if (form.todoElDia) fd.set("todoElDia", "on");
    if (form.obraId && form.visibleCliente) fd.set("visibleCliente", "on");
    fd.set("obraId", form.obraId);

    startTransition(async () => {
      const res = formPara.evento
        ? await actualizarEventoCalendario(formPara.evento.id, fd)
        : await crearEventoCalendario(fd);
      if (!res.success) {
        const err = res.error as Record<string, string[] | undefined> | undefined;
        const msg = err?._form?.[0] ?? Object.values(err ?? {}).flat()[0] ?? "Error al guardar";
        setError(String(msg));
        return;
      }
      // Refrescar desde servidor
      window.location.reload();
    });
  };

  const onEliminar = (id: string) => {
    if (!confirm("¿Eliminar este evento?")) return;
    startTransition(async () => {
      const res = await eliminarEventoCalendario(id);
      if (!res.success) {
        const err = res.error as Record<string, string[] | undefined> | undefined;
        setError(err?._form?.[0] ?? "No se pudo eliminar");
        return;
      }
      setEventos((prev) => prev.filter((ev) => ev.id !== id));
    });
  };

  const onToggleVisible = (id: string, visible: boolean) => {
    startTransition(async () => {
      const res = await alternarEventoVisible(id, visible);
      if (!res.success) {
        const err = res.error as Record<string, string[] | undefined> | undefined;
        setError(err?._form?.[0] ?? "No se pudo actualizar");
        return;
      }
      setEventos((prev) => prev.map((ev) => (ev.id === id ? { ...ev, visibleCliente: visible } : ev)));
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-label mb-1 text-ink-faint">CALENDARIO GLOBAL</p>
          <h1 className="font-heading text-3xl font-bold">Calendario</h1>
          <p className="mt-1 text-ink-muted">
            Todas las notas y eventos de todas las obras. Crea, edita o elimina manualmente.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filtroCliente}
          onChange={(e) => setFiltroCliente(e.target.value)}
          className="rounded border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="todos">Todos los clientes</option>
          {clientesUnicos.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="rounded border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="todos">Todos los tipos</option>
          {Object.entries(TIPO_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Grid mensual */}
      <div className="rounded border border-border bg-surface p-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setFechaActual(new Date(year, month - 1, 1))}
            className="rounded border border-border px-3 py-1 text-sm hover:bg-ink/5"
          >
            ←
          </button>
          <h2 className="font-heading text-lg font-bold">
            {MESES[month]} {year}
          </h2>
          <button
            onClick={() => setFechaActual(new Date(year, month + 1, 1))}
            className="rounded border border-border px-3 py-1 text-sm hover:bg-ink/5"
          >
            →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="py-1 font-mono text-ink-faint">{d}</div>
          ))}
          {diasDelMes.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} />;
            const iso = formatoFechaISO(d);
            const evs = eventosPorDia.get(iso) ?? [];
            const seleccionado = diaSeleccionado === iso;
            return (
              <button
                key={iso}
                onClick={() => setDiaSeleccionado(iso)}
                className={`min-h-[60px] rounded border p-1 text-left text-xs transition-colors ${
                  seleccionado ? "border-accent bg-accent/5" : "border-border hover:bg-ink/5"
                }`}
              >
                <div className="font-medium">{d.getDate()}</div>
                <div className="mt-1 space-y-0.5">
                  {evs.slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      className={`truncate rounded px-1 py-0.5 text-[10px] border ${TIPO_COLOR[e.tipo] ?? "bg-neutral-50 text-neutral-700 border-neutral-200/50"}`}
                    >
                      {e.titulo}
                    </div>
                  ))}
                  {evs.length > 3 && (
                    <div className="text-[10px] text-ink-faint">+{evs.length - 3} más</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel del día */}
      {diaSeleccionado && (
        <div className="rounded border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-heading font-bold">
              {new Date(diaSeleccionado + "T12:00:00").toLocaleDateString("es", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </h3>
            <button
              onClick={() => abrirForm(diaSeleccionado)}
              className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white"
            >
              + Nuevo evento
            </button>
          </div>
          {eventosDelDia.length === 0 ? (
            <p className="text-sm text-ink-muted">Sin eventos este día.</p>
          ) : (
            <div className="space-y-3">
              {eventosDelDia.map((e) => (
                <div key={e.id} className="rounded border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-medium border ${TIPO_COLOR[e.tipo] ?? "bg-neutral-50 text-neutral-700 border-neutral-200/50"}`}>
                          {TIPO_LABEL[e.tipo] ?? e.tipo}
                        </span>
                        <span className="truncate font-medium">{e.titulo}</span>
                      </div>
                      {e.descripcion && (
                        <p className="mt-1 text-sm text-ink-muted">{e.descripcion}</p>
                      )}
                      <p className="mt-1 text-xs text-ink-faint">
                        {e.obraDireccion ?? "Sin obra (interna)"}
                        {e.clienteNombre && ` · ${e.clienteNombre}`}
                        {e.creadoPor && ` · creado por ${e.creadoPor}`}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={e.visibleCliente}
                            onChange={(ev) => onToggleVisible(e.id, ev.target.checked)}
                            disabled={!e.obraId}
                          />
                          Visible para el cliente
                        </label>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => abrirForm(diaSeleccionado, e)}
                        className="text-xs text-ink-muted hover:text-ink"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onEliminar(e.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal crear/editar */}
      {formPara && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={cerrarForm}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 font-heading text-xl font-bold">
              {formPara.evento ? "Editar evento" : "Nuevo evento"}
            </h3>
            {error && (
              <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Título</label>
                <input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  required
                  minLength={3}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  >
                    {Object.entries(TIPO_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Obra</label>
                  <select
                    value={form.obraId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm({ ...form, obraId: v, visibleCliente: v ? form.visibleCliente : false });
                    }}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Sin obra (interna)</option>
                    {obras.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.direccionObra} — {o.clienteNombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  rows={3}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Inicio</label>
                  <input
                    type={form.todoElDia ? "date" : "datetime-local"}
                    value={form.fechaInicio}
                    onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                    required
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Fin (opcional)</label>
                  <input
                    type={form.todoElDia ? "date" : "datetime-local"}
                    value={form.fechaFin}
                    onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.todoElDia}
                    onChange={(e) => setForm({ ...form, todoElDia: e.target.checked })}
                  />
                  Todo el día
                </label>
                <label className={`flex items-center gap-2 text-sm ${!form.obraId ? "opacity-50" : ""}`}>
                  <input
                    type="checkbox"
                    checked={form.visibleCliente}
                    onChange={(e) => setForm({ ...form, visibleCliente: e.target.checked })}
                    disabled={!form.obraId}
                  />
                  Visible para el cliente
                  {!form.obraId && <span className="text-xs text-ink-faint">(requiere obra)</span>}
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cerrarForm}
                  className="rounded border border-border px-4 py-2 text-sm font-medium hover:bg-ink/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {isPending ? "Guardando..." : formPara.evento ? "Guardar cambios" : "Crear evento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState, useTransition } from "react";
import {
  createObra,
  updateObraEstado,
  updateObraProgreso,
  deleteObra,
  createHito,
  toggleHitoVisible,
  deleteHito,
  createPago,
  togglePagoEstado,
  deletePago,
} from "@/app/admin/(panel)/obras/actions";
import {
  ESTADO_OBRA_LABELS,
  ESTADO_OBRA_COLORES,
  ESTADOS_OBRA,
  ESTADO_PAGO_LABELS,
  ESTADO_PAGO_COLORES,
  ESTADOS_PAGO,
  type EstadoObraLabel,
  type EstadoPagoLabel,
} from "@/lib/constants";

type Obra = {
  id: string;
  clienteId: string;
  direccionObra: string;
  estado: EstadoObraLabel;
  progreso: number;
  fechaInicio: string;
  fechaFinEstimada: string | null;
  cliente: { id: string; nombre: string } | null;
  contrato: { id: string; montoTotal: number } | null;
  hitos: {
    id: string;
    titulo: string;
    descripcion: string;
    fecha: string;
    visibleCliente: boolean;
  }[];
  pagos: {
    id: string;
    monto: number;
    fecha: string;
    concepto: string;
    estado: EstadoPagoLabel;
  }[];
};

type Cliente = { id: string; nombre: string };
type Contrato = { id: string; montoTotal: number; clienteNombre: string };

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

function ProgresoEditor({
  value,
  onSave,
  onCancel,
}: {
  value: number;
  onSave: (v: number) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(value);

  return (
    <span className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        max={100}
        value={val}
        onChange={(e) => setVal(Number(e.target.value) || 0)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(val);
          if (e.key === "Escape") onCancel();
        }}
        className="w-20 rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-accent"
      />
      <button onClick={() => onSave(val)} className="text-xs text-ink/60 hover:underline">
        OK
      </button>
      <button onClick={onCancel} className="text-xs text-ink/40 hover:underline">
        Cancelar
      </button>
    </span>
  );
}

export function ObrasAdmin({
  obras,
  clientes,
  contratos,
}: {
  obras: Obra[];
  clientes: Cliente[];
  contratos: Contrato[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addHitoFor, setAddHitoFor] = useState<string | null>(null);
  const [addPagoFor, setAddPagoFor] = useState<string | null>(null);
  const [progresoEdit, setProgresoEdit] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError("");
    startTransition(async () => {
      const res = await createObra(formData);
      if (res?.success) {
        setShowForm(false);
      } else {
        const err = (res && "error" in res ? res.error : null) as
          | { _form?: string[] }
          | undefined;
        setError(err?._form?.[0] ?? "Error al crear la obra.");
      }
    });
  }

  function handleEstado(obraId: string, estado: string) {
    startTransition(async () => {
      await updateObraEstado(obraId, estado);
    });
  }

  function handleProgreso(id: string, progreso: number) {
    startTransition(async () => {
      await updateObraProgreso(id, progreso);
      setProgresoEdit(null);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta obra y todos sus hitos/pagos?")) return;
    startTransition(async () => {
      await deleteObra(id);
    });
  }

  function handleCreateHito(obraId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createHito(obraId, new FormData(e.currentTarget));
      if (res?.success) setAddHitoFor(null);
    });
  }

  function handleCreatePago(obraId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createPago(obraId, new FormData(e.currentTarget));
      if (res?.success) setAddPagoFor(null);
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="accent-btn rounded px-4 py-2 text-xs font-medium"
        >
          {showForm ? "Cancelar" : "+ Nueva obra"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 space-y-3 rounded border border-border bg-surface p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              name="clienteId"
              required
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              defaultValue=""
            >
              <option value="" disabled>
                Cliente
              </option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
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
          <input
            name="fechaInicio"
            type="date"
            required
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            name="fechaFinEstimada"
            type="date"
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
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
            Crear obra
          </button>
        </form>
      )}

      <div className="space-y-4">
        {obras.length === 0 && (
          <div className="rounded border border-border bg-surface p-8 text-center text-ink/30">
            No hay obras registradas
          </div>
        )}

        {obras.map((obra) => (
          <div key={obra.id} className="rounded border border-border bg-surface">
            <button
              type="button"
              onClick={() => setExpanded(expanded === obra.id ? null : obra.id)}
              className="flex w-full items-center justify-between gap-4 p-4 text-left"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-lg font-bold">
                    {obra.direccionObra}
                  </h2>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${ESTADO_OBRA_COLORES[obra.estado]}`}
                  >
                    {ESTADO_OBRA_LABELS[obra.estado]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink/50">
                  {obra.cliente?.nombre ?? "Sin cliente"} · Desde{" "}
                  {fmtFecha(obra.fechaInicio)}
                  {obra.fechaFinEstimada
                    ? ` · Hasta ${fmtFecha(obra.fechaFinEstimada)}`
                    : ""}
                  {obra.contrato
                    ? ` · Contrato $${obra.contrato.montoTotal.toLocaleString("es-AR")}`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-accent">
                  {obra.progreso}%
                </span>
                <span className="text-ink/40">{expanded === obra.id ? "▾" : "▸"}</span>
              </div>
            </button>

            {expanded === obra.id && (
              <div className="border-t border-border p-4 space-y-6">
                {/* Edición rápida */}
                <div className="flex flex-wrap items-center gap-3">
                  <label className="section-label text-ink/40 text-xs">
                    Estado
                  </label>
                  <select
                    value={obra.estado}
                    onChange={(e) => handleEstado(obra.id, e.target.value)}
                    disabled={isPending}
                    className="rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-accent"
                  >
                    {ESTADOS_OBRA.map((s) => (
                      <option key={s} value={s}>
                        {ESTADO_OBRA_LABELS[s]}
                      </option>
                    ))}
                  </select>

                  {progresoEdit === obra.id ? (
                    <ProgresoEditor
                      value={obra.progreso}
                      onSave={(v) => handleProgreso(obra.id, v)}
                      onCancel={() => setProgresoEdit(null)}
                    />
                  ) : (
                    <button
                      onClick={() => setProgresoEdit(obra.id)}
                      className="rounded bg-ink/5 px-2 py-1 text-xs text-ink/60 hover:text-ink"
                    >
                      Progreso: {obra.progreso}% ✎
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(obra.id)}
                    disabled={isPending}
                    className="ml-auto text-xs text-red-500 hover:underline"
                  >
                    Eliminar obra
                  </button>
                </div>

                {/* Hitos */}
                <div>
                  <div className="flex items-center justify-between">
                    <p className="section-label text-ink/40">
                      HITOS ({obra.hitos.length})
                    </p>
                    <button
                      onClick={() => setAddHitoFor(addHitoFor === obra.id ? null : obra.id)}
                      className="text-xs text-ink/50 hover:text-ink"
                    >
                      {addHitoFor === obra.id ? "Cancelar" : "+ Agregar hito"}
                    </button>
                  </div>

                  {addHitoFor === obra.id && (
                    <form
                      onSubmit={(e) => handleCreateHito(obra.id, e)}
                      className="mt-3 space-y-2 rounded border border-border bg-background p-3"
                    >
                      <input
                        name="titulo"
                        required
                        placeholder="Título (ej: Estructura lista)"
                        className="w-full rounded border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                      />
                      <textarea
                        name="descripcion"
                        required
                        placeholder="Descripción del avance"
                        rows={2}
                        className="w-full rounded border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                      />
                      <div className="flex items-center gap-3">
                        <input
                          name="fecha"
                          type="date"
                          required
                          className="rounded border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                        />
                        <label className="flex items-center gap-2 text-sm text-ink/60">
                          <input
                            name="visibleCliente"
                            type="checkbox"
                            value="true"
                            className="accent-[#FFB300]"
                          />
                          Visible para el cliente
                        </label>
                      </div>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="accent-btn rounded px-3 py-1.5 text-xs font-medium"
                      >
                        Agregar
                      </button>
                    </form>
                  )}

                  <div className="mt-3 space-y-2">
                    {obra.hitos.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-start justify-between gap-3 rounded border border-border bg-background p-3"
                      >
                        <div>
                          <p className="font-medium">{h.titulo}</p>
                          <p className="text-sm text-ink/50">{h.descripcion}</p>
                          <p className="mt-1 text-xs text-ink/40">
                            {fmtFecha(h.fecha)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            onClick={() =>
                              startTransition(async () => {
                                await toggleHitoVisible(h.id, !h.visibleCliente);
                              })
                            }
                            disabled={isPending}
                            className={`rounded px-2 py-0.5 text-xs font-medium ${
                              h.visibleCliente
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {h.visibleCliente ? "Visible" : "Oculto"}
                          </button>
                          <button
                            onClick={() =>
                              startTransition(async () => {
                                await deleteHito(h.id);
                              })
                            }
                            disabled={isPending}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Borrar
                          </button>
                        </div>
                      </div>
                    ))}
                    {obra.hitos.length === 0 && (
                      <p className="text-sm text-ink/30">Sin hitos registrados</p>
                    )}
                  </div>
                </div>

                {/* Pagos */}
                <div>
                  <div className="flex items-center justify-between">
                    <p className="section-label text-ink/40">
                      PAGOS ({obra.pagos.length})
                    </p>
                    <button
                      onClick={() => setAddPagoFor(addPagoFor === obra.id ? null : obra.id)}
                      className="text-xs text-ink/50 hover:text-ink"
                    >
                      {addPagoFor === obra.id ? "Cancelar" : "+ Agregar pago"}
                    </button>
                  </div>

                  {addPagoFor === obra.id && (
                    <form
                      onSubmit={(e) => handleCreatePago(obra.id, e)}
                      className="mt-3 space-y-2 rounded border border-border bg-background p-3"
                    >
                      <input
                        name="concepto"
                        required
                        placeholder="Concepto (ej: Anticipo — 30%)"
                        className="w-full rounded border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          name="monto"
                          type="number"
                          min={0}
                          step="0.01"
                          required
                          placeholder="Monto (AR$)"
                          className="rounded border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                        />
                        <input
                          name="fecha"
                          type="date"
                          required
                          className="rounded border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                        />
                        <select
                          name="estado"
                          className="rounded border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                          defaultValue="registrado"
                        >
                          {ESTADOS_PAGO.map((s) => (
                            <option key={s} value={s}>
                              {ESTADO_PAGO_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="accent-btn rounded px-3 py-1.5 text-xs font-medium"
                      >
                        Agregar
                      </button>
                    </form>
                  )}

                  <div className="mt-3 space-y-2">
                    {obra.pagos.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 rounded border border-border bg-background p-3"
                      >
                        <div>
                          <p className="font-medium">{p.concepto}</p>
                          <p className="text-sm text-ink/50">
                            ${p.monto.toLocaleString("es-AR")} · {fmtFecha(p.fecha)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            onClick={() =>
                              startTransition(async () => {
                                await togglePagoEstado(
                                  p.id,
                                  p.estado === "confirmado" ? "registrado" : "confirmado",
                                );
                              })
                            }
                            disabled={isPending}
                            className={`rounded px-2 py-0.5 text-xs font-medium ${
                              ESTADO_PAGO_COLORES[p.estado]
                            }`}
                          >
                            {ESTADO_PAGO_LABELS[p.estado]}
                          </button>
                          <button
                            onClick={() =>
                              startTransition(async () => {
                                await deletePago(p.id);
                              })
                            }
                            disabled={isPending}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Borrar
                          </button>
                        </div>
                      </div>
                    ))}
                    {obra.pagos.length === 0 && (
                      <p className="text-sm text-ink/30">Sin pagos registrados</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
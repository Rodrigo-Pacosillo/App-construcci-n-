"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ESTADOS_COTIZACION, ESTADO_LABELS, ESTADO_COLORES } from "@/lib/constants";

type Cotizacion = {
  id: string;
  estado: string;
  tipoObra: string;
  tipoConstruccion: string;
  rangoM2: string;
  origen: string;
  ubicacionObra: string | null;
  montoEstimado: number | null;
  montoCerrado: number | null;
  notasInternas: string | null;
  creadoEn: Date;
  actualizadoEn: Date;
  cliente: { nombre: string; apellidos: string; telefono: string; email: string | null; ciudad: string | null } | null;
};

export function CotizacionDetalle({ cotizacion }: { cotizacion: Cotizacion }) {
  const [editMode, setEditMode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    estado: cotizacion.estado,
    montoEstimado: cotizacion.montoEstimado?.toString() || "",
    montoCerrado: cotizacion.montoCerrado?.toString() || "",
    notasInternas: cotizacion.notasInternas || "",
  });
  const [error, setError] = useState<Record<string, string[] | undefined>>({});

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error[field]) {
      setError((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/cotizaciones/${cotizacion.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            estado: formData.estado,
            montoEstimado: formData.montoEstimado ? parseFloat(formData.montoEstimado) : null,
            montoCerrado: formData.montoCerrado ? parseFloat(formData.montoCerrado) : null,
            notasInternas: formData.notasInternas || null,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          setError(data.error || { _form: ["Error al guardar"] });
        } else {
          setEditMode(false);
          window.location.reload();
        }
      } catch {
        setError({ _form: ["Error de conexión"] });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/cotizaciones"
            className="mb-3 inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a cotizaciones
          </Link>
          <p className="section-label mb-1 text-ink-faint">COTIZACIÓN</p>
          <h1 className="font-heading text-3xl font-bold">
            {cotizacion.cliente?.nombre || "—"} {cotizacion.cliente?.apellidos || ""}
          </h1>
        </div>
        {editMode ? (
          <div className="flex gap-2">
            <button
              onClick={() => { setFormData({ estado: cotizacion.estado, montoEstimado: cotizacion.montoEstimado?.toString() || "", montoCerrado: cotizacion.montoCerrado?.toString() || "", notasInternas: cotizacion.notasInternas || "" }); setEditMode(false); setError({}); }}
              className="rounded border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-ink/5"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="accent-btn rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="accent-btn rounded px-4 py-2 text-sm font-medium"
          >
            Editar
          </button>
        )}
      </div>

      {/* Cliente info */}
      <div className="rounded border border-border bg-surface p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="section-label text-ink-faint">CLIENTE</p>
            <p className="font-medium">{cotizacion.cliente?.nombre || "—"} {cotizacion.cliente?.apellidos || ""}</p>
            <p className="text-sm text-ink-muted">{cotizacion.cliente?.telefono}</p>
            {cotizacion.cliente?.email && <p className="text-sm text-ink-muted">{cotizacion.cliente?.email}</p>}
            {cotizacion.cliente?.ciudad && <p className="text-sm text-ink-muted">{cotizacion.cliente?.ciudad}</p>}
          </div>
          <div>
            <p className="section-label text-ink-faint">DETALLES</p>
            <p className="capitalize text-ink-muted">{cotizacion.tipoObra.replace("_", " ")}</p>
            <p className="capitalize text-ink-muted">{cotizacion.tipoConstruccion.replace("_", " ")}</p>
            <p className="text-ink-muted">{cotizacion.rangoM2.replace("m", "").replace("_", "-").replace("mas", "+")} m2</p>
            <p className="capitalize text-ink-muted">{cotizacion.origen}</p>
          </div>
          <div>
            <p className="section-label text-ink-faint">FECHAS</p>
            <p className="text-ink-muted">Creada: {new Date(cotizacion.creadoEn).toLocaleString("es-AR")}</p>
            <p className="text-ink-muted">Actualizada: {new Date(cotizacion.actualizadoEn).toLocaleString("es-AR")}</p>
          </div>
        </div>
        {cotizacion.ubicacionObra && (
          <div className="mt-4">
            <p className="section-label text-ink-faint">UBICACIÓN</p>
            <p className="text-ink-muted">{cotizacion.ubicacionObra}</p>
          </div>
        )}
      </div>

      {/* Monto & Estado */}
      <div className="rounded border border-border bg-surface p-4">
        <p className="section-label mb-4 text-ink-faint">MONTOS Y ESTADO</p>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="section-label block text-ink-faint mb-1">Estado</label>
            {editMode ? (
              <select
                value={formData.estado}
                onChange={(e) => handleChange("estado", e.target.value)}
                className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent"
              >
                {ESTADOS_COTIZACION.map((e) => (
                  <option key={e} value={e}>{ESTADO_LABELS[e]}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${ESTADO_COLORES[cotizacion.estado as keyof typeof ESTADO_COLORES] ?? "bg-ink/5 text-ink-muted"}`}>
                  {ESTADO_LABELS[cotizacion.estado as keyof typeof ESTADO_LABELS]}
                </span>
                <button
                  onClick={() => setEditMode(true)}
                  className="text-xs text-accent-strong hover:underline"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="section-label block text-ink-faint mb-1">Monto estimado</label>
            {editMode ? (
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.montoEstimado}
                onChange={(e) => handleChange("montoEstimado", e.target.value)}
                className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent"
                placeholder="0"
              />
            ) : (
              <p className="font-heading text-lg font-bold">
                {cotizacion.montoEstimado ? `$${cotizacion.montoEstimado.toLocaleString("es-AR")}` : "—"}
              </p>
            )}
            {error.montoEstimado && <p className="text-xs text-red-500 mt-1">{error.montoEstimado[0]}</p>}
          </div>
          <div>
            <label className="section-label block text-ink-faint mb-1">Monto cerrado</label>
            {editMode ? (
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.montoCerrado}
                onChange={(e) => handleChange("montoCerrado", e.target.value)}
                className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent"
                placeholder="0"
              />
            ) : (
              <p className="font-heading text-lg font-bold text-accent-strong">
                {cotizacion.montoCerrado ? `$${cotizacion.montoCerrado.toLocaleString("es-AR")}` : "—"}
              </p>
            )}
            {error.montoCerrado && <p className="text-xs text-red-500 mt-1">{error.montoCerrado[0]}</p>}
          </div>
        </div>
      </div>

      {/* Notas internas */}
      <div className="rounded border border-border bg-surface p-4">
        <p className="section-label mb-2 text-ink-faint">NOTAS INTERNAS (solo admin)</p>
        {editMode ? (
          <textarea
            value={formData.notasInternas}
            onChange={(e) => handleChange("notasInternas", e.target.value)}
            rows={4}
            className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="Notas internas para el equipo..."
          />
        ) : (
          <p className="text-ink-muted whitespace-pre-wrap">{cotizacion.notasInternas || "— Sin notas —"}</p>
        )}
      </div>
    </div>
  );
}
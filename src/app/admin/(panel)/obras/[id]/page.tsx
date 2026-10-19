"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getObraById,
  updateObra,
  createHito,
  updateHito,
  deleteHito,
  createPago,
  updatePago,
  deletePago,
  toggleHitoVisibleCliente,
} from "@/app/admin/(panel)/obras/actions";
import { ESTADOS_OBRA, ESTADO_OBRA_LABELS, ESTADO_OBRA_COLORES, ESTADOS_PAGO } from "@/lib/constants";

type Obra = {
  id: string;
  direccionObra: string;
  fechaInicio: string;
  fechaFinEstimada: string | null;
  estado: string;
  progreso: number;
  contrato: { id: string; montoTotal: number } | null;
  hitos: Hito[];
  pagos: Pago[];
};

type Hito = {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  fotoUrl: string | null;
  visibleCliente: boolean;
};

type Pago = {
  id: string;
  monto: number;
  fecha: string;
  concepto: string;
  comprobanteUrl: string | null;
  estado: string;
};

export default function AdminObraDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [obra, setObra] = useState<Obra | null>(null);
  const [editObraMode, setEditObraMode] = useState(false);
  const [showHitoForm, setShowHitoForm] = useState(false);
  const [editingHito, setEditingHito] = useState<Hito | null>(null);
  const [showPagoForm, setShowPagoForm] = useState(false);
  const [editingPago, setEditingPago] = useState<Pago | null>(null);
  const [error, setError] = useState<Record<string, string[] | undefined>>({});
  const [obraForm, setObraForm] = useState({
    direccionObra: "",
    fechaInicio: "",
    fechaFinEstimada: "",
    estado: "en_curso",
    progreso: "",
  });
  const [hitoForm, setHitoForm] = useState({
    titulo: "",
    descripcion: "",
    fecha: "",
    fotoUrl: "",
    visibleCliente: false,
  });
  const [pagoForm, setPagoForm] = useState({
    monto: "",
    fecha: "",
    concepto: "",
    comprobanteUrl: "",
    estado: "registrado",
  });

  async function loadObra() {
    try {
      const { id } = await params;
      const res = await fetch(`/api/admin/obras/${id}`);
      if (res.ok) {
        const data = await res.json();
        setObra(data);
        setObraForm({
          direccionObra: data.direccionObra,
          fechaInicio: data.fechaInicio ? new Date(data.fechaInicio).toISOString().split("T")[0] : "",
          fechaFinEstimada: data.fechaFinEstimada ? new Date(data.fechaFinEstimada).toISOString().split("T")[0] : "",
          estado: data.estado,
          progreso: data.progreso.toString(),
        });
      }
    } catch (e) {
      console.error("Error loading obra:", e);
    }
  }

  if (typeof window !== "undefined" && !obra) {
    loadObra();
  }

  function handleObraChange(field: string, value: string) {
    setObraForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleHitoChange(field: string, value: string | boolean) {
    setHitoForm((prev) => ({ ...prev, [field]: value }));
    if (error[field]) setError((prev) => ({ ...prev, [field]: undefined }));
  }

  function handlePagoChange(field: string, value: string) {
    setPagoForm((prev) => ({ ...prev, [field]: value }));
    if (error[field]) setError((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSaveObra() {
    startTransition(async () => {
      try {
        const fd = new FormData();
        Object.entries(obraForm).forEach(([k, v]) => fd.append(k, v));
        const res = await updateObra(obra!.id, fd);
        if (!res.success) setError(res.error || { _form: ["Error al actualizar"] });
        else { setEditObraMode(false); router.refresh(); }
      } catch { setError({ _form: ["Error de conexión"] }); }
    });
  }

  function handleHitoSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const fd = new FormData();
        Object.entries(hitoForm).forEach(([k, v]) => fd.append(k, String(v)));
        fd.append("obraId", obra!.id);
        const res = editingHito
          ? await updateHito(editingHito.id, fd)
          : await createHito(obra!.id, fd);
        if (!res.success) setError(res.error || { _form: ["Error al guardar hito"] });
        else { setShowHitoForm(false); setEditingHito(null); router.refresh(); }
      } catch { setError({ _form: ["Error de conexión"] }); }
    });
  }

  function handlePagoSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const fd = new FormData();
        Object.entries(pagoForm).forEach(([k, v]) => fd.append(k, v));
        fd.append("obraId", obra!.id);
        const res = editingPago
          ? await updatePago(editingPago.id, fd)
          : await createPago(obra!.id, fd);
        if (!res.success) setError(res.error || { _form: ["Error al guardar pago"] });
        else { setShowPagoForm(false); setEditingPago(null); router.refresh(); }
      } catch { setError({ _form: ["Error de conexión"] }); }
    });
  }

  function startCreateHito() {
    setHitoForm({ titulo: "", descripcion: "", fecha: new Date().toISOString().split("T")[0], fotoUrl: "", visibleCliente: false });
    setEditingHito(null);
    setError({});
    setShowHitoForm(true);
  }

  function startEditHito(h: Hito) {
    setHitoForm({ titulo: h.titulo, descripcion: h.descripcion, fecha: new Date(h.fecha).toISOString().split("T")[0], fotoUrl: h.fotoUrl || "", visibleCliente: h.visibleCliente });
    setEditingHito(h);
    setError({});
    setShowHitoForm(true);
  }

  function startCreatePago() {
    setPagoForm({ monto: "", fecha: new Date().toISOString().split("T")[0], concepto: "", comprobanteUrl: "", estado: "registrado" });
    setEditingPago(null);
    setError({});
    setShowPagoForm(true);
  }

  function startEditPago(p: Pago) {
    setPagoForm({ monto: p.monto.toString(), fecha: new Date(p.fecha).toISOString().split("T")[0], concepto: p.concepto, comprobanteUrl: p.comprobanteUrl || "", estado: p.estado });
    setEditingPago(p);
    setError({});
    setShowPagoForm(true);
  }

  function handleCancelForm() {
    setShowHitoForm(false);
    setShowPagoForm(false);
    setEditingHito(null);
    setEditingPago(null);
    setError({});
  }

  async function handleDeleteHito(id: string) {
    if (!confirm("¿Eliminar este hito?")) return;
    await deleteHito(id);
    router.refresh();
  }

  async function handleDeletePago(id: string) {
    if (!confirm("¿Eliminar este pago?")) return;
    await deletePago(id);
    router.refresh();
  }

  async function handleToggleVisible(hitoId: string, current: boolean) {
    await toggleHitoVisibleCliente(hitoId, !current);
    router.refresh();
  }

  if (!obra) {
    return <div className="flex items-center justify-center h-64"><div className="animate-pulse text-ink-muted">Cargando...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label mb-1 text-ink-faint">OBRA #{obra.id.slice(0, 8).toUpperCase()}</p>
          <h1 className="font-heading text-3xl font-bold">{obra.direccionObra}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditObraMode(!editObraMode); setError({}); }} className="accent-btn rounded px-4 py-2 text-sm font-medium">
            {editObraMode ? "Cancelar" : "Editar obra"}
          </button>
        </div>
      </div>

      {/* Obra form */}
      {editObraMode && (
        <div className="rounded border border-border bg-surface p-4 space-y-4">
          {error._form && <div className="rounded bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error._form[0]}</div>}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="section-label block text-ink-faint mb-1">Dirección *</label>
              <input value={obraForm.direccionObra} onChange={(e) => handleObraChange("direccionObra", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
            </div>
            <div>
              <label className="section-label block text-ink-faint mb-1">Fecha inicio *</label>
              <input type="date" value={obraForm.fechaInicio} onChange={(e) => handleObraChange("fechaInicio", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
            </div>
            <div>
              <label className="section-label block text-ink-faint mb-1">Fecha fin estimada</label>
              <input type="date" value={obraForm.fechaFinEstimada} onChange={(e) => handleObraChange("fechaFinEstimada", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" />
            </div>
            <div>
              <label className="section-label block text-ink-faint mb-1">Estado *</label>
              <select value={obraForm.estado} onChange={(e) => handleObraChange("estado", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent">
                {ESTADOS_OBRA.map((e) => <option key={e} value={e}>{ESTADO_OBRA_LABELS[e]}</option>)}
              </select>
            </div>
            <div>
              <label className="section-label block text-ink-faint mb-1">Progreso *</label>
              <input type="number" min="0" max="100" value={obraForm.progreso} onChange={(e) => handleObraChange("progreso", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveObra} disabled={isPending} className="accent-btn rounded px-4 py-2 text-sm font-medium disabled:opacity-50">{isPending ? "Guardando..." : "Guardar"}</button>
              <button onClick={() => { setEditObraMode(false); setError({}); loadObra(); }} className="rounded border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-ink/5">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Info general */}
      {!editObraMode && (
        <div className="rounded border border-border bg-surface p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="section-label text-ink-faint">Dirección</p>
              <p className="font-medium">{obra.direccionObra}</p>
            </div>
            <div>
              <p className="section-label text-ink-faint">Inicio</p>
              <p className="text-ink-muted">{obra.fechaInicio ? new Date(obra.fechaInicio).toLocaleDateString("es-AR") : "—"}</p>
            </div>
            <div>
              <p className="section-label text-ink-faint">Fin estimado</p>
              <p className="text-ink-muted">{obra.fechaFinEstimada ? new Date(obra.fechaFinEstimada).toLocaleDateString("es-AR") : "—"}</p>
            </div>
            <div>
              <p className="section-label text-ink-faint">Estado</p>
              <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${ESTADO_OBRA_COLORES[obra.estado as keyof typeof ESTADO_OBRA_COLORES]}`}>
                {ESTADO_OBRA_LABELS[obra.estado as keyof typeof ESTADO_OBRA_LABELS]}
              </span>
            </div>
            <div className="md:col-span-2">
              <p className="section-label text-ink-faint">Progreso</p>
              <div className="h-2 w-full rounded-full bg-ink/10">
                <div className="h-2 rounded-full bg-accent" style={{ width: `${obra.progreso}%` }} />
              </div>
              <p className="mt-1 text-sm text-ink-muted">{obra.progreso}%</p>
            </div>
            {obra.contrato && (
              <div>
                <p className="section-label text-ink-faint">Contrato vinculado</p>
                <p className="text-ink-muted">Monto: ${Number(obra.contrato.montoTotal).toLocaleString("es-AR")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hitos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-heading text-xl font-bold">Hitos ({obra.hitos.length})</p>
          <button onClick={startCreateHito} className="accent-btn rounded px-3 py-1.5 text-sm font-medium">Nuevo hito</button>
        </div>

        {showHitoForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded border border-border bg-surface p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-bold">{editingHito ? "Editar hito" : "Nuevo hito"}</h2>
                <button onClick={handleCancelForm} className="text-ink-muted hover:text-ink">✕</button>
              </div>
              {error._form && <div className="rounded bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error._form[0]}</div>}
              <form onSubmit={handleHitoSubmit} className="space-y-4">
                <div>
                  <label className="section-label block text-ink-faint mb-1">Título *</label>
                  <input value={hitoForm.titulo} onChange={(e) => handleHitoChange("titulo", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
                  {error.titulo && <p className="text-xs text-red-500 mt-1">{error.titulo[0]}</p>}
                </div>
                <div>
                  <label className="section-label block text-ink-faint mb-1">Descripción *</label>
                  <textarea value={hitoForm.descripcion} onChange={(e) => handleHitoChange("descripcion", e.target.value)} rows={3} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
                  {error.descripcion && <p className="text-xs text-red-500 mt-1">{error.descripcion[0]}</p>}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="section-label block text-ink-faint mb-1">Fecha *</label>
                    <input type="date" value={hitoForm.fecha} onChange={(e) => handleHitoChange("fecha", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
                  </div>
                  <div>
                    <label className="section-label block text-ink-faint mb-1">URL foto</label>
                    <input type="url" value={hitoForm.fotoUrl} onChange={(e) => handleHitoChange("fotoUrl", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="visibleCliente" checked={hitoForm.visibleCliente} onChange={(e) => handleHitoChange("visibleCliente", e.target.checked)} className="h-4 w-4 rounded border-border" />
                  <label htmlFor="visibleCliente" className="text-sm text-ink-muted">Visible para cliente</label>
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="submit" disabled={isPending} className="accent-btn rounded px-4 py-2 text-sm font-medium disabled:opacity-50 flex-1">{isPending ? "Guardando..." : "Guardar"}</button>
                  <button type="button" onClick={handleCancelForm} className="rounded border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-ink/5 flex-1">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {obra.hitos.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded border border-border bg-surface p-4">
              <div className="flex-1">
                <p className="font-medium">{h.titulo}</p>
                <p className="text-sm text-ink-muted">{h.descripcion}</p>
                <p className="text-xs text-ink-faint">Fecha: {new Date(h.fecha).toLocaleDateString("es-AR")} {h.visibleCliente ? "· Visible para cliente" : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={h.visibleCliente} onChange={() => handleToggleVisible(h.id, h.visibleCliente)} className="h-4 w-4 rounded border-border" />
                  <span className="text-ink-muted">Visible cliente</span>
                </label>
                <button onClick={() => startEditHito(h)} className="text-xs text-accent-strong hover:underline">Editar</button>
                <form action={async () => { await deleteHito(h.id); router.refresh(); }}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">Eliminar</button>
                </form>
              </div>
            </div>
          ))}
          {obra.hitos.length === 0 && <p className="text-center text-ink-muted py-8">No hay hitos registrados</p>}
        </div>
      </div>

      {/* Pagos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-heading text-xl font-bold">Pagos ({obra.pagos.length})</p>
          <button onClick={startCreatePago} className="accent-btn rounded px-3 py-1.5 text-sm font-medium">Nuevo pago</button>
        </div>

        {showPagoForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded border border-border bg-surface p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-bold">{editingPago ? "Editar pago" : "Nuevo pago"}</h2>
                <button onClick={handleCancelForm} className="text-ink-muted hover:text-ink">✕</button>
              </div>
              {error._form && <div className="rounded bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error._form[0]}</div>}
              <form onSubmit={handlePagoSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="section-label block text-ink-faint mb-1">Monto *</label>
                    <input type="number" step="0.01" min="0" value={pagoForm.monto} onChange={(e) => handlePagoChange("monto", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
                    {error.monto && <p className="text-xs text-red-500 mt-1">{error.monto[0]}</p>}
                  </div>
                  <div>
                    <label className="section-label block text-ink-faint mb-1">Fecha *</label>
                    <input type="date" value={pagoForm.fecha} onChange={(e) => handlePagoChange("fecha", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
                  </div>
                  <div>
                    <label className="section-label block text-ink-faint mb-1">Concepto *</label>
                    <input value={pagoForm.concepto} onChange={(e) => handlePagoChange("concepto", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
                    {error.concepto && <p className="text-xs text-red-500 mt-1">{error.concepto[0]}</p>}
                  </div>
                  <div>
                    <label className="section-label block text-ink-faint mb-1">Estado *</label>
                    <select value={pagoForm.estado} onChange={(e) => handlePagoChange("estado", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent">
                      {ESTADOS_PAGO.map((e) => <option key={e} value={e}>{e === "registrado" ? "Registrado" : "Confirmado"}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="section-label block text-ink-faint mb-1">URL comprobante</label>
                    <input type="url" value={pagoForm.comprobanteUrl} onChange={(e) => handlePagoChange("comprobanteUrl", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="submit" disabled={isPending} className="accent-btn rounded px-4 py-2 text-sm font-medium disabled:opacity-50 flex-1">{isPending ? "Guardando..." : "Guardar"}</button>
                  <button type="button" onClick={handleCancelForm} className="rounded border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-ink/5 flex-1">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {obra.pagos.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded border border-border bg-surface p-4">
              <div className="flex-1">
                <p className="font-medium">{p.concepto}</p>
                <p className="text-sm text-ink-muted">{new Date(p.fecha).toLocaleDateString("es-AR")}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-heading text-lg font-bold text-accent-strong">${Number(p.monto).toLocaleString("es-AR")}</p>
                <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${p.estado === "confirmado" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                  {p.estado === "confirmado" ? "Confirmado" : "Registrado"}
                </span>
                <button onClick={() => startEditPago(p)} className="text-xs text-accent-strong hover:underline">Editar</button>
                <form action={async () => { await deletePago(p.id); router.refresh(); }}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">Eliminar</button>
                </form>
              </div>
            </div>
          ))}
          {obra.pagos.length === 0 && <p className="text-center text-ink-muted py-8">No hay pagos registrados</p>}
        </div>
      </div>
    </div>
  );
}
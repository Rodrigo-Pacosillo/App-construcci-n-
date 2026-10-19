"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createContrato, getClientesForSelect, getCotizacionesGanadasForSelect } from "@/app/admin/(panel)/contratos/actions";

type ClienteSelect = { id: string; nombre: string; apellidos: string; email: string | null };
type CotizacionSelect = { id: string; tipoObra: string; cliente: { nombre: string; apellidos: string } };

export default function AdminNuevoContratoPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<Record<string, string[] | undefined>>({});
  const [formData, setFormData] = useState({
    clienteId: "",
    cotizacionId: "",
    archivoPdfUrl: "",
    fechaFirma: "",
    montoTotal: "",
    observaciones: "",
  });
  const [clientes, setClientes] = useState<ClienteSelect[]>([]);
  const [cotizaciones, setCotizaciones] = useState<CotizacionSelect[]>([]);

  const loadSelectData = useCallback(async () => {
    const [cli, cot] = await Promise.all([
      getClientesForSelect(),
      getCotizacionesGanadasForSelect(),
    ]);
    setClientes(cli);
    setCotizaciones(cot);
  }, []);

  useEffect(() => {
    (async () => {
      await loadSelectData();
    })();
  }, [loadSelectData]);

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error[field]) {
      setError((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      const res = await createContrato(fd);
      if (!res.success) {
        setError(res.error || { _form: ["Error al crear"] });
      } else {
        router.push("/admin/contratos");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="section-label mb-1 text-ink-faint">CONTRATOS</p>
        <h1 className="font-heading text-3xl font-bold">Nuevo contrato</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {error._form && (
          <div className="rounded bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
            {error._form[0]}
          </div>
        )}

        <div className="rounded border border-border bg-surface p-6 space-y-4">
          <h2 className="font-heading text-lg font-bold">Datos del contrato</h2>

          <div>
            <label htmlFor="clienteId" className="section-label block text-ink-faint mb-1">
              Cliente <span className="text-red-500">*</span>
            </label>
            <select
              id="clienteId"
              value={formData.clienteId}
              onChange={(e) => handleChange("clienteId", e.target.value)}
              className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent"
              required
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.apellidos} {c.email && `(${c.email})`}
                </option>
              ))}
            </select>
            {error.clienteId && <p className="text-xs text-red-500 mt-1">{error.clienteId[0]}</p>}
          </div>

          <div>
            <label htmlFor="cotizacionId" className="section-label block text-ink-faint mb-1">
              Cotización de origen (opcional)
            </label>
            <select
              id="cotizacionId"
              value={formData.cotizacionId}
              onChange={(e) => handleChange("cotizacionId", e.target.value)}
              className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="">Sin cotización vinculada</option>
              {cotizaciones.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tipoObra.replace("_", " ")} — {c.cliente.nombre} {c.cliente.apellidos}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="montoTotal" className="section-label block text-ink-faint mb-1">
              Monto total <span className="text-red-500">*</span>
            </label>
            <input
              id="montoTotal"
              type="number"
              step="0.01"
              min="0"
              value={formData.montoTotal}
              onChange={(e) => handleChange("montoTotal", e.target.value)}
              className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent"
              required
            />
            {error.montoTotal && <p className="text-xs text-red-500 mt-1">{error.montoTotal[0]}</p>}
          </div>

          <div>
            <label htmlFor="fechaFirma" className="section-label block text-ink-faint mb-1">
              Fecha de firma
            </label>
            <input
              id="fechaFirma"
              type="date"
              value={formData.fechaFirma}
              onChange={(e) => handleChange("fechaFirma", e.target.value)}
              className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="archivoPdfUrl" className="section-label block text-ink-faint mb-1">
              URL del PDF (opcional)
            </label>
            <input
              id="archivoPdfUrl"
              type="url"
              value={formData.archivoPdfUrl}
              onChange={(e) => handleChange("archivoPdfUrl", e.target.value)}
              className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="https://ejemplo.com/contrato.pdf"
            />
          </div>

          <div>
            <label htmlFor="observaciones" className="section-label block text-ink-faint mb-1">
              Observaciones
            </label>
            <textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => handleChange("observaciones", e.target.value)}
              rows={3}
              className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="Notas adicionales..."
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="accent-btn rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {isPending ? "Creando..." : "Crear contrato"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-ink/5"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createContrato, getClientesForSelect, getCotizacionesGanadasForSelect } from "@/app/admin/(panel)/contratos/actions";
import { ESTADO_LABELS, TIPO_OBRA_LABELS } from "@/lib/constants";

type ClienteSelect = { id: string; nombre: string; apellidos: string; email: string | null };
type CotizacionSelect = {
  id: string;
  tipoObra: string;
  origen?: string;
  estado?: string;
  ubicacionObra?: string | null;
  rangoM2?: string;
  tipoConstruccion?: string;
  cliente: { nombre: string; apellidos: string; email?: string | null; telefono?: string | null };
};

function rangoM2Label(rango?: string) {
  if (!rango) return null;
  return `${rango.replace(/^m/, "").replace("_", "-").replace("mas", "+")} m2`;
}

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
  const [cotizacionOrigen, setCotizacionOrigen] = useState<CotizacionSelect | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cotizacionIdParam = params.get("cotizacionId") ?? "";
    const clienteIdParam = params.get("clienteId") ?? "";

    (async () => {
      const [cli, cot] = await Promise.all([
        getClientesForSelect(),
        getCotizacionesGanadasForSelect(cotizacionIdParam || undefined),
      ]);
      setClientes(cli);
      setCotizaciones(cot);

      if (cotizacionIdParam) {
        const found = cot.find((c) => c.id === cotizacionIdParam) || null;
        setCotizacionOrigen(found);
      }

      if (cotizacionIdParam || clienteIdParam) {
        setFormData((prev) => ({
          ...prev,
          cotizacionId: cotizacionIdParam || prev.cotizacionId,
          clienteId: clienteIdParam || prev.clienteId,
        }));
      }
    })();
  }, []);

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
        <nav className="mb-2 text-xs text-ink-faint">
          <span>Admin</span> / <span>Contratos</span> / <span className="text-ink-muted">Nuevo contrato</span>
        </nav>
        <h1 className="font-heading text-3xl font-bold">Nuevo contrato</h1>
        <p className="mt-1 text-ink-muted">Generar contrato desde una cotización o manualmente</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error._form && (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error._form[0]}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
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
                  disabled={!!formData.cotizacionId && !!clienteIdFromParams()}
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
                  onChange={(e) => {
                    handleChange("cotizacionId", e.target.value);
                    const found = cotizaciones.find((c) => c.id === e.target.value) || null;
                    setCotizacionOrigen(found);
                    if (found?.cliente) {
                      const match = clientes.find((cl) => cl.nombre === found.cliente.nombre && cl.apellidos === found.cliente.apellidos);
                      if (match && !formData.clienteId) {
                        handleChange("clienteId", match.id);
                      }
                    }
                  }}
                  className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent"
                >
                  <option value="">Sin cotización vinculada</option>
                  {cotizaciones.map((c) => (
                    <option key={c.id} value={c.id}>
                      {TIPO_OBRA_LABELS[c.tipoObra as keyof typeof TIPO_OBRA_LABELS] ?? c.tipoObra.replace("_", " ")} — {c.cliente.nombre} {c.cliente.apellidos}
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
          </div>

          {cotizacionOrigen && (
            <div className="lg:col-span-4">
              <div className="rounded border border-border bg-surface p-4 space-y-3">
                <p className="section-label text-ink-faint">RESUMEN DE COTIZACIÓN</p>
                <div>
                  <p className="text-sm font-medium text-ink">
                    {TIPO_OBRA_LABELS[cotizacionOrigen.tipoObra as keyof typeof TIPO_OBRA_LABELS] ?? cotizacionOrigen.tipoObra.replace("_", " ")}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {cotizacionOrigen.cliente.nombre} {cotizacionOrigen.cliente.apellidos}
                  </p>
                </div>
                <div className="space-y-1 text-xs text-ink-muted">
                  {cotizacionOrigen.estado && (
                    <p>
                      Estado:{" "}
                      <span className="text-ink">
                        {ESTADO_LABELS[cotizacionOrigen.estado as keyof typeof ESTADO_LABELS] ?? cotizacionOrigen.estado}
                      </span>
                    </p>
                  )}
                  {cotizacionOrigen.ubicacionObra && <p>Ubicación: {cotizacionOrigen.ubicacionObra}</p>}
                  {cotizacionOrigen.rangoM2 && <p>M²: {rangoM2Label(cotizacionOrigen.rangoM2)}</p>}
                  {cotizacionOrigen.origen && <p>Origen: {cotizacionOrigen.origen}</p>}
                </div>
                <Link href={`/admin/cotizaciones/${cotizacionOrigen.id}`} className="inline-flex items-center text-xs text-accent-strong hover:underline">
                  Ver cotización completa
                </Link>
              </div>
            </div>
          )}
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

function clienteIdFromParams() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("clienteId");
}
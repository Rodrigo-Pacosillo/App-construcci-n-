"use client";

import { useState, useTransition, useEffect, useLayoutEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Copy, MessageCircle, X } from "lucide-react";
import { updateContrato, getClientesForSelect, getCotizacionesGanadasForSelect } from "@/app/admin/(panel)/contratos/actions";
import { ESTADO_LABELS } from "@/lib/constants";

type ClienteSelect = { id: string; nombre: string; apellidos: string; email: string | null };
type CotizacionSelect = { id: string; tipoObra: string; cliente: { nombre: string; apellidos: string } };
type ContratoData = {
  id: string;
  clienteId: string;
  cotizacionId: string | null;
  archivoPdfUrl: string | null;
  fechaFirma: string | null;
  montoTotal: number;
  observaciones: string | null;
  creadoEn: string;
  cliente: { nombre: string; apellidos: string; email: string | null; telefono: string | null } | null;
  cotizacion: { tipoObra: string; estado: string } | null;
  obras: { id: string; direccionObra: string }[];
  tieneUsuario: boolean;
};

export default function AdminContratoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [editMode, setEditMode] = useState(false);
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
  const [contrato, setContrato] = useState<ContratoData | null>(null);
  const [showAccessBanner, setShowAccessBanner] = useState(false);
  const [accessLink, setAccessLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { id } = await params;
      const res = await fetch(`/api/admin/contratos/${id}`);
      if (res.ok) {
        const data = await res.json();
        setContrato(data);
        if (data) {
          setFormData({
            clienteId: data.clienteId,
            cotizacionId: data.cotizacionId || "",
            archivoPdfUrl: data.archivoPdfUrl || "",
            fechaFirma: data.fechaFirma ? new Date(data.fechaFirma).toISOString().split("T")[0] : "",
            montoTotal: data.montoTotal.toString(),
            observaciones: data.observaciones || "",
          });
        }
      }

      const [cli, cot] = await Promise.all([
        getClientesForSelect(),
        getCotizacionesGanadasForSelect(),
      ]);
      setClientes(cli);
      setCotizaciones(cot);
    } catch (e) {
      console.error("Error loading contrato:", e);
    }
  }, [params]);

  useEffect(() => {
    (async () => {
      await loadData();
    })();
  }, [loadData]);

  useEffect(() => {
    const shouldShowBanner = searchParams.get("created") === "1" && contrato?.tieneUsuario === false;
    if (shouldShowBanner !== showAccessBanner) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowAccessBanner(shouldShowBanner);
    }
  }, [searchParams, contrato?.tieneUsuario]);

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error[field]) {
      setError((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const fd = new FormData();
        Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
        const res = await updateContrato(contrato!.id, fd);
        if (!res.success) {
          setError(res.error || { _form: ["Error al actualizar"] });
        } else {
          setEditMode(false);
          router.refresh();
        }
      } catch {
        setError({ _form: ["Error de conexión"] });
      }
    });
  }

  async function generarEnlace() {
    if (!contrato?.cliente) return;
    setGeneratingLink(true);
    try {
      const res = await fetch("/api/admin/invitaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId: contrato.clienteId }),
      });
      const data = await res.json();
      if (data.success && data.link) {
        setAccessLink(data.link);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingLink(false);
    }
  }

  function copiarEnlace() {
    if (!accessLink) return;
    navigator.clipboard.writeText(accessLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function compartirWhatsApp() {
    if (!accessLink || !contrato?.cliente) return;
    const nombre = contrato.cliente.nombre?.split(" ")[0] || "Hola";
    const mensaje = `Hola ${nombre}, te envío el enlace para completar el acceso al portal de CONSTR-ART.

Desde el portal podrás consultar el avance de tu obra, los hitos, los pagos, los documentos y los contratos.

Para completar tu cuenta, ingresá al siguiente enlace:
${accessLink}

Una vez completado el registro, podrás iniciar sesión para ver toda la información de tu obra.`;
    const telefono = contrato.cliente.telefono;
    const url = telefono
      ? `https://wa.me/${telefono.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(mensaje)}`
      : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (!contrato) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-ink-muted">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showAccessBanner && (
        <div className="rounded border border-border bg-surface p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="font-medium text-ink">Acceso al portal del cliente</p>
              <p className="mt-1 text-sm text-ink-muted">
                La obra ya está vinculada a este contrato. Para que el cliente pueda acceder al portal (/cliente) y consultar el avance de su obra, los hitos, los pagos, los documentos y los contratos, envíele un enlace para completar su cuenta.
              </p>
              {accessLink && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    readOnly
                    value={accessLink}
                    className="w-full rounded border border-border bg-surface px-3 py-2 text-xs sm:w-80"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={copiarEnlace}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded border border-border px-3 text-xs font-medium text-ink transition-colors hover:bg-ink/5"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied ? "Copiado" : "Copiar enlace"}
                    </button>
                    <button
                      onClick={compartirWhatsApp}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded bg-green-600 px-3 text-xs font-medium text-white transition-colors hover:bg-green-700"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Enviar por WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!accessLink && (
                <button
                  onClick={generarEnlace}
                  disabled={generatingLink}
                  className="accent-btn inline-flex h-8 items-center justify-center rounded px-3 text-xs font-medium disabled:opacity-50"
                >
                  {generatingLink ? "Generando..." : "Generar enlace"}
                </button>
              )}
              <button
                onClick={() => setShowAccessBanner(false)}
                className="inline-flex h-8 items-center justify-center rounded px-2 text-xs font-medium text-ink-faint transition-colors hover:text-ink"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <nav className="mb-2 text-xs text-ink-faint">
            <span>Admin</span> / <span>Contratos</span> /{" "}
            <span className="text-ink-muted">#{contrato.id.slice(0, 8).toUpperCase()}</span>
          </nav>
          <p className="section-label mb-1 text-ink-faint">CONTRATO</p>
          <h1 className="font-heading text-3xl font-bold">
            {contrato.cliente?.nombre || "—"} {contrato.cliente?.apellidos || ""}
          </h1>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <button
                onClick={() => { setEditMode(false); setError({}); loadData(); }}
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
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="accent-btn rounded px-4 py-2 text-sm font-medium"
            >
              Editar
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="rounded border border-border bg-surface p-4">
            <p className="section-label mb-3 text-ink-faint">CLIENTE</p>
            <p className="font-medium">{contrato.cliente?.nombre || "—"} {contrato.cliente?.apellidos || ""}</p>
            {contrato.cliente?.email && <p className="text-sm text-ink-muted">{contrato.cliente.email}</p>}
          </div>

          <div className="rounded border border-border bg-surface p-4">
            <p className="section-label mb-3 text-ink-faint">ORIGEN</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-ink-faint mb-1">Cotización vinculada</p>
                {contrato.cotizacion && contrato.cotizacionId ? (
                  <div className="space-y-1">
                    <p className="capitalize text-ink-muted">{contrato.cotizacion.tipoObra.replace("_", " ")}</p>
                    <p className="text-xs text-ink-faint">
                      {ESTADO_LABELS[contrato.cotizacion.estado as keyof typeof ESTADO_LABELS] ?? contrato.cotizacion.estado}
                    </p>
                    <Link href={`/admin/cotizaciones/${contrato.cotizacionId}`} className="inline-flex items-center text-xs text-accent-strong hover:underline">
                      Ver cotización
                    </Link>
                  </div>
                ) : (
                  <p className="text-ink-faint">— Sin cotización vinculada —</p>
                )}
              </div>
              <div>
                <p className="text-xs text-ink-faint mb-1">Obra vinculada</p>
                {contrato.obras.length > 0 ? (
                  <ul className="space-y-1">
                    {contrato.obras.map((o) => (
                      <li key={o.id} className="text-sm text-ink-muted">{o.direccionObra}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-ink-faint">— Sin obra vinculada —</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <div className="rounded border border-border bg-surface p-4">
            <p className="section-label mb-4 text-ink-faint">DATOS DEL CONTRATO</p>
            <div className="space-y-4">
              <div>
                <label className="section-label block text-ink-faint mb-1">Monto total</label>
                {editMode ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.montoTotal}
                    onChange={(e) => handleChange("montoTotal", e.target.value)}
                    className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent"
                    required
                  />
                ) : (
                  <p className="font-heading text-2xl font-bold text-accent-strong">
                    ${Number(contrato.montoTotal).toLocaleString("es-AR")}
                  </p>
                )}
                {error.montoTotal && <p className="text-xs text-red-500 mt-1">{error.montoTotal[0]}</p>}
              </div>

              <div>
                <label className="section-label block text-ink-faint mb-1">Fecha de firma</label>
                {editMode ? (
                  <input
                    type="date"
                    value={formData.fechaFirma}
                    onChange={(e) => handleChange("fechaFirma", e.target.value)}
                    className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                ) : (
                  <p className="text-ink-muted">
                    {contrato.fechaFirma
                      ? new Date(contrato.fechaFirma).toLocaleDateString("es-AR")
                      : "— Sin fecha —"}
                  </p>
                )}
              </div>

              {editMode && (
                <div>
                  <label className="section-label block text-ink-faint mb-1">Cliente</label>
                  <select
                    value={formData.clienteId}
                    onChange={(e) => handleChange("clienteId", e.target.value)}
                    className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent"
                    required
                  >
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.apellidos} {c.email && `(${c.email})`}
                      </option>
                    ))}
                  </select>
                  {error.clienteId && <p className="text-xs text-red-500 mt-1">{error.clienteId[0]}</p>}
                </div>
              )}

              {editMode && (
                <div>
                  <label className="section-label block text-ink-faint mb-1">Cotización vinculada</label>
                  <select
                    value={formData.cotizacionId}
                    onChange={(e) => handleChange("cotizacionId", e.target.value)}
                    className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent"
                  >
                    <option value="">Sin cotización</option>
                    {cotizaciones.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.tipoObra.replace("_", " ")} — {c.cliente.nombre} {c.cliente.apellidos}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="section-label block text-ink-faint mb-1">URL del PDF</label>
                {editMode ? (
                  <input
                    type="url"
                    value={formData.archivoPdfUrl}
                    onChange={(e) => handleChange("archivoPdfUrl", e.target.value)}
                    className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent"
                    placeholder="https://ejemplo.com/contrato.pdf"
                  />
                ) : (
                  <div>
                    {contrato.archivoPdfUrl ? (
                      <a
                        href={contrato.archivoPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-accent-strong hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ver PDF
                      </a>
                    ) : (
                      <p className="text-ink-faint">— Sin PDF —</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded border border-border bg-surface p-4">
        <p className="section-label mb-2 text-ink-faint">OBSERVACIONES</p>
        {editMode ? (
          <textarea
            value={formData.observaciones}
            onChange={(e) => handleChange("observaciones", e.target.value)}
            rows={4}
            className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="Notas adicionales..."
          />
        ) : (
          <p className="text-ink-muted whitespace-pre-wrap">{contrato.observaciones || "— Sin observaciones —"}</p>
        )}
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Clock, Calendar, MapPin, MessageSquare, Send, Loader2 } from "lucide-react";

interface AccionUI {
  accionId: string;
  herramienta: "proponer_evento_calendario" | "proponer_nota_calendario" | "proponer_cambio_estado_cotizacion";
  estado: "pendiente" | "ejecutando" | "ejecutada" | "rechazada" | "fallida" | "expirada";
  expiraEn: string | null;
  resumen: {
    tipo: "evento" | "cambio_estado";
    subtipo?: "nota" | "visita_tecnica" | "recordatorio" | "reunion";
    titulo?: string;
    descripcion?: string | null;
    cliente: string;
    obra: string | null;
    cuando?: string;
    fecha?: string;
    hora?: string | null;
    visibleCliente?: boolean;
    estadoActual?: string;
    estadoNuevo?: string;
    cotizacion?: string;
  };
  error?: string | null;
}

interface TarjetaAccionProps {
  accion: AccionUI;
  agente: "cliente" | "admin";  // NUEVO
  onFinalizada: (accionId: string, exito: boolean, mensaje?: string) => void;
}

const ICONOS_SUBTIPO: Record<string, React.ComponentType<{ className?: string }>> = {
  nota: MessageSquare,
  visita_tecnica: MapPin,
  recordatorio: Clock,
  reunion: Send,
};

const COLORES_ESTADO: Record<string, string> = {
  pendiente: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800",
  ejecutando: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
  ejecutada: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800",
  rechazada: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800",
  fallida: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800",
  expirada: "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700",
};

export function TarjetaAccion({ accion, agente, onFinalizada }: TarjetaAccionProps) {
  const [confirmando, setConfirmando] = useState(false);
  const [rechazando, setRechazando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resumen = accion.resumen || {};
  const estado = accion.estado || "pendiente";
  const colorEstado = COLORES_ESTADO[estado] || COLORES_ESTADO.pendiente;
  const expiro = accion.expiraEn ? new Date(accion.expiraEn) : null;
  const expirada = expiro && expiro < new Date();

  const manejarConfirmar = async () => {
    setConfirmando(true);
    setError(null);
    try {
      const base = agente === "admin" ? "/api/admin/chat-acciones" : "/api/chat-acciones";
      const res = await fetch(`${base}/${accion.accionId}/confirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Error al confirmar");
      onFinalizada(accion.accionId, true, data.mensaje);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al confirmar");
    } finally {
      setConfirmando(false);
    }
  };

  const manejarRechazar = async () => {
    setRechazando(true);
    setError(null);
    try {
      const base = agente === "admin" ? "/api/admin/chat-acciones" : "/api/chat-acciones";
      const res = await fetch(`${base}/${accion.accionId}/rechazar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Error al rechazar");
      onFinalizada(accion.accionId, false, data.mensaje);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al rechazar");
    } finally {
      setRechazando(false);
    }
  };

  const SubtipoIcon = ICONOS_SUBTIPO[accion.resumen?.subtipo || "nota"] || MessageSquare;

  return (
    <div className={`rounded-xl border p-3 ${colorEstado} shadow-sm`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-white dark:bg-neutral-800">
          <SubtipoIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h4 className="font-medium text-sm text-neutral-900 dark:text-white">
              {accion.resumen?.tipo === "cambio_estado"
                ? `Cambio de estado: ${accion.resumen.cotizacion || "Cotización"}`
                : `${accion.resumen?.subtipo === "visita_tecnica" ? "Visita técnica" : accion.resumen?.subtipo === "nota" ? "Nota" : accion.resumen?.subtipo === "recordatorio" ? "Recordatorio" : "Reunión"}: ${accion.resumen?.titulo || "Sin título"}`}
            </h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${colorEstado} text-neutral-700 dark:text-neutral-300`}>
              {estado === "pendiente" ? "Pendiente" : estado === "ejecutando" ? "Ejecutando…" : estado === "ejecutada" ? "✅ Ejecutada" : estado === "rechazada" ? "❌ Rechazada" : estado === "fallida" ? "⚠️ Fallida" : "⏳ Expirada"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-400 mb-2">
            <div><span className="font-medium">Cliente:</span> {accion.resumen?.cliente}</div>
            <div><span className="font-medium">Obra:</span> {accion.resumen?.obra || "—"}</div>
            {accion.resumen?.cuando && (
              <div className="col-span-2"><span className="font-medium">Cuándo:</span> {accion.resumen.cuando}</div>
            )}
            {accion.resumen?.hora && (
              <div><span className="font-medium">Hora:</span> {accion.resumen.hora}</div>
            )}
            {accion.resumen?.tipo === "evento" && (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accion.resumen?.visibleCliente}
                    onChange={() => { /* editable en fase posterior */ }}
                    disabled
                    className="w-4 h-4 rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
                  />
                  Visible para el cliente
                </label>
              </div>
            )}
            {accion.resumen?.tipo === "cambio_estado" && (
              <div className="col-span-2">
                <span className="font-medium">Estado actual:</span> {accion.resumen?.estadoActual} → {accion.resumen?.estadoNuevo}
              </div>
            )}
          </div>

          {accion.error && (
            <div className="mt-2 p-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded">
              {accion.error}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            {expirada && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Acción expirada (30 min)
              </span>
            )}
            {accion.estado === "pendiente" && !expirada && (
              <div className="flex gap-2 w-full">
                <button
                  onClick={manejarConfirmar}
                  disabled={confirmando || rechazando}
                  className="flex-1 py-2 px-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {confirmando ? <> <Loader2 className="h-4 w-4 animate-spin" /> <span>Confirmando…</span> </> : <> <CheckCircle className="h-4 w-4" /> <span>Confirmar</span> </>}
                </button>
                <button
                  onClick={manejarRechazar}
                  disabled={confirmando || rechazando}
                  className="flex-1 py-2 px-3 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {rechazando ? <> <Loader2 className="h-4 w-4 animate-spin" /> <span>Rechazando…</span> </> : <> <XCircle className="h-4 w-4" /> <span>Rechazar</span> </>}
                </button>
              </div>
            )}
            {accion.estado === "fallida" && (
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2 px-3 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg"
              >
                <AlertCircle className="h-4 w-4" /> Reintentar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TarjetaAccion;
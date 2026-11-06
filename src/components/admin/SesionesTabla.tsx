"use client";

import { useState } from "react";
import { AdminChatModal } from "./AdminChatModal";

interface SesionRow {
  id: string;
  sessionId: string;
  agente: string;
  estado: string;
  mensajes: number;
  ultimoMensajeEn: Date | null;
  usuario?: { nombre?: string | null; email?: string | null } | null;
  cotizacion?: { cliente?: { nombre?: string | null } | null } | null;
}

export function SesionesTabla({ sesiones }: { sesiones: SesionRow[] }) {
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);

  const estadoColor = (estado: string) => {
    if (estado === "activa") return "bg-green-100 text-green-800";
    if (estado === "cerrada") return "bg-gray-100 text-gray-800";
    return "bg-yellow-100 text-yellow-800";
  };

  return (
    <>
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Conversaciones recientes
        </h2>
        {sesiones.length === 0 ? (
          <p className="text-ink-muted">No hay conversaciones.</p>
        ) : (
          <div className="rounded border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 section-label text-ink-faint">
                    Agente
                  </th>
                  <th className="px-4 py-3 section-label text-ink-faint">
                    Estado
                  </th>
                  <th className="px-4 py-3 section-label text-ink-faint">
                    Mensajes
                  </th>
                  <th className="px-4 py-3 section-label text-ink-faint">
                    Último mensaje
                  </th>
                  <th className="px-4 py-3 section-label text-ink-faint">
                    Cliente / Usuario
                  </th>
                  <th className="px-4 py-3 section-label text-ink-faint">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {sesiones.map((s) => {
                  const isActive = openSessionId === s.sessionId;
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-border last:border-0 ${
                        isActive ? "bg-amber-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">
                        {s.agente}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs rounded px-2 py-0.5 ${estadoColor(
                            s.estado
                          )}`}
                        >
                          {s.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {s.mensajes}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {s.ultimoMensajeEn
                          ? new Date(s.ultimoMensajeEn).toLocaleString("es-BO", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {s.usuario?.nombre ??
                          s.cotizacion?.cliente?.nombre ??
                          "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setOpenSessionId(s.sessionId)}
                          className={`flex items-center gap-1.5 text-xs rounded border px-2 py-1 transition-colors ${
                            isActive
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-surface text-ink-muted border-border hover:bg-ink/5 hover:text-ink"
                          }`}
                        >
                          {isActive ? "Cerrar chat" : "Abrir chat"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {openSessionId && (
        <AdminChatModal
          sessionId={openSessionId}
          onClose={() => setOpenSessionId(null)}
        />
      )}
    </>
  );
}

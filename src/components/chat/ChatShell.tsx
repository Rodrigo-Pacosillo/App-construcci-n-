"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatPanel } from "./ChatPanel";

interface SesionItem {
  sessionId: string;
  titulo: string | null;
  ultimoMensajeEn: string;
}

interface ChatShellProps {
  esAdmin: boolean;
  initialSessionId?: string;
  clienteId?: string;
  cotizacionId?: string;
  clienteNombre?: string;
  whatsappNumero?: string;
  cotizacionData?: unknown;
  chatToken?: string;
}

export function ChatShell(props: ChatShellProps) {
  const agente = props.esAdmin ? "admin" : "cliente";
  const [sessions, setSessions] = useState<SesionItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(props.initialSessionId ?? null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/sesiones?agente=${agente}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignorar
    } finally {
      setLoading(false);
    }
  }, [agente]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const nuevoChat = async () => {
    try {
      const res = await fetch("/api/chat/sesiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agente }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveId(data.sessionId);
        cargar();
      }
    } catch {
      // ignorar
    }
  };

  return (
    <div className="flex h-full w-full">
      <aside className="w-64 border-r border-border bg-background/50 p-2 overflow-y-auto">
        <button
          onClick={nuevoChat}
          className="w-full mb-2 rounded-md bg-ink text-background px-3 py-2 text-sm"
        >
          Nuevo chat
        </button>
        {loading && <div className="text-xs text-muted-foreground p-2">Cargando...</div>}
        <ul className="space-y-1">
          {sessions.map((s) => (
            <li key={s.sessionId}>
              <button
                onClick={() => setActiveId(s.sessionId)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm truncate ${
                  activeId === s.sessionId ? "bg-muted font-medium" : "hover:bg-muted/50"
                }`}
              >
                {s.titulo || "Sin titulo"}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div className="flex-1 min-w-0">
        <ChatPanel
          key={activeId ?? "none"}
          esAdmin={props.esAdmin}
          initialSessionId={activeId ?? undefined}
          clienteId={props.clienteId}
          cotizacionId={props.cotizacionId}
          clienteNombre={props.clienteNombre}
          whatsappNumero={props.whatsappNumero}
          cotizacionData={props.cotizacionData as never}
          chatToken={props.chatToken}
        />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

import { WHATSAPP_NUMERO } from "@/lib/constants";
import AiAvatar from "./AiAvatar";
import SendIcon from "./SendIcon";
import BrickLoader from "./BrickLoader";
import { TarjetaAccion } from "./TarjetaAccion";
import { RenderTextoChat } from "./RenderTextoChat";

// ─── Tipos ─────────────────────────────────────────────────────────────────

type AgenteUI = { id: "publico" | "cliente" | "admin"; etiqueta: string; descripcion: string };

type Mensaje = {
  id: string;
  rol: "user" | "assistant";
  contenido: string;
  creadoEn: string;
  sugerencias?: string[];
  accionIds?: string[];
};

type AccionResumen = {
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

type AccionUI = {
  accionId: string;
  herramienta: "proponer_evento_calendario" | "proponer_nota_calendario" | "proponer_cambio_estado_cotizacion";
  estado: "pendiente" | "ejecutando" | "ejecutada" | "rechazada" | "fallida" | "expirada";
  expiraEn: string | null;
  resumen: AccionResumen;
  error?: string | null;
};

interface ChatPanelProps {
  agente: "publico" | "cliente" | "admin";
  sessionId?: string | null;
  chatToken?: string;
  cotizacionId?: string;
  clienteId?: string;
  clienteNombre?: string;
  whatsappNumero?: string;
  initialSessionId?: string | null;
  onSesionCreada?: (id: string) => void;
  onActividad?: () => void;
}

// ─── Lectura de stream SSE (AI SDK UI Message Stream) ─────────────────────

type SSEMessage = {
  type: string;
  text?: string;
  id?: string;
  role?: string;
  toolCallId?: string;
  toolName?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  createdAt?: string;
  [key: string]: unknown;
};

async function* leerSSE(response: Response): AsyncGenerator<SSEMessage> {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop()!;

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          try {
            yield JSON.parse(trimmed.slice(6)) as SSEMessage;
          } catch {
            // Ignorar líneas malformadas
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

interface StreamUIResultado {
  texto: string;
  mensajeId: string | null;
  error?: string;
  acciones: AccionUI[];
}

/**
 * Extrae una acción del resultado de una herramienta.
 * El servidor devuelve `{ ui: { tipo: "accion", accionId, ... } }`.
 */
function extraerAccionUI(output: unknown): AccionUI | null {
  if (!output || typeof output !== "object") return null;
  const o = output as Record<string, unknown>;
  const ui = o.ui;
  if (!ui || typeof ui !== "object") return null;
  const u = ui as Record<string, unknown>;
  if (u.tipo !== "accion") return null;
  return u as AccionUI;
}

function extraerOpcionesUI(output: unknown): unknown | null {
  if (!output || typeof output !== "object") return null;
  const o = output as Record<string, unknown>;
  const ui = o.ui;
  if (!ui || typeof ui !== "object") return null;
  const u = ui as Record<string, unknown>;
  if (u.tipo !== "opciones") return null;
  return u;
}

// ─── Componente principal ──────────────────────────────────────────────────

export function ChatPanel(props: ChatPanelProps) {
  const {
    agente,
    sessionId: initialSessionId,
    chatToken,
    cotizacionId,
    clienteId: propsClienteId,
    clienteNombre: propsClienteNombre,
    whatsappNumero,
    onSesionCreada,
    onActividad,
  } = props;

  const esAdmin = agente === "admin";
  const esPublico = agente === "publico";

  // Clave de storage
  const storageKey = useMemo(() => {
    if (esPublico && cotizacionId) return `chat_publico_${cotizacionId}`;
    if (propsClienteId) return `chat_ultimo_${agente}_${propsClienteId}`;
    return `chat_${agente}`;
  }, [agente, cotizacionId, propsClienteId]);

  // Estado
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [acciones, setAcciones] = useState<Record<string, AccionUI>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorEsFatal, setErrorEsFatal] = useState(false);
  const [input, setInput] = useState("");
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(true);
  const [agenteUI, setAgenteUI] = useState<AgenteUI | null>(null);
  const [expiraEn, setExpiraEn] = useState<string | null>(null);
  const [modoBorrador, setModoBorrador] = useState(!esPublico && !initialSessionId);

  // Ref para evitar cargarHistorial al crear sesión nueva (race condition)
  const sessionJustCreated = useRef(false);

  // Clave de storage
  const sessionStorageKey = storageKey;

  // ─── Funciones principales ────────────────────────────────────────────────

  // Leer stream SSE
  async function leerStreamUI(response: Response): Promise<StreamUIResultado> {
    const reader = response.body?.getReader();
    if (!reader) return { texto: "", mensajeId: null, error: "Sin reader", acciones: [] };

    const decoder = new TextDecoder();
    let buffer = "";
    let texto = "";
    let mensajeId: string | null = null;
    const accionesResultado: AccionUI[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop()!;
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.type === "text-delta") {
                texto += data.delta ?? "";
              } else if (data.type === "finish") {
                mensajeId = data.messageId;
              } else if (data.type === "tool-output-available") {
                const accion = extraerAccionUI(data.output);
                if (accion && !accionesResultado.some((a) => a.accionId === accion.accionId)) {
                  accionesResultado.push(accion);
                }
              } else if (data.type === "tool-output-error" || data.type === "tool-input-error") {
                console.warn("[CHAT] Tool error:", data.errorText);
              }
            } catch { /* ignorar */ }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    return { texto, mensajeId, acciones: accionesResultado };
  }

  // Cargar historial
  const cargarHistorial = useCallback(async (sid: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = esPublico
        ? `/api/chat?sessionId=${encodeURIComponent(sid)}&t=${encodeURIComponent(chatToken || "")}`
        : `/api/chat?sessionId=${encodeURIComponent(sid)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al cargar historial");
      const data = await res.json();
      setMensajes(data.mensajes || []);
      setAcciones({});
      (data.acciones || []).forEach((a: AccionUI) => { setAcciones((prev) => ({ ...prev, [a.accionId]: a })); });
      setSugerencias(data.sugerencias || []);
      setAgenteUI(data.agente || null);
      setExpiraEn(data.expiraEn || null);
      setModoBorrador(false);
      setMostrarSugerencias((data.mensajes || []).length === 0);
    } catch (err) {
      console.error("[CHAT] Error cargando historial:", err);
      setError("No se pudo cargar el historial.");
      setErrorEsFatal(true);
    } finally {
      setLoading(false);
    }
  }, [esPublico, chatToken]);

  // Iniciar chat
  const iniciarChat = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSugerencias([]);

    if (esPublico) {
      if (!chatToken) {
        setError("Token requerido");
        setErrorEsFatal(true);
        setLoading(false);
        return;
      }
      const body: Record<string, unknown> = { mensaje: "__INICIO__", t: chatToken };
      if (cotizacionId) body.cotizacionId = cotizacionId;
      if (propsClienteNombre) body.clienteNombre = propsClienteNombre;
      if (whatsappNumero) body.whatsappNumero = whatsappNumero;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let mensaje = "Error al iniciar el chat";
        try { const body = await res.json(); if (body.error?.message) mensaje = body.error.message as string; } catch {}
        setError(mensaje);
        setErrorEsFatal(res.status === 404 || res.status === 410 || res.status === 429);
        if (res.status === 404 || res.status === 410 || res.status === 429) {
          sessionStorage.removeItem(sessionStorageKey);
          sessionStorage.removeItem(`${sessionStorageKey}_token`);
          setSessionId(null);
        }
        setLoading(false);
        return;
      }

      // Respuesta JSON para __INICIO__
      const data = await res.json();
      sessionJustCreated.current = true; // Marcar que la sesión fue creada recién
      setSessionId(data.sessionId);
      sessionStorage.setItem(sessionStorageKey, data.sessionId);
      // Guardar token para mensajes posteriores (solo público)
      if (esPublico && chatToken) {
        sessionStorage.setItem(`${sessionStorageKey}_token`, chatToken);
      }
      setMensajes(data.mensajes || []);
      setSugerencias(data.sugerencias || []);
      setAgenteUI(data.agente || null);
      setExpiraEn(data.expiraEn || null);
      setModoBorrador(false);
      setMostrarSugerencias(true);
      setErrorEsFatal(false);
      onActividad?.();
      setLoading(false);
      return;
    }

    // Cliente/Admin: modo borrador → NO enviar mensaje, solo crear sesión
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: null, agente: agente }),
    });

    if (!res.ok) {
      let mensaje = "Error al iniciar el chat";
      try { const body = await res.json(); if (body.error?.message) mensaje = body.error.message as string; } catch {}
      setError(mensaje);
      setErrorEsFatal(res.status === 404 || res.status === 429);
      if (res.status === 404 || res.status === 429) {
        sessionStorage.removeItem(sessionStorageKey);
        setSessionId(null);
      }
      setLoading(false);
      return;
    }

    // Leer header X-Chat-Session-Id
    const newSessionId = res.headers.get("X-Chat-Session-Id");
    if (newSessionId) {
      setSessionId(newSessionId);
      sessionStorage.setItem(sessionStorageKey, newSessionId);
      onSesionCreada?.(newSessionId);
    }

    // Obtener saludo del servidor
    const data = await res.json();
    sessionJustCreated.current = true; // Marcar que la sesión fue creada recién
    setSessionId(data.sessionId);
    sessionStorage.setItem(sessionStorageKey, data.sessionId);
    setMensajes(data.mensajes || []);
    setSugerencias(data.sugerencias || []);
    setAgenteUI(data.agente || null);
    setExpiraEn(data.expiraEn || null);
    setModoBorrador(false);
    setMostrarSugerencias(true);
    setErrorEsFatal(false);
    onActividad?.();
    setLoading(false);
  }, [esPublico, chatToken, cotizacionId, propsClienteNombre, whatsappNumero, sessionStorageKey, onSesionCreada, onActividad]);

  // ─── Funciones de envío ──────────────────────────────────────────────────

  const enviarTexto = useCallback(async (texto: string) => {
    if (!texto.trim() || !sessionId || loading) return;
    setInput("");
    setError(null);

    const mensajeOptimista: Mensaje = {
      id: `temp-${Date.now()}`,
      rol: "user",
      contenido: texto,
      creadoEn: new Date().toISOString(),
    };

    setMensajes((prev) => [...prev, mensajeOptimista]);
    setLoading(true);
    setMostrarSugerencias(false);

    try {
      // Para chat público, recuperar token de sessionStorage si no está en props
      const token = esPublico
        ? (chatToken || (typeof window !== "undefined" ? sessionStorage.getItem(`${sessionStorageKey}_token`) : null))
        : chatToken;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje: texto,
          sessionId,
          t: token,
        }),
      });

      if (!res.ok) {
        let mensaje = "Error al enviar el mensaje";
        try { const body = await res.json(); if (body.error?.message) mensaje = body.error.message as string; } catch {}
        setError(mensaje);
        setErrorEsFatal(res.status === 404 || res.status === 429);
        if (res.status === 404 || res.status === 429) {
          sessionStorage.removeItem(sessionStorageKey);
          sessionStorage.removeItem(`${sessionStorageKey}_token`);
          setSessionId(null);
        }
        setLoading(false);
        return;
      }

      const { texto: textoCompleto, mensajeId, error: errorStream, acciones: accionesNuevas } = await leerStreamUI(res);

      setErrorEsFatal(false);
      if (errorStream) setError(errorStream);

      if (textoCompleto.trim() || accionesNuevas.length > 0) {
        setMensajes((prev) => [
          ...prev.filter((m) => !m.id.startsWith("temp-")),
          { id: `user-${Date.now()}`, rol: "user", contenido: texto, creadoEn: new Date().toISOString() },
          {
            id: mensajeId ?? `msg-${Date.now()}`,
            rol: "assistant",
            contenido: textoCompleto,
            creadoEn: new Date().toISOString(),
            acciones: accionesNuevas.length > 0 ? accionesNuevas.map((a) => a.accionId) : undefined,
          },
        ]);
        accionesNuevas.forEach((a) => { setAcciones((prev) => ({ ...prev, [a.accionId]: a })); });
        onActividad?.();
      }
      setLoading(false);
    } catch {
      setError("Lo siento, tuve un problema técnico. Intenta de nuevo en unos segundos.");
      setLoading(false);
    }
  }, [sessionId, chatToken, loading]);

  const enviarMensaje = useCallback(() => enviarTexto(input), [input, enviarTexto]);

  // Nueva conversación
  const nuevaConversacion = useCallback(() => {
    sessionStorage.removeItem(sessionStorageKey);
    sessionStorage.removeItem(`${sessionStorageKey}_token`);
    setSessionId(null);
    setMensajes([]);
    setAcciones({});
    setSugerencias([]);
    setModoBorrador(true);
    setMostrarSugerencias(true);
    setError(null);
    setErrorEsFatal(false);
    setInput("");
    setTimeout(() => iniciarChat(), 0);
  }, [sessionStorageKey, iniciarChat]);

  // Manejar confirmación/rechazo de acción
  const alFinalizarAccion = useCallback((accionId: string, exito: boolean, mensaje?: string) => {
    setAcciones((prev) => ({
      ...prev,
      [accionId]: { ...prev[accionId], estado: exito ? "ejecutada" : "rechazada", error: mensaje },
    }));
    if (exito) onActividad?.();
  }, [onActividad]);

  // ─── Render helpers ──────────────────────────────────────────────────────

  // Render de tarjetas de acción
  const renderAcciones = useMemo(() => {
    return Object.values(acciones).map((accion) => (
      <TarjetaAccion key={accion.accionId} accion={accion} onFinalizada={alFinalizarAccion} />
    ));
  }, [acciones, alFinalizarAccion]);

  // Render de chips de sugerencia
  const renderSugerencias = useMemo(() => {
    if (!mostrarSugerencias || sugerencias.length === 0) return null;
    return (
      <div className="px-4 pb-2 flex flex-wrap gap-2">
        {sugerencias.map((chip) => (
          <button
            key={chip}
            onClick={() => enviarTexto(chip)}
            className="text-xs px-3 py-1 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {chip}
          </button>
        ))}
      </div>
    );
  }, [mostrarSugerencias, sugerencias, enviarTexto]);

  // Cargar sesión existente al cambiar sessionId
  useEffect(() => {
    if (!sessionId) return;
    // Si la sesión acaba de crearse, no cargar historial (ya se cargó en iniciarChat)
    if (sessionJustCreated.current) {
      sessionJustCreated.current = false;
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarHistorial(sessionId);
  }, [sessionId, cargarHistorial]);

  // Auto-iniciar chat si no hay sesión guardada
  useEffect(() => {
    if (!sessionId) {
      setTimeout(() => iniciarChat(), 0);
    }
  }, [esPublico, propsClienteId, cotizacionId, propsClienteNombre, whatsappNumero, chatToken, sessionStorageKey, iniciarChat]);

  // Leer sessionId de storage solo en cliente (evitar cascading renders con setTimeout)
  // Público NO usa sessionStorage: siempre inicia sesión nueva/reutilizada vía obtenerOCrearSesionPublica
  useEffect(() => {
    if (esPublico) return;
    if (typeof window !== "undefined" && !sessionId) {
      const saved = sessionStorage.getItem(sessionStorageKey);
      if (saved) {
        setTimeout(() => setSessionId(saved), 0);
      }
    }
  }, [esPublico, sessionStorageKey, sessionId]);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading && mensajes.length === 0) {
    return <BrickLoader />;
  }

  if (errorEsFatal) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          {!esPublico && (
            <button onClick={nuevaConversacion} className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg">
              Nueva conversación
            </button>
          )}
          {esPublico && (
            <a href={`https://wa.me/${WHATSAPP_NUMERO}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg">
              Escribir por WhatsApp
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900">
      {/* Cabecera con insignia de agente */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 flex items-center gap-3 shrink-0">
        <AiAvatar size={28} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-neutral-900 dark:text-white truncate">
            {agenteUI?.etiqueta || (esAdmin ? "Asistente del panel" : esPublico ? "Asistente de cotización" : "Asistente de su cuenta")}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
            {agenteUI?.descripcion || (esAdmin ? "Gestión del negocio con confirmación humana" : esPublico ? "Resuelve dudas sobre su cotización" : "Consulta sus datos y gestiona su cuenta")}
          </p>
        </div>
        {expiraEn && (
          <span className="text-xs text-amber-600 dark:text-amber-400 whitespace-nowrap">
            Expira: {new Date(expiraEn).toLocaleString("es-BO", { timeZone: "America/La_Paz" })}
          </span>
        )}
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderSugerencias}
        {mensajes.map((msg) => (
          <div key={msg.id} className={`flex ${msg.rol === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[${msg.accionIds?.length ? "95%" : "85%"}] rounded-2xl px-3 py-3 ${msg.rol === "user"
                ? "bg-amber-500 text-white shadow-md"
                : "bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm text-neutral-900 dark:text-white"}`}
            >
              <RenderTextoChat texto={msg.contenido} />
              {msg.accionIds?.map((id) => (
                <div key={id} className="mt-2">
                  {acciones[id] && <TarjetaAccion key={id} accion={acciones[id]} onFinalizada={alFinalizarAccion} />}
                </div>
              ))}
            </div>
          </div>
        ))}
        {loading && <BrickLoader />}
      </div>

      {/* Tarjetas de acción sueltas (al final del chat) */}
      <div className="px-4 pb-2 space-y-2">
        {renderAcciones}
      </div>

      {/* Input zone */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => { if (e.key === "Enter") { e.preventDefault(); enviarMensaje(); } }}
            placeholder={modoBorrador ? "Escribe tu primera pregunta…" : "Escribe tu pregunta…"}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
          />
          <button
            onClick={enviarMensaje}
            disabled={loading || !input.trim()}
            className="p-3 rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Enviar mensaje"
          >
            <SendIcon size={20} />
          </button>
        </div>
        {error && !errorEsFatal && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}

export default ChatPanel;
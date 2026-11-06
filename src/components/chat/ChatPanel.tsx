"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

import { WHATSAPP_NUMERO } from "@/lib/constants";
import { AudioMensaje } from "./AudioMensaje";
import AiAvatar from "./AiAvatar";
import SendIcon from "./SendIcon";
import BrickLoader from "./BrickLoader";

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
            // Ignorar líneas de datos malformadas
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

interface CotizacionData {
  tipoObra: string;
  tipoConstruccion: string;
  rangoM2: string;
  plazoInicio: string;
}

interface Mensaje {
  id: string;
  rol: "user" | "assistant";
  contenido: string;
  creadoEn: string;
}

interface ChatPanelProps {
  clienteId?: string;
  cotizacionId?: string;
  clienteNombre?: string;
  whatsappNumero?: string;
  cotizacionData?: CotizacionData;
  chatToken?: string;
  esAdmin?: boolean;
  initialSessionId?: string;
}

export function ChatPanel({
  clienteId,
  cotizacionId,
  clienteNombre,
  whatsappNumero = WHATSAPP_NUMERO,
  cotizacionData,
  chatToken,
  esAdmin = false,
  initialSessionId,
}: ChatPanelProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorEsFatal, setErrorEsFatal] = useState(false);

  const sessionStorageKey = initialSessionId
    ? `chat_admin_${initialSessionId}`
    : cotizacionId
      ? `chat_${cotizacionId}`
      : esAdmin
        ? `chat_admin`
        : clienteId
          ? `chat_cliente_${clienteId}`
          : `chat_admin`;

  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const ultimoInicioRef = useRef<string | null>(null);

  // ─── Estado de TTS (Web Speech API) ─────────────────────────
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ttsRate, setTtsRate] = useState<number>(() => {
    if (typeof window === "undefined") return 1.0;
    try {
      const saved = localStorage.getItem("tts-rate");
      return saved ? parseFloat(saved) : 1.0;
    } catch {
      return 1.0;
    }
  });
  const [ttsVoiceName, setTtsVoiceName] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem("tts-voice") ?? null;
    } catch {
      return null;
    }
  });
  const [reproduciendoId, setReproduciendoId] = useState<string | null>(null);
  const [estaPausado, setEstaPausado] = useState<boolean>(false);
  const [configPos, setConfigPos] = useState<{ x: number; y: number } | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [mensajes]);

  // Cargar voces del navegador
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const cargarVoces = () => {
      setVoices(speechSynthesis.getVoices());
    };

    cargarVoces();
    speechSynthesis.addEventListener("voiceschanged", cargarVoces);

    return () => {
      speechSynthesis.removeEventListener("voiceschanged", cargarVoces);
    };
  }, []);

  // Leer sessionId de sessionStorage solo en cliente (evita crash SSR)
  useEffect(() => {
    const saved = sessionStorage.getItem(sessionStorageKey);
    if (saved && !sessionId) {
      setSessionId(saved);
    }
  }, [sessionStorageKey, sessionId]);

  // Cerrar popover de config al hacer clic fuera
  useEffect(() => {
    if (configPos === null) return;
    const manejarClickFuera = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setConfigPos(null);
      }
    };
    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, [configPos]);

  const iniciarChat = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Generar sessionId del lado del cliente para que el backend lo use
    const clientSessionId = crypto.randomUUID();

    try {
      const bodyInicio: Record<string, unknown> = {
        mensaje: "__INICIO__",
        sessionId: clientSessionId,
        whatsappNumero,
        t: chatToken,
        sitioBaseUrl:
          typeof window !== "undefined" ? window.location.origin : "",
      };

      if (!esAdmin) {
        if (clienteId) bodyInicio.clienteId = clienteId;
        if (cotizacionId) bodyInicio.cotizacionId = cotizacionId;
        if (clienteNombre) bodyInicio.clienteNombre = clienteNombre;
        if (cotizacionData) bodyInicio.cotizacionData = cotizacionData;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyInicio),
      });

      if (!res.ok) {
        let mensaje = "Error al iniciar el chat";
        try {
          const body = await res.json();
          if (body.error?.message) {
            mensaje = body.error.message;
          }
        } catch {
          // ignorar, usar mensaje por defecto
        }
        setError(mensaje);
        setErrorEsFatal(res.status === 404 || res.status === 429);
        if (res.status === 404 || res.status === 429) {
          sessionStorage.removeItem(sessionStorageKey);
          setSessionId(null);
        }
        setLoading(false);
        return;
      }

      // Leer stream SSE y acumular texto del asistente
      let textoCompleto = "";

      for await (const data of leerSSE(res)) {
        if (data.type === "text" && data.text) {
          textoCompleto += data.text;
        }
      }

      setErrorEsFatal(false);
      sessionStorage.setItem(sessionStorageKey, clientSessionId);
      setSessionId(clientSessionId);

      // Crear mensaje del asistente con el texto completo
      if (textoCompleto.trim()) {
        setMensajes((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            rol: "assistant",
            contenido: textoCompleto,
            creadoEn: new Date().toISOString(),
          },
        ]);
      } else {
        setError(
          "El asistente no devolvió respuesta. Intenta de nuevo en unos segundos."
        );
      }
    } catch {
      setError(
        "Lo siento, tuve un problema técnico. Intenta de nuevo en unos segundos."
      );
    } finally {
      setLoading(false);
    }
  }, [clienteId, cotizacionId, clienteNombre, whatsappNumero, cotizacionData, chatToken, sessionStorageKey]);

  // Cargar historial cuando se establece un sessionId existente
  const cargarHistorial = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    setErrorEsFatal(false);
    try {
      const url = chatToken
        ? `/api/chat?sessionId=${encodeURIComponent(sessionId)}&t=${encodeURIComponent(chatToken)}`
        : `/api/chat?sessionId=${encodeURIComponent(sessionId)}`;
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) {
          sessionStorage.removeItem(sessionStorageKey);
          setSessionId(null);
          setTimeout(() => iniciarChat(), 0);
          return;
        }
        throw new Error("Error al cargar historial");
      }
      const data = await res.json();
      if (data.mensajes && data.mensajes.length > 0) {
        setMensajes(
          data.mensajes.map((m: Mensaje) => ({
            id: m.id,
            rol: m.rol,
            contenido: m.contenido,
            creadoEn: m.creadoEn,
          }))
        );
      }
    } catch {
      setError("No se pudo cargar el historial de la conversación.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, sessionStorageKey, iniciarChat, chatToken]);

  useEffect(() => {
    if (sessionId) {
      cargarHistorial();
    }
  }, [sessionId, cargarHistorial]);

  // Cuando cambian cliente o cotización, reiniciar el chat completamente
  // para que no se mezclen datos de clientes anteriores
  useEffect(() => {
    // En modo admin con sessionId explícito, no auto-iniciar sesión nueva
    if (esAdmin && initialSessionId) return;

    const claveActual = `${clienteId}|${cotizacionId ?? "sin-cotizacion"}`;
    if (ultimoInicioRef.current === claveActual) return;

    // Limpiar estado previo
    setMensajes([]);
    setError(null);
    setInput("");

    // Borrar sessionStorage de la clave anterior si existe
    const claveAnterior = ultimoInicioRef.current;
    if (claveAnterior && claveAnterior !== claveActual) {
      const partes = claveAnterior.split("|");
      const anteriorCotizacion = partes[1];
      if (anteriorCotizacion && anteriorCotizacion !== "sin-cotizacion") {
        sessionStorage.removeItem(`chat_${anteriorCotizacion}`);
      }
    }

    ultimoInicioRef.current = claveActual;

    // Si no hay sesión guardada para esta clave, iniciar una nueva
    if (!sessionId) {
      setTimeout(() => iniciarChat(), 0);
    }
  }, [clienteId, cotizacionId, sessionStorageKey, iniciarChat]);

  async function enviarMensaje() {
    if (!input.trim() || !sessionId) return;

    const texto = input.trim();
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

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje: texto,
          sessionId,
        }),
      });

      if (!res.ok) {
        let mensaje = "Error al enviar el mensaje";
        let esFatal = false;
        try {
          const body = await res.json();
          if (body.error?.message) {
            mensaje = body.error.message;
          }
          if (
            body.error?.code === "SESION_NO_ENCONTRADA" ||
            body.error?.code === "SESION_LIMITE"
          ) {
            esFatal = true;
          }
        } catch {
          // ignorar, usar mensaje por defecto
        }
        setError(mensaje);
        setErrorEsFatal(esFatal);
        if (esFatal) {
          sessionStorage.removeItem(sessionStorageKey);
          setSessionId(null);
        }
        setLoading(false);
        return;
      }

      // Leer stream SSE y acumular texto del asistente
      let textoCompleto = "";
      let mensajeId: string | null = null;

      for await (const data of leerSSE(res)) {
        if (data.type === "text" && data.text) {
          textoCompleto += data.text;
        }
        if (data.id) mensajeId = data.id;
      }

      // Si no hay texto del asistente, mostrar error específico en vez de respuesta vacía
      if (!textoCompleto.trim()) {
        setMensajes((prev) => [
          ...prev.filter((m) => m.id !== mensajeOptimista.id),
          {
            id: `user-${Date.now()}`,
            rol: "user",
            contenido: texto,
            creadoEn: new Date().toISOString(),
          },
        ]);
        setError(
          "El asistente no devolvió respuesta. Intenta de nuevo en unos segundos."
        );
        setLoading(false);
        return;
      }

      // Reemplazar mensaje optimista del usuario y agregar respuesta del asistente
      setMensajes((prev) => [
        ...prev.filter((m) => m.id !== mensajeOptimista.id),
        {
          id: `user-${Date.now()}`,
          rol: "user",
          contenido: texto,
          creadoEn: new Date().toISOString(),
        },
        {
          id: mensajeId ?? `msg-${Date.now()}`,
          rol: "assistant",
          contenido: textoCompleto,
          creadoEn: new Date().toISOString(),
        },
      ]);
    } catch {
      setMensajes((prev) => [
        ...prev.filter((m) => m.id !== mensajeOptimista.id),
        {
          id: `user-${Date.now()}`,
          rol: "user",
          contenido: texto,
          creadoEn: new Date().toISOString(),
        },
        {
          id: `temp-error-${Date.now()}`,
          rol: "assistant",
          contenido: "Lo siento, tuve un problema técnico. Intenta de nuevo en unos segundos.",
          creadoEn: new Date().toISOString(),
        },
      ]);
      setError(
        "Lo siento, tuve un problema técnico. Intenta de nuevo en unos segundos."
      );
    } finally {
      setLoading(false);
    }
  }

  const nuevaConversacion = useCallback(() => {
    sessionStorage.removeItem(sessionStorageKey);
    setSessionId(null);
    setMensajes([]);
    setError(null);
    setErrorEsFatal(false);
    setInput("");
    setTimeout(() => iniciarChat(), 0);
  }, [sessionStorageKey, iniciarChat]);

  // Voces ordenadas: español primero, dentro de ellas Neural/Natural primero
  const vocesOrdenadas = useMemo(() => {
    const es = voices.filter((v) => v.lang.startsWith("es"));
    const otros = voices.filter((v) => !v.lang.startsWith("es"));
    const ordenar = (arr: SpeechSynthesisVoice[]) =>
      arr.sort((a, b) => {
        const aNeural = /neural|natural/i.test(a.name) ? 0 : 1;
        const bNeural = /neural|natural/i.test(b.name) ? 0 : 1;
        if (aNeural !== bNeural) return aNeural - bNeural;
        return a.name.localeCompare(b.name);
      });
    return [...ordenar(es), ...ordenar(otros)];
  }, [voices]);

  // Toggle play/pausa por mensaje (exclusividad: solo uno a la vez)
  const togglePlay = useCallback(
    (id: string, texto: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      // Mismo mensaje y está sonando → pausar
      if (reproduciendoId === id && !estaPausado) {
        speechSynthesis.pause();
        setEstaPausado(true);
        return;
      }

      // Mismo mensaje y está pausado → reanudar
      if (reproduciendoId === id && estaPausado) {
        speechSynthesis.resume();
        setEstaPausado(false);
        return;
      }

      // Mensaje distinto: cancelar anterior y reproducir el nuevo
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      u.rate = ttsRate;
      if (ttsVoiceName) {
        const voice = voices.find((v) => v.name === ttsVoiceName);
        if (voice) u.voice = voice;
      }
      u.onend = () => {
        setReproduciendoId(null);
        setEstaPausado(false);
        utteranceRef.current = null;
      };
      u.onerror = () => {
        setReproduciendoId(null);
        setEstaPausado(false);
        utteranceRef.current = null;
      };
      utteranceRef.current = u;
      setReproduciendoId(id);
      setEstaPausado(false);
      speechSynthesis.speak(u);
    },
    [reproduciendoId, estaPausado, ttsRate, ttsVoiceName, voices]
  );

  const cambiarRate = useCallback(
    (rate: number) => {
      setTtsRate(rate);
      try {
        localStorage.setItem("tts-rate", String(rate));
      } catch {
        // ignorar
      }
      // Aplicar inmediatamente a la reproducción en curso
      if (utteranceRef.current) {
        utteranceRef.current.rate = rate;
      }
    },
    []
  );

  const cambiarVoice = useCallback(
    (voiceName: string | null) => {
      setTtsVoiceName(voiceName);
      try {
        if (voiceName) {
          localStorage.setItem("tts-voice", voiceName);
        } else {
          localStorage.removeItem("tts-voice");
        }
      } catch {
        // ignorar
      }
      // Aplicar inmediatamente a la reproducción en curso
      if (utteranceRef.current && voiceName) {
        const voice = voices.find((v) => v.name === voiceName);
        if (voice) utteranceRef.current.voice = voice;
      }
    },
    [voices]
  );

  const panelClasses =
    "bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col h-[600px]";

  return (
    <div className={panelClasses}>
      {/* Header del chat */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <AiAvatar size={40} className="shrink-0" />
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              Asistente CONSTR-ART
            </h3>
            <p className="text-sm text-[var(--chat-muted)]">
              {esAdmin
                ? "Responde tus dudas sobre clientes, cotizaciones, contratos, obras e inventario del negocio."
                : cotizacionData
                  ? "Te ayuda con tu cotización, dudas sobre construcción y el proceso de obra"
                  : "Responde tus dudas sobre construcción y el proceso de obra. No hay una cotización activa vinculada todavía."}
            </p>
          </div>
        </div>
      </div>

      {/* Banner de error (solo cuando hay error) */}
      {error && (
        <div className="px-6 py-3 shrink-0">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            {errorEsFatal && (
              <button
                onClick={nuevaConversacion}
                className="mt-3 text-xs text-amber-600 dark:text-amber-400 underline underline-offset-4 hover:text-amber-800 dark:hover:text-amber-300"
              >
                Nueva conversación
              </button>
            )}
          </div>
        </div>
      )}

      {/* Área de mensajes */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-neutral-50 dark:bg-neutral-900/50"
      >
        {mensajes.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.rol === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-3 ${
                msg.rol === "user"
                  ? "bg-[var(--chat-user-bg)] text-[var(--chat-user-fg)] shadow-md"
                  : "bg-[var(--chat-bot-bg)] border border-[var(--chat-bot-border)] shadow-sm text-[var(--chat-bot-fg)]"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.contenido}
              </p>
              {msg.rol === "assistant" && (
                <AudioMensaje
                  texto={msg.contenido}
                  estaActivo={reproduciendoId === msg.id}
                  estaPausado={estaPausado}
                  ttsRate={ttsRate}
                  ttsVoiceName={ttsVoiceName}
                  voices={vocesOrdenadas}
                  onTogglePlay={() => togglePlay(msg.id, msg.contenido)}
                  onCopiar={() => {}}
                  onAbrirConfig={(e) => setConfigPos({ x: e.clientX, y: e.clientY })}
                  onRateChange={cambiarRate}
                  onVoiceChange={cambiarVoice}
                />
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--chat-bot-bg)] border border-[var(--chat-bot-border)] rounded-2xl shadow-sm px-3 py-3 text-[var(--chat-bot-fg)]">
              <BrickLoader />
            </div>
          </div>
        )}
      </div>

      {/* Zona de input */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                enviarMensaje();
              }
            }}
            placeholder="Escribe tu pregunta..."
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
          />
          <button
            onClick={enviarMensaje}
            disabled={loading || !input.trim()}
            className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-md hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
            aria-label="Enviar mensaje"
          >
            <SendIcon size={20} />
          </button>
        </div>
        <p className="text-xs text-[var(--chat-muted)] mt-2 text-center">
          {esAdmin
            ? "Respondo en segundos · Chat del administrador"
            : cotizacionData
              ? "Respondo en segundos · Basado en tu cotización"
              : "Respondo en segundos · Chat general del cliente"}
        </p>

        {/* Popover de configuración de audio (posicionado donde se clickeó) */}
        {configPos && (
          <div
            ref={popoverRef}
            className="fixed bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-3 z-50"
            style={{ left: configPos.x, top: configPos.y }}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                Velocidad
              </label>
              <span className="text-xs font-mono text-neutral-900 dark:text-white">
                {ttsRate.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={ttsRate}
              onChange={(e) => cambiarRate(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer mb-4"
            />
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider block mb-2">
              Voz
            </label>
            <select
              value={ttsVoiceName ?? ""}
              onChange={(e) => cambiarVoice(e.target.value || null)}
              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="">Sistema (predeterminada)</option>
              {vocesOrdenadas.map((v) => (
                <option key={v.voiceURI} value={v.name}>
                  {v.name} - {v.lang}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

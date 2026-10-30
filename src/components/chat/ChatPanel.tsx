"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { WHATSAPP_NUMERO } from "@/lib/constants";

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
  clienteId: string;
  cotizacionId: string;
  clienteNombre: string;
  whatsappNumero?: string;
  cotizacionData: CotizacionData;
}

export function ChatPanel({
  clienteId,
  cotizacionId,
  clienteNombre,
  whatsappNumero = WHATSAPP_NUMERO,
  cotizacionData,
}: ChatPanelProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(`chat_${cotizacionId}`);
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const iniciadoRef = useRef(false);

  const sessionStorageKey = `chat_${cotizacionId}`;

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  // Detectar prefers-reduced-motion
  const prefersReducedMotion = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  const iniciarChat = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje: "__INICIO__",
          clienteId,
          cotizacionId,
          clienteNombre,
          whatsappNumero,
          sitioBaseUrl: typeof window !== "undefined" ? window.location.origin : "",
          cotizacionData,
        }),
      });

      if (!res.ok) {
        throw new Error("Error al iniciar el chat");
      }

      const data = await res.json();

      if (data.sessionId) {
        setSessionId(data.sessionId);
        sessionStorage.setItem(sessionStorageKey, data.sessionId);
      }

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
      setError(
        "Lo siento, tuve un problema técnico. Intenta de nuevo en unos segundos."
      );
    } finally {
      setLoading(false);
    }
  }, [clienteId, cotizacionId, clienteNombre, cotizacionData, sessionStorageKey, whatsappNumero]);

  // Iniciar chat al montar si no hay sesión guardada
  useEffect(() => {
    if (sessionId) return;
    if (iniciadoRef.current) return;
    iniciadoRef.current = true;
    iniciarChat();
  }, [sessionId, iniciarChat]);

  // Apertura automática tras 2 segundos (respetando prefers-reduced-motion)
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      // Placeholder para futuras animaciones de entrada
    }, prefersReducedMotion ? 0 : 2000);

    return () => clearTimeout(timer);
  }, [isOpen, prefersReducedMotion]);

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
        throw new Error("Error al enviar el mensaje");
      }

      const data = await res.json();

      setMensajes((prev) => [
        ...prev.filter((m) => m.id !== mensajeOptimista.id), // quitar mensaje optimista temporal
        {
          id: `user-${Date.now()}`,
          rol: "user",
          contenido: texto,
          creadoEn: new Date().toISOString(),
        }, // conservar mensaje del usuario
        {
          id: data.mensajeId ?? `temp-${Date.now()}`,
          rol: "assistant",
          contenido: data.respuesta ?? "Lo siento, no pude obtener una respuesta.",
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

  function cerrarPanel() {
    setIsOpen(false);
  }

  function abrirPanel() {
    setIsOpen(true);
    setError(null);
  }

  const panelClasses = isOpen
    ? "translate-x-0 transition-transform duration-300 ease-in-out"
    : "translate-x-full transition-transform duration-300 ease-in-out";

  return (
    <>
      {/* Botón para reabrir si se cerró */}
      {!isOpen && (
        <button
          onClick={abrirPanel}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition"
          aria-label="Abrir chat de asistencia"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <span className="font-medium hidden sm:inline">¿Tienes dudas?</span>
        </button>
      )}

      {/* Overlay (solo cuando está abierto y en desktop se puede cerrar haciendo clic fuera) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity sm:hidden"
          onClick={cerrarPanel}
          aria-hidden="true"
        />
      )}

      {/* Panel de chat (slide-over) */}
      {isOpen && (
        <div
          className={`fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white dark:bg-neutral-900 shadow-2xl z-50 flex flex-col ${panelClasses}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Asistente virtual
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Te ayudo con tu cotización
                </p>
              </div>
            </div>
            <button
              onClick={cerrarPanel}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition"
              aria-label="Cerrar chat"
            >
              <svg
                className="w-5 h-5 text-neutral-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {error && (
              <div className="rounded bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
                {error}
              </div>
            )}

            {mensajes.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.rol === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.rol === "user"
                      ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.contenido}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && enviarMensaje()}
                placeholder="Escribe tu pregunta..."
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
              />
              <button
                onClick={enviarMensaje}
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
            <p className="text-xs text-neutral-400 mt-2 text-center">
              Respondo en segundos • Basado en tu cotización
            </p>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send } from "lucide-react";

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
          sitioBaseUrl:
            typeof window !== "undefined" ? window.location.origin : "",
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
  }, [clienteId, cotizacionId, clienteNombre, whatsappNumero, cotizacionData, sessionStorageKey]);

  // Iniciar chat al montar si no hay sesión guardada
  useEffect(() => {
    if (sessionId) return;
    if (iniciadoRef.current) return;
    iniciadoRef.current = true;
    iniciarChat();
  }, [sessionId, iniciarChat]);

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
        ...prev.filter((m) => m.id !== mensajeOptimista.id),
        {
          id: `user-${Date.now()}`,
          rol: "user",
          contenido: texto,
          creadoEn: new Date().toISOString(),
        },
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

  const panelClasses =
    "bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col h-[600px]";

  return (
    <div className={panelClasses}>
      {/* Header del chat */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-white"
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
      </div>

      {/* Banner de error (solo cuando hay error) */}
      {error && (
        <div className="px-6 py-3 shrink-0">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        </div>
      )}

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-neutral-50 dark:bg-neutral-900/50">
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
                  ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md"
                  : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm text-neutral-900 dark:text-white"
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
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-sm px-3 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Zona de input */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && enviarMensaje()}
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
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 text-center">
          Respondo en segundos · Basado en tu cotización
        </p>
      </div>
    </div>
  );
}

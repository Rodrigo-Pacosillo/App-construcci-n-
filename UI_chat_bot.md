Perfecto, veo tu página de éxito actual. Es minimalista y profesional. Para integrar el chatbot de forma que respete tu UI y sea efectivo, te recomiendo **una combinación estratégica**:

## 🎨 Opción recomendada: **Panel lateral (slide-over) que se abre automáticamente**

### Por qué esta opción:
1. **No rompe el flujo**: El usuario ve el mensaje de éxito primero, luego el chat aparece suavemente
2. **Espacio adecuado**: Tiene suficiente espacio para conversar cómodamente
3. **No intrusivo**: Se puede cerrar y volver a abrir
4. **Responsive**: En móvil se adapta bien
5. **Consistente**: Se integra con tu diseño actual

### Implementación visual:

```
┌─────────────────────────────────────────────────┐
│  HEADER (nav actual)                             │
──────────────────────────────┬──────────────────┤
│                              │                  │
│   CONTENIDO PRINCIPAL        │   PANEL CHAT     │
│                              │   (slide-over)   │
│   ✓ Su solicitud fue         │   ┌──────────┐  │
│     enviada                  │   │ Asistente│  │
│                              │   ├──────────┤  │
│   Nos comunicaremos...       │   │Mensaje 1 │  │
│                              │   │Mensaje 2 │  │
│   [Resumen cotización]       │   │          │  │
│                              │   │Input ____│  │
│                              │   └──────────┘  │
│                              │                  │
└──────────────────────────────┴──────────────────┘
```

### Código del componente (respetando modo claro/oscuro):

```typescript
// src/components/chat/ChatPanel.tsx
"use client";
import { useState, useEffect, useRef } from "react";

interface ChatPanelProps {
  clienteId: string;
  cotizacionId: string;
  clienteNombre: string;
  cotizacionData: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatPanel({
  clienteId,
  cotizacionId,
  clienteNombre,
  cotizacionData,
  isOpen,
  onClose,
}: ChatPanelProps) {
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  // Cargar/mantener sesión
  useEffect(() => {
    if (isOpen && mensajes.length === 0) {
      iniciarChat();
    }
  }, [isOpen]);

  async function iniciarChat() {
    setLoading(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId,
        cotizacionId,
        clienteNombre,
        cotizacionData,
        mensaje: "__INICIO__",
      }),
    });
    const data = await res.json();
    setMensajes(data.mensajes);
    setLoading(false);
  }

  async function enviarMensaje() {
    if (!input.trim()) return;

    const nuevoMensaje = {
      id: `temp-${Date.now()}`,
      rol: "user" as const,
      contenido: input,
      creadoEn: new Date().toISOString(),
    };

    setMensajes([...mensajes, nuevoMensaje]);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mensaje: input,
        sessionId: mensajes[0]?.sessionId,
      }),
    });

    const data = await res.json();
    const respuesta = {
      id: data.mensajeId,
      rol: "assistant" as const,
      contenido: data.respuesta,
      creadoEn: new Date().toISOString(),
    };

    setMensajes([...mensajes, nuevoMensaje, respuesta]);
    setLoading(false);
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white dark:bg-neutral-900 shadow-2xl z-50 flex flex-col transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
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
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition"
          >
            <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {mensajes.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.rol === "user" ? "justify-end" : "justify-start"}`}
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
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
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
              className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              disabled={loading}
            />
            <button
              onClick={enviarMensaje}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-neutral-400 mt-2 text-center">
            Respondo en segundos • Basado en tu cotización
          </p>
        </div>
      </div>
    </>
  );
}
```

### Cómo integrarlo en tu página de éxito:

```typescript
// src/app/(public)/cotizacion/exito/page.tsx
"use client";
import { useState, useEffect } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";

export default function ExitoPage({ searchParams }: { searchParams: any }) {
  const [showChat, setShowChat] = useState(false);

  // Abrir chat automáticamente después de 2 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowChat(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Tu contenido actual de éxito */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
            Su solicitud fue enviada
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
            Nos comunicaremos con usted en menos de 24 horas para coordinar una visita técnica.
          </p>
        </div>

        {/* Botón para abrir chat manualmente si lo cerró */}
        {!showChat && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowChat(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              ¿Tienes dudas? Chatea con nuestro asistente
            </button>
          </div>
        )}
      </div>

      {/* Panel de chat */}
      <ChatPanel
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        clienteId={searchParams.clienteId}
        cotizacionId={searchParams.cotizacionId}
        clienteNombre={searchParams.clienteNombre}
        cotizacionData={searchParams.cotizacionData}
      />
    </div>
  );
}
```

### Alternativa: **Widget flotante tipo burbuja** (menos intrusivo)

Si prefieres algo más discreto, puedes poner un botón flotante (similar al de WhatsApp que ya tienes) que diga "¿Necesitas ayuda?" y al hacer clic se abra el chat:

```typescript
// Botón flotante en la esquina inferior derecha
<button
  onClick={() => setShowChat(true)}
  className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition"
>
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
  <span className="font-medium">¿Tienes dudas?</span>
</button>
```

## 🎯 Mi recomendación final

**Usa el panel lateral (slide-over)** porque:
1. ✅ Se integra perfecto con tu UI actual (modo claro/oscuro)
2. ✅ Aparece automáticamente pero no bloquea
3. ✅ Tiene espacio suficiente para conversar
4. ✅ El usuario puede cerrarlo y seguir viendo el mensaje de éxito
5. ✅ En móvil ocupa toda la pantalla (mejor UX)
6. ✅ Es consistente con patrones modernos de chat

¿Quieres que te ayude a implementar alguna de estas opciones?
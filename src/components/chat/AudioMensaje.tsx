"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Pause, Play, Settings } from "lucide-react";
import { useHidratado } from "@/lib/chat/useHidratado";
import { textoParaLeer, useTextToSpeech } from "@/lib/chat/useTextToSpeech";

type AudioMensajeProps = {
  mensajeId: string;
  texto: string;
};

/**
 * Acciones de un mensaje del asistente: copiar el texto y leerlo en voz alta.
 *
 * La fila se renderiza solo después de la hidratación porque `speechSynthesis`
 * no existe en el servidor; así el HTML del servidor y el del cliente coinciden.
 */
export function AudioMensaje({ mensajeId, texto }: AudioMensajeProps) {
  const hidratado = useHidratado();
  const [copiado, setCopiado] = useState(false);
  const [configAbierto, setConfigAbierto] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const textoPlano = textoParaLeer(texto);
  const {
    activo,
    pausado,
    ttsRate,
    ttsVoiceName,
    voices,
    alternar,
    cambiarVelocidad,
    cambiarVoz,
  } = useTextToSpeech(mensajeId, textoPlano);

  // Cerrar el popover al hacer clic fuera.
  useEffect(() => {
    if (!configAbierto) return;
    const manejarClickFuera = (evento: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(evento.target as Node)) {
        setConfigAbierto(false);
      }
    };
    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, [configAbierto]);

  const manejarCopiar = useCallback(async () => {
    if (!textoPlano) return;
    try {
      await navigator.clipboard.writeText(textoPlano);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // El navegador puede bloquear el portapapeles sin gesto de usuario.
    }
  }, [textoPlano]);

  if (!hidratado) return null;

  const audioDisponible =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const reproduciendo = activo && !pausado;

  return (
    <div className="relative mt-2 flex items-center gap-1 -ml-1">
      <button
        type="button"
        onClick={manejarCopiar}
        className="rounded p-1.5 text-neutral-500 transition-colors hover:bg-neutral-200/70 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
        title="Copiar mensaje"
        aria-label={copiado ? "Mensaje copiado" : "Copiar mensaje"}
      >
        {copiado ? (
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>

      {audioDisponible && (
        <button
          type="button"
          onClick={alternar}
          className="rounded p-1.5 text-neutral-500 transition-colors hover:bg-neutral-200/70 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
          title={pausado ? "Reanudar audio" : reproduciendo ? "Pausar audio" : "Reproducir audio"}
          aria-label={
            pausado ? "Reanudar audio" : reproduciendo ? "Pausar audio" : "Reproducir audio"
          }
        >
          {reproduciendo ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
      )}

      {audioDisponible && voices.length > 0 && (
        <div className="relative" onClick={(evento) => evento.stopPropagation()}>
          <button
            type="button"
            onClick={(evento) => {
              evento.stopPropagation();
              setConfigAbierto((abierto) => !abierto);
            }}
            className="rounded p-1.5 text-neutral-500 transition-colors hover:bg-neutral-200/70 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
            title="Configuración de audio"
            aria-label="Configuración de audio"
            aria-expanded={configAbierto}
          >
            <Settings className="h-4 w-4" />
          </button>

          {configAbierto && (
            <div
              ref={popoverRef}
              className="absolute bottom-full right-0 z-50 mb-2 w-64 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  Velocidad
                </span>
                <span className="font-mono text-xs text-neutral-900 dark:text-white">
                  {ttsRate.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={ttsRate}
                onChange={(evento) => cambiarVelocidad(parseFloat(evento.target.value))}
                aria-label="Velocidad de lectura"
                className="w-full cursor-pointer accent-amber-500"
              />

              <div className="mt-4">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  Voz
                </label>
                <select
                  value={ttsVoiceName ?? ""}
                  onChange={(evento) => cambiarVoz(evento.target.value || null)}
                  aria-label="Voz de lectura"
                  className="w-full cursor-pointer rounded border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                >
                  <option value="">Sistema (predeterminada)</option>
                  {voices.map((voz) => (
                    <option key={voz.voiceURI} value={voz.name}>
                      {voz.name} - {voz.lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

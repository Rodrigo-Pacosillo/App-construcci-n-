"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Copy, Play, Pause, Settings, Check } from "lucide-react";

interface AudioMensajeProps {
  id: string;
  texto: string;
  estaActivo: boolean;
  estaPausado: boolean;
  ttsRate: number;
  ttsVoiceName: string | null;
  voices: SpeechSynthesisVoice[];
  onTogglePlay: () => void;
  onCopiar: () => void;
  onAbrirConfig: (e: React.MouseEvent) => void;
  onRateChange: (rate: number) => void;
  onVoiceChange: (voiceName: string | null) => void;
}

export function AudioMensaje({
  id,
  texto,
  estaActivo,
  estaPausado,
  ttsRate,
  ttsVoiceName,
  voices,
  onTogglePlay,
  onCopiar,
  onAbrirConfig,
  onRateChange,
  onVoiceChange,
}: AudioMensajeProps) {
  const [copiado, setCopiado] = useState(false);
  const [configAbierto, setConfigAbierto] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Cerrar popover al hacer clic fuera
  useEffect(() => {
    if (!configAbierto) return;
    const manejarClickFuera = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setConfigAbierto(false);
      }
    };
    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, [configAbierto]);

  const manejarCopiar = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
      onCopiar();
    } catch {
      // silencioso: el navegador puede bloquear clipboard sin gesto de usuario
    }
  }, [texto, onCopiar]);

  const toggleConfig = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onAbrirConfig(e);
    },
    [onAbrirConfig]
  );

  return (
    <div className="flex items-center gap-2 mt-2 ml-3 relative">
      {/* Icono 1: Copiar */}
      <button
        onClick={manejarCopiar}
        className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-neutral-500"
        title="Copiar texto"
        aria-label="Copiar mensaje"
      >
        {copiado ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>

      {/* Icono 2: Reproducir / Pausar (toggle) */}
      <button
        onClick={onTogglePlay}
        className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-neutral-500"
        title={estaPausado ? "Reanudar" : estaActivo ? "Pausar" : "Reproducir"}
        aria-label={
          estaPausado
            ? "Reanudar audio"
            : estaActivo
              ? "Pausar audio"
              : "Reproducir audio"
        }
      >
        {estaActivo && !estaPausado ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </button>

      {/* Icono 3: Config con popover */}
      <div
        className="relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={toggleConfig}
          className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-neutral-500"
          title="Configuración de audio"
          aria-label="Configuración de audio"
        >
          <Settings className="w-4 h-4" />
        </button>

        {configAbierto && (
          <div
            ref={popoverRef}
            className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-3 z-50"
          >
            {/* 5.1 Velocidad */}
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
              onChange={(e) => onRateChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />

            {/* 5.2 Voz */}
            <div className="mt-4">
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider block mb-2">
                Voz
              </label>
              <select
                value={ttsVoiceName ?? ""}
                onChange={(e) => onVoiceChange(e.target.value || null)}
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="">Sistema (predeterminada)</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.name}>
                    {v.name} - {v.lang}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Lectura en voz alta de los mensajes del chat.
 *
 * El navegador expone una única instancia global de `speechSynthesis`, por lo
 * que el estado vive en un store a nivel de módulo: solo un mensaje suena a la
 * vez y todas las burbujas reflejan el mismo estado.
 *
 * El audio se corta cuando el último mensaje suscrito se desmonta, de modo que
 * cambiar de chat (público, cliente o admin) no deja una voz reproduciéndose
 * sobre la pantalla siguiente.
 */

type EstadoTts = {
  activoId: string | null;
  pausado: boolean;
  ttsRate: number;
  ttsVoiceName: string | null;
  voices: SpeechSynthesisVoice[];
};

const ESTADO_INICIAL: EstadoTts = {
  activoId: null,
  pausado: false,
  ttsRate: 1,
  ttsVoiceName: null,
  voices: [],
};

let estado: EstadoTts = ESTADO_INICIAL;
const suscriptores = new Set<() => void>();

let vocesIniciadas = false;
let cancelacionPendiente: ReturnType<typeof setTimeout> | null = null;

function haySintesis(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function notificar() {
  for (const suscriptor of suscriptores) suscriptor();
}

function fijar(cambios: Partial<EstadoTts>) {
  estado = { ...estado, ...cambios };
  notificar();
}

function detener() {
  if (!haySintesis()) return;
  window.speechSynthesis.cancel();
  if (estado.activoId === null && !estado.pausado) return;
  fijar({ activoId: null, pausado: false });
}

// Las voces pueden llegar después del primer render; se escucha su carga una
// sola vez por página.
function cargarVoces() {
  if (!haySintesis() || vocesIniciadas) return;
  vocesIniciadas = true;

  const aplicar = () => {
    if (!haySintesis()) return;
    const voces = window.speechSynthesis.getVoices();
    if (voces.length > 0) fijar({ voices: voces });
  };

  aplicar();
  window.speechSynthesis.addEventListener("voiceschanged", aplicar);
}

function suscribir(suscriptor: () => void) {
  if (cancelacionPendiente) {
    clearTimeout(cancelacionPendiente);
    cancelacionPendiente = null;
  }

  suscriptores.add(suscriptor);
  cargarVoces();

  return () => {
    suscriptores.delete(suscriptor);
    if (suscriptores.size > 0) return;

    // Un re-render puede desmontar y volver a montar las burbujas sin que el
    // chat cambie; se espera un instante antes de cortar el audio.
    if (cancelacionPendiente) clearTimeout(cancelacionPendiente);
    cancelacionPendiente = setTimeout(() => {
      cancelacionPendiente = null;
      if (suscriptores.size === 0) detener();
    }, 0);
  };
}

function obtenerEstado(): EstadoTts {
  return estado;
}

function obtenerEstadoServidor(): EstadoTts {
  return ESTADO_INICIAL;
}

function alternarReproduccion(id: string, texto: string) {
  if (!haySintesis() || !texto.trim()) return;
  const sintesis = window.speechSynthesis;

  // Mismo mensaje: alterna entre pausa y reanudación.
  if (estado.activoId === id) {
    if (estado.pausado) {
      sintesis.resume();
      fijar({ pausado: false });
    } else {
      sintesis.pause();
      fijar({ pausado: true });
    }
    return;
  }

  sintesis.cancel();

  const locucion = new SpeechSynthesisUtterance(texto);
  locucion.rate = estado.ttsRate;

  const vozElegida = estado.ttsVoiceName
    ? estado.voices.find((voz) => voz.name === estado.ttsVoiceName)
    : undefined;
  if (vozElegida) {
    locucion.voice = vozElegida;
    locucion.lang = vozElegida.lang;
  } else {
    locucion.lang = "es-ES";
  }

  const finalizar = () => {
    if (estado.activoId === id) fijar({ activoId: null, pausado: false });
  };
  locucion.onend = finalizar;
  locucion.onerror = finalizar;

  fijar({ activoId: id, pausado: false });
  sintesis.speak(locucion);
}

function cambiarVelocidad(rate: number) {
  fijar({ ttsRate: rate });
}

function cambiarVoz(nombre: string | null) {
  fijar({ ttsVoiceName: nombre });
}

/**
 * Quita el marcado mínimo que usa el chat (`**negrita**`, `` `código` ``) para
 * que la voz no lea los símbolos.
 */
export function textoParaLeer(texto: string): string {
  return texto.replace(/\*\*/g, "").replace(/`/g, "").trim();
}

export function useTextToSpeech(id: string, texto: string) {
  const estadoActual = useSyncExternalStore(
    suscribir,
    obtenerEstado,
    obtenerEstadoServidor
  );

  const alternar = useCallback(() => {
    alternarReproduccion(id, texto);
  }, [id, texto]);

  return {
    activo: estadoActual.activoId === id,
    pausado: estadoActual.activoId === id && estadoActual.pausado,
    ttsRate: estadoActual.ttsRate,
    ttsVoiceName: estadoActual.ttsVoiceName,
    voices: estadoActual.voices,
    alternar,
    cambiarVelocidad,
    cambiarVoz,
  };
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WHATSAPP_NUMERO } from "@/lib/constants";
import { useHidratado } from "@/lib/chat/useHidratado";
import {
  leerSesionExito,
  limpiarSesionExito,
  tokenChatExpirado,
} from "@/lib/chat/sesionPublicaExito";

type Motivo = "sin_parametros" | "token_invalido";

/**
 * Recupera la pantalla de éxito desde el navegador cuando la URL llegó sin
 * parámetros (por ejemplo, al volver desde otra sección del sitio).
 * Si la conversación ya venció, muestra el estado finalizado con la opción
 * de iniciar una nueva cotización.
 */
export function RestaurarSesionExito({
  motivo = "sin_parametros",
}: {
  motivo?: Motivo;
}) {
  const router = useRouter();
  const hidratado = useHidratado();

  // Solo se lee el almacenamiento después de la hidratación: en el servidor
  // no existe y leerlo antes rompería la coincidencia del HTML.
  const sesion = hidratado ? leerSesionExito() : null;
  const cotizacionIdSesion = sesion?.cotizacionId ?? null;
  const tokenSesion = sesion?.token ?? null;
  const puedeRestaurar =
    hidratado &&
    motivo === "sin_parametros" &&
    cotizacionIdSesion !== null &&
    tokenSesion !== null &&
    !tokenChatExpirado(tokenSesion);

  useEffect(() => {
    if (!hidratado) return;

    if (puedeRestaurar && cotizacionIdSesion && tokenSesion) {
      const params = new URLSearchParams({
        cotizacionId: cotizacionIdSesion,
        t: tokenSesion,
      });
      // El servidor vuelve a verificar el token: aquí solo se restaura la URL.
      router.replace(`/cotizacion/exito?${params.toString()}`);
      return;
    }

    limpiarSesionExito();
  }, [hidratado, puedeRestaurar, cotizacionIdSesion, tokenSesion, router]);

  if (!hidratado || puedeRestaurar) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-neutral-950">
        <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
          <span
            className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-amber-500 dark:border-neutral-700 dark:border-t-amber-400"
            aria-hidden="true"
          />
          <p className="text-sm">Verificando su conversación…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-neutral-950">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <svg
            className="h-7 w-7 text-neutral-500 dark:text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h8M8 14h5m-9 7l3-3h9a3 3 0 003-3V7a3 3 0 00-3-3H7a3 3 0 00-3 3v11z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Su conversación finalizó
        </h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          El chat de esta cotización ya no está disponible. Puede enviar una
          nueva solicitud cuando lo desee.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => {
              limpiarSesionExito();
              router.push("/cotizacion");
            }}
            className="accent-btn w-full rounded py-3 text-sm font-medium sm:w-auto sm:px-6"
          >
            Realizar una nueva cotización
          </button>
          <a
            href={`https://wa.me/${WHATSAPP_NUMERO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            Escribir por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useSyncExternalStore } from "react";

const suscribir = () => () => {};

/**
 * Devuelve false durante el render del servidor y la hidratación inicial, y
 * true cuando el componente ya corre en el navegador.
 * Permite leer almacenamiento local sin provocar desajustes de hidratación
 * ni setear estado dentro de un efecto.
 */
export function useHidratado(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => true,
    () => false
  );
}

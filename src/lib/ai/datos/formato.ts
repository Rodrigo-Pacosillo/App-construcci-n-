import { formatFecha, formatFechaHora, formatMonto, formatPorcentaje } from "@/lib/format";
import { TZ_NEGOCIO } from "../config";

export function fechaNegocio(fecha: Date | string | null | undefined): string {
  if (!fecha) return "";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-BO", {
    timeZone: TZ_NEGOCIO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Convierte "YYYY-MM-DD" y opcional "HH:mm" (en TZ_NEGOCIO) a Date UTC.
 * Si no se pasa hora, devuelve mediodía UTC del día (para eventos de todo el día).
 * Lanza si la fecha no es válida (ej. 2026-02-31).
 */
export function instanteNegocio(fecha: string, hora?: string | null): Date {
  const partes = fecha.split("-").map(Number);
  if (partes.length !== 3 || partes.some(isNaN)) {
    throw new Error(`Fecha inválida: ${fecha}`);
  }
  const [y, m, d] = partes;
  const fechaTest = new Date(Date.UTC(y, m - 1, d));
  if (fechaTest.getUTCFullYear() !== y || fechaTest.getUTCMonth() !== m - 1 || fechaTest.getUTCDate() !== d) {
    throw new Error(`Fecha inexistente: ${fecha}`);
  }
  let hh = 12, mm = 0; // mediodía UTC para todo el día
  if (hora && /^\d{2}:\d{2}$/.test(hora)) {
    hh = Number(hora.slice(0, 2));
    mm = Number(hora.slice(3, 2));
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) throw new Error(`Hora inválida: ${hora}`);
  }
  // Convertir de TZ_NEGOCIO (America/La_Paz = UTC-4) a UTC
  const offsetHoras = 4; // La Paz no tiene DST
  return new Date(Date.UTC(y, m - 1, d, hh + offsetHoras, mm, 0, 0));
}

export { formatFecha, formatFechaHora, formatMonto, formatPorcentaje };

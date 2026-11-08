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

export { formatFecha, formatFechaHora, formatMonto, formatPorcentaje };

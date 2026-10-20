// ─── Formateo coherente para el panel admin (§4.2) ─────────────────
// La especificación exige "formato coherente de fechas, importes y
// teléfonos" en todas las listas. Estos helpers son la única fuente.

/**
 * Fecha corta: 20/10/2026. Acepta Date o string ISO.
 */
export function formatFecha(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Fecha y hora: 20/10/2026 14:30.
 */
export function formatFechaHora(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Importe en bolivianos: Bs 12.500,00. Acepta number o Decimal serializado.
 */
export function formatMonto(monto: number | string | null | undefined): string {
  if (monto === null || monto === undefined || monto === "") return "—";
  const n = typeof monto === "string" ? Number(monto) : monto;
  if (Number.isNaN(n)) return "—";
  return `Bs ${n.toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Teléfono en formato legible. No inventa dígitos: si no se puede
 * normalizar, devuelve el valor original sin cambios.
 */
export function formatTelefono(telefono: string | null | undefined): string {
  if (!telefono) return "—";
  return telefono.trim();
}

/**
 * Normaliza un teléfono para un enlace de WhatsApp: solo dígitos.
 */
export function telefonoParaWhatsApp(telefono: string | null | undefined): string {
  if (!telefono) return "";
  return telefono.replace(/\D/g, "");
}

/**
 * Formatea un porcentaje entero: 45%.
 */
export function formatPorcentaje(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  return `${valor}%`;
}

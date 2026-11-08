// Normalizacion de texto/telefono para resolvers (Fase 2).

export function normalizarTexto(s: string): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizarTelefono(s: string): string {
  const digitos = (s ?? "").replace(/\D/g, "");
  // Quitar prefijo de pais 591 si esta presente.
  if (digitos.startsWith("591") && digitos.length > 8) {
    return digitos.slice(3);
  }
  return digitos;
}

export function tokenizar(s: string): string[] {
  const norm = normalizarTexto(s);
  // Separar por espacios y signos basicos.
  return norm.split(/[^a-z0-9@._+-]+/).filter(Boolean);
}

export function esCorreo(token: string): boolean {
  return token.includes("@");
}

export function esTelefono(token: string): boolean {
  const d = token.replace(/\D/g, "");
  return d.length >= 6 && /^\d+$/.test(d);
}

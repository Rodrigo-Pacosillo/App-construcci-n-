// Persistencia local de la cotizacion recien enviada.
// Permite volver a /cotizacion/exito sin depender de los parametros de la URL:
// el token y el identificador se guardan en el navegador y se restauran al entrar.
// Solo se ejecuta del lado del cliente.

export const CLAVE_SESION_EXITO = "cotizacion_exito";

export type SesionExito = {
  cotizacionId: string;
  token: string;
};

function hayNavegador(): boolean {
  return typeof window !== "undefined";
}

export function guardarSesionExito(sesion: SesionExito): void {
  if (!hayNavegador()) return;
  try {
    window.sessionStorage.setItem(CLAVE_SESION_EXITO, JSON.stringify(sesion));
  } catch {
    // sessionStorage puede no estar disponible (modo privado o cuota llena).
  }
}

export function leerSesionExito(): SesionExito | null {
  if (!hayNavegador()) return null;
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_SESION_EXITO);
    if (!crudo) return null;

    const datos = JSON.parse(crudo) as Partial<SesionExito>;
    if (!datos.cotizacionId || !datos.token) return null;

    return { cotizacionId: datos.cotizacionId, token: datos.token };
  } catch {
    return null;
  }
}

export function limpiarSesionExito(): void {
  if (!hayNavegador()) return;
  try {
    window.sessionStorage.removeItem(CLAVE_SESION_EXITO);
  } catch {
    // Ignorar: si no se puede limpiar, no se bloquea la navegacion.
  }
}

/**
 * Devuelve el vencimiento del token de chat sin validar la firma.
 * La firma la valida unicamente el servidor; esto solo sirve para decidir
 * si tiene sentido ofrecer la pantalla de exito o el estado finalizado.
 */
export function vencimientoTokenChat(token: string): Date | null {
  try {
    const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const relleno = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decodificado = atob(relleno);
    const partes = decodificado.split(".");

    if (partes.length !== 3) return null;

    const exp = Number(partes[1]);
    if (!Number.isFinite(exp) || exp <= 0) return null;

    return new Date(exp);
  } catch {
    return null;
  }
}

export function tokenChatExpirado(token: string): boolean {
  const vencimiento = vencimientoTokenChat(token);
  if (!vencimiento) return true;
  return vencimiento.getTime() <= Date.now();
}

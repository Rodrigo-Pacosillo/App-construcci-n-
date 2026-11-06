/**
 * Selección de la obra que se muestra por defecto en el portal del cliente.
 *
 * Regla única para todas las vistas de `/cliente`:
 *   1. Si llega un `obraId` válido en la URL, se respeta.
 *   2. Si no, se prefiere la obra EN CURSO, luego la PAUSADA.
 *   3. Solo si no hay ninguna activa se cae a la terminal más reciente.
 *
 * El `orderBy: { fechaInicio: "desc" }` de Prisma se mantiene como orden
 * natural de la consulta, pero NO decide qué obra se muestra: una obra
 * entregada más nueva no debe tapar la obra que el cliente está viviendo.
 */

export type ObraSeleccionable = {
  id: string;
  estado: string;
  fechaInicio: Date | string;
};

const PRIORIDAD_ESTADO: Record<string, number> = {
  en_curso: 0,
  pausada: 1,
  finalizada: 2,
  entregada: 3,
};

function prioridad(estado: string): number {
  return PRIORIDAD_ESTADO[estado] ?? 99;
}

export function elegirObraPorDefecto<T extends ObraSeleccionable>(
  obras: T[],
  obraId?: string
): T | null {
  if (obras.length === 0) return null;

  if (obraId) {
    const solicitada = obras.find((o) => o.id === obraId);
    if (solicitada) return solicitada;
  }

  return [...obras].sort((a, b) => {
    const porEstado = prioridad(a.estado) - prioridad(b.estado);
    if (porEstado !== 0) return porEstado;
    return (
      new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
    );
  })[0];
}

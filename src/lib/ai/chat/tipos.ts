// Contratos compartidos entre servidor y cliente para el chat v3
// Fuente única de verdad para tipos de UI y datos de acciones.

export type EstadoAccion = "pendiente" | "ejecutando" | "ejecutada" | "rechazada" | "fallida" | "expirada";

export type SubtipoEvento = "nota" | "visita_tecnica" | "recordatorio" | "reunion";

export type ResumenAccion =
  | {
      tipo: "evento";
      subtipo: SubtipoEvento;
      titulo: string;
      descripcion?: string | null;
      cliente: string;            // "Nombre Apellidos"
      obra: string | null;        // etiqueta legible o null
      cuando: string;             // ya formateado en TZ del negocio: "jue 12 nov 2026, 10:00"
      fecha: string;              // "YYYY-MM-DD" (editable)
      hora: string | null;        // "HH:mm" (editable) | null si todo el día
      visibleCliente: boolean;    // editable
    }
  | { tipo: "cambio_estado"; cliente: string; cotizacion: string; estadoActual: string; estadoNuevo: string };

export type AccionUI = {
  accionId: string;               // solo viaja por el canal de UI, nunca al modelo
  herramienta: "proponer_evento_calendario" | "proponer_nota_calendario" | "proponer_cambio_estado_cotizacion";
  estado: EstadoAccion;
  expiraEn: string | null;
  resumen: ResumenAccion;
  error?: string | null;
};

export type MensajeDTO = {
  id: string;
  rol: "user" | "assistant";
  contenido: string;
  creadoEn: string;
  sugerencias?: string[];         // solo en el saludo
  accionIds?: string[];
};

export type AgenteUI = { id: "publico" | "cliente" | "admin"; etiqueta: string; descripcion: string };

export type InicioResponse = {
  sessionId: string;
  agente: AgenteUI;
  mensajes: MensajeDTO[];
  acciones: AccionUI[];
  sugerencias: string[];          // vacío si ya hubo mensajes del usuario
  expiraEn: string | null;        // solo público
  soloLectura?: boolean;          // supervisión admin
};

// DTOs para saludos y respuestas del servidor
export type SaludoDTO = {
  texto: string;
  sugerencias: string[];
};

export type VistaCotizacionPublica = {
  tipoObra: string;
  tipoConstruccion: string;
  rangoM2: string;
  plazoInicio: string;
  ubicacionObra: string | null;
  requerimiento: string | null;
};

export type ResumenClienteDTO = {
  nombre: string;
  obraPrincipal?: { nombre: string; estado: string; estadoLabel: string; progreso: number } | null;
  proximoEvento?: { titulo: string; fecha: string } | null;
  cotizacionesAbiertas: number;
};

export type PendientesDTO = {
  cotizacionesNuevas: number;
  cotizacionMasAntiguaDias: number | null;
  eventosHoy: number;
  obrasEnCurso: number;
  materialesBajoStock: number;
  herramientasSinDevolver: number;
};
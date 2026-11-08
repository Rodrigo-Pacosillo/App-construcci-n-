export async function construirSaludoAdmin(datos: { nombre: string; cotizacionesNuevas?: number; dias?: number; eventosHoy?: number; obrasEnCurso?: number; materialesBajoStock?: number; herramientasSinDevolver?: number }) {
  const texto = [
    `Hola, \`${datos.nombre}\`. Soy el asistente del panel.`,
    `Pendientes ahora: \`${datos.cotizacionesNuevas ?? 0}\` cotizaciones nuevas (la más antigua, hace \`${datos.dias ?? 0}\` días) · \`${datos.eventosHoy ?? 0}\` eventos hoy · \`${datos.obrasEnCurso ?? 0}\` obras en curso · \`${datos.materialesBajoStock ?? 0}\` materiales bajo stock · \`${datos.herramientasSinDevolver ?? 0}\` herramientas sin devolver.`,
    "Puedo:",
    "• Consultar: clientes, cotizaciones, obras, pagos y saldos, agenda, inventario, equipo asignado.",
    "• Actuar (con su confirmación): cambiar estado de cotización, agendar visitas, dejar notas o recordatorios.",
    "• Responder dudas con la base de conocimiento.",
  ].join("\n");
  return {
    texto,
    sugerencias: ["Cotizaciones nuevas", "Agenda de hoy", "Estado de una obra", "Buscar un cliente"],
  };
}
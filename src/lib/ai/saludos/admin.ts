import { obtenerPendientes } from "@/lib/ai/datos/pendientes";

export async function construirSaludoAdmin(datos: { nombre: string }) {
  const pendientes = await obtenerPendientes();

  const lines: string[] = [];
  lines.push(`Hola, \`${datos.nombre}\`. Soy el asistente del panel.`);
  const partes = [];
  if (pendientes.cotizacionesNuevas > 0) {
    partes.push(`\`${pendientes.cotizacionesNuevas}\` cotizaciones nuevas${pendientes.cotizacionMasAntiguaDias !== null ? ` (la más antigua, hace \`${pendientes.cotizacionMasAntiguaDias}\` días)` : ""}`);
  }
  if (pendientes.eventosHoy > 0) partes.push(`\`${pendientes.eventosHoy}\` eventos hoy`);
  if (pendientes.obrasEnCurso > 0) partes.push(`\`${pendientes.obrasEnCurso}\` obras en curso`);
  if (pendientes.materialesBajoStock > 0) partes.push(`\`${pendientes.materialesBajoStock}\` materiales bajo stock`);
  if (pendientes.herramientasSinDevolver > 0) partes.push(`\`${pendientes.herramientasSinDevolver}\` herramientas sin devolver`);
  if (partes.length > 0) {
    lines.push("Pendientes ahora: " + partes.join(" · ") + ".");
  } else {
    lines.push("No hay pendientes ahora.");
  }
  lines.push("Puedo:");
  lines.push("• Consultar: clientes, cotizaciones, obras, pagos y saldos, agenda, inventario, equipo asignado.");
  lines.push("• Actuar (con su confirmación): cambiar estado de cotización, agendar visitas, dejar notas o recordatorios.");
  lines.push("• Responder dudas con la base de conocimiento.");
  const sugerencias = ["Cotizaciones nuevas", "Agenda de hoy", "Estado de una obra", "Buscar un cliente"];
  return { texto: lines.join("\n"), sugerencias };
}
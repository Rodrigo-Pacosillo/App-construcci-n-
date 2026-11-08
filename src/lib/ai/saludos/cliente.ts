import { obtenerResumenCliente } from "@/lib/ai/datos/resumenCliente";

export async function construirSaludoCliente(datos: { clienteId: string }) {
  const resumen = await obtenerResumenCliente(datos.clienteId);

  const lines: string[] = [];
  lines.push(`¡Hola, \`${resumen.nombre}\`! Soy el asistente de su cuenta en Constr-art.`);
  if (resumen.obraPrincipal) {
    lines.push(`Su obra \`${resumen.obraPrincipal.nombre}\` está \`${resumen.obraPrincipal.estadoLabel}\` al \`${resumen.obraPrincipal.progreso}%\`.`);
  }
  if (resumen.proximoEvento) {
    lines.push(`Su próximo evento: \`${resumen.proximoEvento.titulo}\` el \`${resumen.proximoEvento.fecha}\`.`);
  }
  lines.push("Puedo ayudarle a: ver el avance de su obra, revisar sus cotizaciones, pagos y documentos, consultar su calendario, agregar una nota a su calendario y resolver dudas sobre su construcción.");
  const sugerencias = resumen.obraPrincipal
    ? ["Ver avance de mi obra", "Mis próximos eventos", "Agregar una nota a mi calendario", "Tengo una duda técnica"]
    : ["Ver mis cotizaciones", "Mis próximos eventos", "Agregar una nota a mi calendario", "Tengo una duda sobre construcción"];
  return { texto: lines.join("\n"), sugerencias };
}
export async function construirSaludoCliente(datos: { nombre: string; obra?: string; estado?: string; progreso?: number; proximoEvento?: string }) {
  const lines: string[] = [];
  lines.push(`¡Hola, \`${datos.nombre}\`! Soy el asistente de su cuenta en Constr-art.`);
  if (datos.obra) {
    lines.push(`Su obra \`${datos.obra}\` esta \`${datos.estado ?? ""}\` al \`${datos.progreso ?? 0}%\`.`);
  }
  if (datos.proximoEvento) {
    lines.push(`Su proximo evento: \`${datos.proximoEvento}\`.`);
  }
  lines.push("Puedo ayudarle a: ver el avance de su obra, revisar sus cotizaciones, pagos y documentos, consultar su calendario, agregar una nota a su calendario y resolver dudas sobre su construccion.");
  return {
    texto: lines.join("\n"),
    sugerencias: ["Ver avance de mi obra", "Mis proximos eventos", "Agregar una nota a mi calendario", "Tengo una duda tecnica"],
  };
}

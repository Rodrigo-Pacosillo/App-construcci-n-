export async function construirSaludoPublico(datos: {
  nombre: string;
  tipoObraLabel: string;
  tipoConstruccionLabel: string;
  rangoM2Label: string;
  plazoLabel: string;
  ubicacionObra?: string | null;
  requerimiento?: string | null;
}) {
  const lines: string[] = [];
  lines.push(`¡Hola, \`${datos.nombre}\`! Gracias por solicitar su cotización en Constr-art.`);
  lines.push("Esto es lo que recibimos:");
  lines.push(`• Obra: \`${datos.tipoObraLabel}\` · Construcción: \`${datos.tipoConstruccionLabel}\` · Superficie: \`${datos.rangoM2Label}\``);
  lines.push(`• Inicio: \`${datos.plazoLabel}\` · Ubicación: \`${datos.ubicacionObra ?? "No especificada"}\``);
  if (datos.requerimiento) {
    lines.push(`• Su requerimiento: \`${String(datos.requerimiento).slice(0, 200)}\``);
  }
  lines.push("Nuestro equipo la revisará y le contactará en 24-48 horas hábiles. Mientras tanto, puedo resolver sus dudas.");
  const sugerencias = ["¿Qué sistema le conviene: construcción en seco o tradicional?", "¿Cuánto tarda una obra como la suya?"];
  return { texto: lines.join("\n"), sugerencias };
}
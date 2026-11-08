import { vistaCotizacionPublica } from "@/lib/ai/datos/cotizacionPublica";

export async function construirSaludoPublico(datos: {
  cotizacionId: string;
  nombre: string;
}) {
  const vista = await vistaCotizacionPublica(datos.cotizacionId);
  if (!vista) throw new Error("Cotización no encontrada");

  const lines: string[] = [];
  lines.push(`¡Hola, \`${datos.nombre}\`! Gracias por solicitar su cotización en Constr-art.`);
  lines.push("Esto es lo que recibimos:");
  lines.push(`• Obra: \`${vista.tipoObra}\` · Construcción: \`${vista.tipoConstruccion}\` · Superficie: \`${vista.rangoM2}\``);
  lines.push(`• Inicio: \`${vista.plazoInicio}\` · Ubicación: \`${vista.ubicacionObra ?? "No especificada"}\``);
  if (vista.requerimiento) {
    lines.push(`• Su requerimiento: \`${vista.requerimiento}\``);
  }
  lines.push("Nuestro equipo la revisará y le contactará en 24-48 horas hábiles. Mientras tanto, puedo resolver sus dudas.");

  const sugerencias = [];
  if (vista.tipoConstruccion.toLowerCase().includes("no estoy") || vista.tipoConstruccion.toLowerCase().includes("asesórenme")) {
    sugerencias.push("¿Qué sistema le conviene: construcción en seco o tradicional?");
  }
  if (vista.plazoInicio.toLowerCase().includes("lo antes")) {
    sugerencias.push("¿Cuánto tarda una obra como la suya?");
  }
  if (vista.tipoObra.toLowerCase().includes("ampliación")) {
    sugerencias.push("¿Cómo se hace una ampliación en seco?");
  }
  if (vista.rangoM2.toLowerCase().includes("más de 200")) {
    sugerencias.push("¿Cómo se organizan los proyectos de gran tamaño?");
  }
  if (!vista.ubicacionObra) {
    sugerencias.push("¿En qué zona puede construir Constr-art?");
  }
  if (sugerencias.length < 2) {
    sugerencias.push("¿Qué incluye el proceso desde la cotización hasta el inicio de obra?");
  }
  return { texto: lines.join("\n"), sugerencias: sugerencias.slice(0, 3) };
}
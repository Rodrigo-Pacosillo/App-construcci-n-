/**
 * Seed de la tabla Conocimiento (RAG sin vectores).
 * 6 documentos semilla extraídos del propio contenido del sitio.
 * Correr: npx tsx prisma/seed-conocimiento.ts
 * Es idempotente: borra los títulos semilla antes de insertar.
 */
import { PrismaClient, AudienciaConocimiento } from "@prisma/client";

const prisma = new PrismaClient();

const DOCS: {
  titulo: string;
  categoria: string;
  audiencia: AudienciaConocimiento;
  contenido: string;
}[] = [
  {
    titulo: "Cómo funciona el sitio web (flujo del visitante)",
    categoria: "sitio_web",
    audiencia: "publico",
    contenido: `El visitante puede: 1) Ver el portafolio de proyectos en /proyectos con fotos, m², días de ejecución y ubicación. 2) Revisar servicios en /servicios (steel frame, tabiques, cielorrasos, revestimientos, aislaciones). 3) Leer preguntas frecuentes en /faq. 4) Completar el estimador y el formulario de cotización en /cotizacion, que pide tipo de obra, tipo de construcción, superficie aproximada, ubicación y plazo. 5) Al enviar la cotización, llega a la página de éxito con un asistente virtual que responde dudas sobre su solicitud. El equipo revisa cada cotización y contacta en menos de 24 horas hábiles para coordinar visita técnica.`,
  },
  {
    titulo: "Proceso de trabajo de CONSTR-ART (7 pasos)",
    categoria: "proceso",
    audiencia: "publico",
    contenido: `El proceso de obra en construcción en seco sigue estos pasos: 1) Recepción y análisis de la cotización. 2) Contacto en menos de 24 horas hábiles. 3) Visita técnica y toma de medidas. 4) Propuesta formal con alcances y plazo. 5) Firma de contrato. 6) Ejecución de obra con hitos y avance reportado. 7) Entrega y cierre. El cliente con cuenta puede seguir el avance, hitos, pagos y eventos del calendario desde su portal /cliente.`,
  },
  {
    titulo: "Qué es la construcción en seco y steel frame",
    categoria: "tecnico",
    audiencia: "publico",
    contenido: `La construcción en seco (steel frame) usa perfiles metálicos galvanizados y placas de yeso/cementicias en lugar de ladrillo y mortero. Ventajas: tiempos de obra más cortos, menor peso sobre la estructura, precisión milimétrica, mejor aislación térmica y acústica, y menos desperdicio en obra. Se usa para vivienda nueva, ampliaciones, tabiques interiores, cielorrasos y revestimientos. También ejecutamos obra tradicional cuando el proyecto lo requiere.`,
  },
  {
    titulo: "Política de precios y plazos del asistente",
    categoria: "politica",
    audiencia: "publico",
    contenido: `El asistente NO informa precios exactos ni precio por m²: el presupuesto se ajusta por visita técnica y materiales del momento. NO garantiza fechas de inicio o fin específicas; puede mencionar que el contacto se hace en 24-48 horas hábiles. NO habla de temas ajenos a la construcción (piscinas, jardines, decoración, política, religión). Si el visitante pide un precio, se invita a completar la cotización en /cotizacion o escribir por WhatsApp.`,
  },
  {
    titulo: "Portal del cliente: qué puede hacer cada usuario con cuenta",
    categoria: "sitio_web",
    audiencia: "cliente",
    contenido: `El portal /cliente es de solo lectura para el cliente con cuenta y muestra: sus obras con avance y estado, los hitos visibles de cada obra con fotos, los pagos registrados y su estado (registrado/confirmado), los contratos con su PDF, el calendario con visitas y plazos de su obra, y las actualizaciones con fotos/videos que sube el equipo. El asistente del portal puede consultar sus cotizaciones, el avance de su obra y sus próximos eventos cuando el cliente lo pregunte.`,
  },
  {
    titulo: "Gestión interna: cotizaciones, contratos, obras e inventario",
    categoria: "proceso",
    audiencia: "admin",
    contenido: `Estados de cotización: nuevo (por revisar) → contactado (tras confirmar contacto) → contratado o no_concretado. Abrir WhatsApp no cambia el estado. Un contrato puede crearse desde una cotización y al hacerlo la cotización pasa a contratado. Los contratos van de borrador a firmado (fecha de firma), y pueden anularse o finalizarse. Las obras nacen en curso, pueden pausarse, finalizarse y entregarse, con progreso 0-100. El inventario registra herramientas (disponible/en_uso/mantenimiento/baja) y materiales con stock; los movimientos de entrada/salida/ajuste quedan en el kardex (movimientos_materiales). Las cuentas de acceso (usuarios) se crean por invitación vinculada a una ficha de cliente.`,
  },
];

async function main() {
  console.log("📚 Sembrando conocimiento (RAG)...");
  for (const doc of DOCS) {
    await prisma.conocimiento.deleteMany({ where: { titulo: doc.titulo } });
  }
  await prisma.conocimiento.createMany({
    data: DOCS.map((d) => ({
      titulo: d.titulo,
      categoria: d.categoria,
      audiencia: d.audiencia,
      contenido: d.contenido,
      activo: true,
    })),
  });
  const total = await prisma.conocimiento.count();
  console.log(`✅ Conocimiento listo: ${total} documentos`);
}

main()
  .catch((e) => {
    console.error("Error en seed-conocimiento:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

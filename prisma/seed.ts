import { PrismaClient, Rol, TipoConstruccion, RangoM2, EstadoObra, EstadoPago } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Limpiando datos existentes...");
  await prisma.prestamoHerramienta.deleteMany();
  await prisma.materialObra.deleteMany();
  await prisma.herramienta.deleteMany();
  await prisma.material.deleteMany();
  await prisma.asignacionObra.deleteMany();
  await prisma.empleado.deleteMany();
  await prisma.pagoObra.deleteMany();
  await prisma.hitosObra.deleteMany();
  await prisma.obraActiva.deleteMany();
  await prisma.testimonio.deleteMany();
  await prisma.contrato.deleteMany();
  await prisma.cotizacion.deleteMany();
  await prisma.proyecto.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.servicio.deleteMany();
  await prisma.faq.deleteMany();
  await prisma.certificacion.deleteMany();
  await prisma.precioReferencia.deleteMany();

  console.log("👤 Creando usuario admin...");
  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.usuario.create({
    data: {
      nombre: "Admin",
      apellidos: "Demo",
      email: "admin@gmail.com",
      passwordHash,
      rol: Rol.admin,
    },
  });
  console.log(`   ✅ Admin creado: ${admin.email}`);

  console.log("👥 Creando cliente demo (con acceso a portal)...");
  const cliente = await prisma.cliente.create({
    data: {
      nombre: "Juan",
      apellidos: "Pérez",
      telefono: "+591 7 123-4567",
      email: "juan.perez@email.com",
      ciudad: "Santa Cruz",
    },
  });
  console.log(`   ✅ Cliente creado: ${cliente.nombre} ${cliente.apellidos}`);

  console.log("📁 Creando proyectos de portafolio...");
  const proyectos = await Promise.all([
    prisma.proyecto.create({
      data: {
        clienteId: cliente.id,
        slug: "casa-steel-frame-santa-cruz",
        titulo: "Casa Steel Frame en Santa Cruz",
        tipoConstruccion: TipoConstruccion.seco,
        m2Construidos: 220,
        diasEjecucion: 45,
        ubicacion: "Santa Cruz de la Sierra, Bolivia",
        problemaCliente:
          "La familia quería una casa moderna y sustentable, pero con presupuesto limitado y plazo ajustado para mudarse.",
        solucion:
          "Construcción en steel frame con aislación térmica de alta eficiencia. Reducción del 40% en tiempo de obra respecto a tradicional, con mejor aislación.",
        destacado: true,
        publicado: true,
      },
    }),
    prisma.proyecto.create({
      data: {
        slug: "ampliacion-zona-sur-la-paz",
        titulo: "Ampliación en La Paz",
        tipoConstruccion: TipoConstruccion.seco,
        m2Construidos: 65,
        diasEjecucion: 20,
        ubicacion: "Zona Sur, La Paz, Bolivia",
        problemaCliente:
          "Necesitaban un estudio y un dormitorio extra en el piso superior, sin perder el jardín.",
        solucion:
          "Ampliación en steel frame sobre estructura existente. Se logró el doble de espacio sin demoler, con acabados idénticos a la casa original.",
        destacado: true,
        publicado: true,
      },
    }),
    prisma.proyecto.create({
      data: {
        slug: "local-comercial-santa-cruz",
        titulo: "Local Comercial en Santa Cruz",
        tipoConstruccion: TipoConstruccion.seco,
        m2Construidos: 90,
        diasEjecucion: 15,
        ubicacion: "Equipetrol, Santa Cruz, Bolivia",
        problemaCliente:
          "Un emprendedor quería habilitar un local gastronómico en un sótano, con plazo mínimo de demora.",
        solucion:
          "Acondicionamiento completo con tabiquería drywall, cielorrasos suspendidos y revestimientos resistentes a humedad. Listo en 15 días.",
        publicado: true,
      },
    }),
    prisma.proyecto.create({
      data: {
        slug: "quinta-rehabilitacion",
        titulo: "Quinta en Rehabilitación",
        tipoConstruccion: TipoConstruccion.integral,
        m2Construidos: 350,
        diasEjecucion: 80,
        ubicacion: "Tarija, Bolivia",
        problemaCliente:
          "Una quinta familiar con décadas de abandono que querían convertir en casa de fin de semana.",
        solucion:
          "Rehabilitación integral: estructura reforzada, nuevos tabiques, aislación, instalaciones. Se preservó la fachada original.",
        destacado: true,
        publicado: true,
      },
    }),
    prisma.proyecto.create({
      data: {
        slug: "oficinas-empresariales",
        titulo: "Oficinas Empresariales",
        tipoConstruccion: TipoConstruccion.seco,
        m2Construidos: 180,
        diasEjecucion: 30,
        ubicacion: "La Paz, Bolivia",
        problemaCliente:
          "Una startup necesitaba oficinas modulares que pudieran reconfigurar según crezca el equipo.",
        solucion:
          "Sistema de tabiques desmontables en drywall con puertas corredizas. El espacio se adapta al equipo sin obras.",
        publicado: true,
      },
    }),
    prisma.proyecto.create({
      data: {
        slug: "casa-ecologica-cochabamba",
        titulo: "Casa Ecológica en Cochabamba",
        tipoConstruccion: TipoConstruccion.seco,
        m2Construidos: 160,
        diasEjecucion: 35,
        ubicacion: "Cochabamba, Bolivia",
        problemaCliente:
          "Un arquitecto quería demostrar que la construcción en seco puede ser tan estética como la tradicional.",
        solucion:
          "Casa de diseño con tabiques vistos, cielorrasos de chapa ondulada y amplios vanos de vidrio. Publicada en revista de arquitectura.",
        publicado: true,
      },
    }),
  ]);
  console.log(`   ✅ ${proyectos.length} proyectos creados`);

  console.log("💬 Creando testimonios...");
  const testimonios = await Promise.all([
    prisma.testimonio.create({
      data: {
        proyectoId: proyectos[0].id,
        clienteNombre: "Juan Pérez",
        texto:
          "Increíble cómo en 45 días pasamos de terreno a casa habitable. La calidad de los acabados superó nuestras expectativas. El aislamiento térmico es notable.",
        puntaje: 5,
        publicado: true,
      },
    }),
    prisma.testimonio.create({
      data: {
        proyectoId: proyectos[1].id,
        clienteNombre: "Laura Fernández",
        texto:
          "Necesitábamos ampliar sin demoler y cumplieron exactamente lo prometido. La ampliación se ve como si siempre hubiera estado ahí.",
        puntaje: 5,
        publicado: true,
      },
    }),
    prisma.testimonio.create({
      data: {
        proyectoId: proyectos[2].id,
        clienteNombre: "Diego Torres",
        texto:
          "El local quedó listo en 15 días, justo antes de la inauguración. Profesionales de primera.",
        puntaje: 5,
        publicado: true,
      },
    }),
    prisma.testimonio.create({
      data: {
        proyectoId: proyectos[3].id,
        clienteNombre: "Roberto García",
        texto:
          "Transformaron una quinta abandonada en una casa hermosa. Preservaron la fachada y modernizaron todo por dentro. Excelente trabajo.",
        puntaje: 4,
        publicado: true,
      },
    }),
    prisma.testimonio.create({
      data: {
        clienteNombre: "María López",
        texto:
          "Contraté solo la cotización pero me sorprendió la profesionalidad y claridad del presupuesto. Muy recomendable.",
        puntaje: 5,
        publicado: true,
      },
    }),
  ]);
  console.log(`   ✅ ${testimonios.length} testimonios creados`);

  console.log("🛠️ Creando servicios...");
  const servicios = await Promise.all([
    prisma.servicio.create({
      data: {
        slug: "steel-frame",
        titulo: "Steel Frame",
        descripcion:
          "Construcción de viviendas y estructuras con perfilería de acero galvanizado. Más liviano, más rápido, más eficiente térmicamente.",
        orden: 1,
      },
    }),
    prisma.servicio.create({
      data: {
        slug: "drywall",
        titulo: "Tabiquería Drywall",
        descripcion:
          "Tabiques internos en placa de yeso sobre estructura de acero. Rápido, limpio y con excelente aislación acústica y térmica.",
        orden: 2,
      },
    }),
    prisma.servicio.create({
      data: {
        slug: "cielorrasos",
        titulo: "Cielorrasos",
        descripcion:
          "Cielorrasos suspendidos en placa de yeso, con opciones de diseños, iluminación empotrada y acabados lisos o texturizados.",
        orden: 3,
      },
    }),
    prisma.servicio.create({
      data: {
        slug: "revestimientos",
        titulo: "Revestimientos",
        descripcion:
          "Revestimientos interiores y exteriores en placas de yeso, fibrocemento u otros materiales. Acabados profesionales garantizados.",
        orden: 4,
      },
    }),
    prisma.servicio.create({
      data: {
        slug: "aislaciones",
        titulo: "Aislaciones Térmicas y Acústicas",
        descripcion:
          "Instalación de lana de vidrio, lana de roca y otros materiales aislantes para máxima eficiencia energética y confort.",
        orden: 5,
      },
    }),
    prisma.servicio.create({
      data: {
        slug: "habilitaciones",
        titulo: "Habilitaciones de Locales",
        descripcion:
          "Trámites y ejecución para habilitación de locales comerciales, oficinas y espacios gastronómicos. Cumplimiento de normativas.",
        orden: 6,
      },
    }),
  ]);
  console.log(`   ✅ ${servicios.length} servicios creados`);

  console.log("❓ Creando FAQs...");
  const faqs = await Promise.all([
    prisma.faq.create({
      data: {
        pregunta: "¿Cuánto tarda una vivienda en construcción en seco?",
        respuesta:
          "70 días para una vivienda pequeña (hasta 100 m²), desde el inicio de la obra hasta la entrega de llaves. Es significativamente más rápido que la construcción tradicional.",
        orden: 1,
      },
    }),
    prisma.faq.create({
      data: {
        pregunta: "¿El steel frame es más caro que la construcción tradicional?",
        respuesta:
          "El costo por m² es comparable, pero el ahorro viene por el tiempo de obra (menos intereses si financia) y la eficiencia térmica (menor costo de calefacción y refrigeración).",
        orden: 2,
      },
    }),
    prisma.faq.create({
      data: {
        pregunta: "¿Cómo se calcula el costo de una obra?",
        respuesta:
          "Cobramos por m². El costo varía según el tipo de construcción (tradicional, seco, integral), la ubicación, los acabados y la complejidad. Le damos un presupuesto detallado sin compromiso.",
        orden: 3,
      },
    }),
    prisma.faq.create({
      data: {
        pregunta: "¿Realizan ampliaciones sobre estructuras existentes?",
        respuesta:
          "Sí, tanto en construcción en seco (ideal por su ligereza) como en tradicional. Evaluamos la estructura existente y diseñamos la solución adecuada.",
        orden: 4,
      },
    }),
    prisma.faq.create({
      data: {
        pregunta: "¿Qué tipo de aislación térmica ofrecen?",
        respuesta:
          "En construcción en seco: lana de vidrio o roca entre parantes (coeficiente térmico superior). En tradicional: aislación en techos y muros según la normativa vigente.",
        orden: 5,
      },
    }),
    prisma.faq.create({
      data: {
        pregunta: "¿Trabajan en todo Bolivia?",
        respuesta:
          "Sí, tenemos cobertura nacional en Bolivia.",
        orden: 6,
      },
    }),
    prisma.faq.create({
      data: {
        pregunta: "¿Puedo ver ejemplos de trabajos anteriores?",
        respuesta:
          "Sí, en nuestra sección de proyectos encontrará casos reales con fotos de antes, durante y después, metros cuadrados y tiempos de ejecución.",
        orden: 7,
      },
    }),
    prisma.faq.create({
      data: {
        pregunta: "¿Cómo pido un presupuesto?",
        respuesta:
          "Puede usar nuestro estimador online para tener una referencia, o completar el formulario de cotización con los detalles de su obra. Nos comunicamos con usted en 24 horas.",
        orden: 8,
      },
    }),
    prisma.faq.create({
      data: {
        pregunta: "¿Qué incluye el presupuesto?",
        respuesta:
          "El presupuesto incluye estructura, tabiquería, cielorraso, revestimientos, aislación e instalaciones básicas. No incluye sanitarios, grifería ni pisos (a menos que se especifique).",
        orden: 9,
      },
    }),
    prisma.faq.create({
      data: {
        pregunta: "¿Ofrecen garantía en sus obras?",
        respuesta:
          "Sí, todas nuestras obras tienen garantía de 1 año por vicios de construcción y materiales. Respaldamos nuestro trabajo con certificaciones y seguros vigentes.",
        orden: 10,
      },
    }),
  ]);
  console.log(`   ✅ ${faqs.length} FAQs creadas`);

  console.log("📜 Creando certificaciones...");
  const certificaciones = await Promise.all([
    prisma.certificacion.create({
      data: {
        titulo: "Matrícula Constructora Nacional",
        descripcion: "Matrícula habilitante para construcciones en todo el territorio boliviano.",
      },
    }),
    prisma.certificacion.create({
      data: {
        titulo: "Certificación Steel Frame",
        descripcion: "Certificación oficial en sistemas de construcción en seco con perfilería de acero galvanizado.",
      },
    }),
    prisma.certificacion.create({
      data: {
        titulo: "Garantía de 1 año",
        descripcion: "Garantía escrita de 1 año en todas nuestras obras por vicios de construcción y materiales.",
      },
    }),
    prisma.certificacion.create({
      data: {
        titulo: "Equipo profesional y especializado",
        descripcion: "Más de 14 años de experiencia y 200+ obras ejecutadas a nivel nacional en Bolivia.",
      },
    }),
  ]);
  console.log(`   ✅ ${certificaciones.length} certificaciones creadas`);

  console.log("💰 Creando precios de referencia...");
  const precios = await Promise.all([
    // Steel frame
    prisma.precioReferencia.create({
      data: { tipoConstruccion: TipoConstruccion.seco, rangoM2: RangoM2.hasta_50, precioMin: 350000, precioMax: 500000 },
    }),
    prisma.precioReferencia.create({
      data: { tipoConstruccion: TipoConstruccion.seco, rangoM2: RangoM2.m50_100, precioMin: 300000, precioMax: 420000 },
    }),
    prisma.precioReferencia.create({
      data: { tipoConstruccion: TipoConstruccion.seco, rangoM2: RangoM2.m100_200, precioMin: 280000, precioMax: 380000 },
    }),
    prisma.precioReferencia.create({
      data: { tipoConstruccion: TipoConstruccion.seco, rangoM2: RangoM2.mas_200, precioMin: 250000, precioMax: 350000 },
    }),
    // Tradicional
    prisma.precioReferencia.create({
      data: { tipoConstruccion: TipoConstruccion.tradicional, rangoM2: RangoM2.hasta_50, precioMin: 400000, precioMax: 550000 },
    }),
    prisma.precioReferencia.create({
      data: { tipoConstruccion: TipoConstruccion.tradicional, rangoM2: RangoM2.m50_100, precioMin: 350000, precioMax: 480000 },
    }),
    prisma.precioReferencia.create({
      data: { tipoConstruccion: TipoConstruccion.tradicional, rangoM2: RangoM2.m100_200, precioMin: 320000, precioMax: 440000 },
    }),
    prisma.precioReferencia.create({
      data: { tipoConstruccion: TipoConstruccion.tradicional, rangoM2: RangoM2.mas_200, precioMin: 300000, precioMax: 400000 },
    }),
  ]);
  console.log(`   ✅ ${precios.length} precios de referencia creados`);

  console.log("🏗️  Creando usuario cliente + obra activa...");
  const clientePasswordHash = await bcrypt.hash("cliente123", 10);
  const usuarioCliente = await prisma.usuario.create({
    data: {
      nombre: cliente.nombre,
      apellidos: cliente.apellidos,
      email: "cliente@gmail.com",
      passwordHash: clientePasswordHash,
      rol: Rol.cliente,
      clienteId: cliente.id,
    },
  });
  console.log(`   ✅ Usuario cliente creado: ${usuarioCliente.email}`);

  const contrato = await prisma.contrato.create({
    data: {
      clienteId: cliente.id,
      cotizacionId: null,
      montoTotal: 17500000,
      fechaFirma: new Date("2026-06-20"),
      observaciones:
        "Contrato llave en mano. Incluye estructura steel frame, cerramientos, instalaciones y terminaciones.",
    },
  });

  const obra = await prisma.obraActiva.create({
    data: {
      clienteId: cliente.id,
      contratoId: contrato.id,
      direccionObra: "Av. Los Álamos 1450, Santa Cruz",
      fechaInicio: new Date("2026-07-01"),
      fechaFinEstimada: new Date("2026-11-30"),
      estado: EstadoObra.en_curso,
      progreso: 45,
    },
  });

  const hitos = await Promise.all([
    prisma.hitosObra.create({
      data: {
        obraId: obra.id,
        titulo: "Replanteo y fundaciones",
        descripcion:
          "Nivelación del terreno, replanteo de ejes y ejecución de platea de fundación.",
        fecha: new Date("2026-07-08"),
        visibleCliente: true,
      },
    }),
    prisma.hitosObra.create({
      data: {
        obraId: obra.id,
        titulo: "Estructura steel frame",
        descripcion:
          "Montaje de paneles y perfiles galvanizados. Estructura completa y arriostrada.",
        fecha: new Date("2026-07-28"),
        visibleCliente: true,
      },
    }),
    prisma.hitosObra.create({
      data: {
        obraId: obra.id,
        titulo: "Cubierta y cerramientos",
        descripcion:
          "Colocación de chapa, aislación hidrófuga y cerramientos exteriores.",
        fecha: new Date("2026-08-20"),
        visibleCliente: true,
      },
    }),
    prisma.hitosObra.create({
      data: {
        obraId: obra.id,
        titulo: "Instalaciones (en curso)",
        descripcion:
          "Tendido de cañerías eléctricas y sanitarias. Previsto para septiembre.",
        fecha: new Date("2026-09-15"),
        visibleCliente: false,
      },
    }),
  ]);
  console.log(`   ✅ ${hitos.length} hitos de obra creados`);

  const pagos = await Promise.all([
    prisma.pagoObra.create({
      data: {
        obraId: obra.id,
        monto: 5250000,
        fecha: new Date("2026-06-25"),
        concepto: "Anticipo 30% a la firma del contrato",
        estado: EstadoPago.confirmado,
      },
    }),
    prisma.pagoObra.create({
      data: {
        obraId: obra.id,
        monto: 4375000,
        fecha: new Date("2026-07-30"),
        concepto: "Certificado de avance: estructura steel frame",
        estado: EstadoPago.confirmado,
      },
    }),
    prisma.pagoObra.create({
      data: {
        obraId: obra.id,
        monto: 3500000,
        fecha: new Date("2026-09-05"),
        concepto: "Certificado de avance: cubierta y cerramientos",
        estado: EstadoPago.registrado,
      },
    }),
  ]);
  console.log(`   ✅ ${pagos.length} pagos de obra creados`);

  console.log("\n🎉 ¡Seed completado exitosamente!");
  console.log(`   Usuarios: 2 (admin@gmail.com, cliente@gmail.com)`);
  console.log(`   Cliente: 1 (Juan Pérez)`);
  console.log(`   Cotizaciones: 0`);
  console.log(`   Proyectos: ${proyectos.length}`);
  console.log(`   Testimonios: ${testimonios.length}`);
  console.log(`   Servicios: ${servicios.length}`);
  console.log(`   FAQs: ${faqs.length}`);
  console.log(`   Certificaciones: ${certificaciones.length}`);
  console.log(`   Precios de referencia: ${precios.length}`);
  console.log(`   Obras activas: 1 (cliente@gmail.com / cliente123)`);
  console.log(`   Hitos: ${hitos.length} (3 visibles + 1 oculto)`);
  console.log(`   Pagos: ${pagos.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error durante el seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
import { PrismaClient, Rol, TipoObra, TipoConstruccion, RangoM2, PlazoInicio, FaseFoto, EstadoObra, EstadoPago } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Limpiando datos existentes...");
  await prisma.pagoObra.deleteMany();
  await prisma.hitosObra.deleteMany();
  await prisma.obraActiva.deleteMany();
  await prisma.fotoProyecto.deleteMany();
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
      email: "admin@demo.com",
      passwordHash,
      rol: Rol.admin,
    },
  });
  console.log(`   ✅ Admin creado: ${admin.email}`);

  console.log("👥 Creando clientes de ejemplo...");
  const clientes = await Promise.all([
    prisma.cliente.create({
      data: {
        nombre: "Carlos Méndez",
        whatsapp: "+54 11 5555-1234",
        email: "carlos.mendez@email.com",
        ciudad: "CABA",
      },
    }),
    prisma.cliente.create({
      data: {
        nombre: "Laura Fernández",
        whatsapp: "+54 11 5555-5678",
        email: "laura.f@email.com",
        ciudad: "Belgrano",
      },
    }),
    prisma.cliente.create({
      data: {
        nombre: "Roberto García",
        whatsapp: "+54 11 5555-9012",
        ciudad: "Vicente López",
      },
    }),
    prisma.cliente.create({
      data: {
        nombre: "María López",
        whatsapp: "+54 11 5555-3456",
        email: "maria.lopez@email.com",
        ciudad: "San Isidro",
      },
    }),
    prisma.cliente.create({
      data: {
        nombre: "Juan Pérez",
        whatsapp: "+54 11 5555-7890",
        ciudad: "Tigre",
      },
    }),
    prisma.cliente.create({
      data: {
        nombre: "Ana Rodríguez",
        whatsapp: "+54 11 5555-2345",
        email: "ana.r@email.com",
        ciudad: "Pilar",
      },
    }),
    prisma.cliente.create({
      data: {
        nombre: "Diego Torres",
        whatsapp: "+54 11 5555-6789",
        ciudad: "Escobar",
      },
    }),
    prisma.cliente.create({
      data: {
        nombre: "Sofía Martínez",
        whatsapp: "+54 11 5555-0123",
        email: "sofia.m@email.com",
        ciudad: "Quilmes",
      },
    }),
  ]);
  console.log(`   ✅ ${clientes.length} clientes creados`);

  console.log("📋 Creando cotizaciones...");
  const cotizaciones = await Promise.all([
    prisma.cotizacion.create({
      data: {
        clienteId: clientes[0].id,
        tipoObra: TipoObra.vivienda_nueva,
        tipoConstruccion: TipoConstruccion.seco,
        rangoM2: RangoM2.m100_200,
        ubicacionObra: "Belgrano, CABA",
        plazoInicio: PlazoInicio.lo_antes_posible,
        origen: "web",
        estado: "nuevo",
        requerimiento:
          "Queremos construir una casa de 3 dormitorios en Belgrano. Buscamos algo moderno, bien aislado y con plazo firme.",
      },
    }),
    prisma.cotizacion.create({
      data: {
        clienteId: clientes[1].id,
        tipoObra: TipoObra.ampliacion,
        tipoConstruccion: TipoConstruccion.seco,
        rangoM2: RangoM2.m50_100,
        ubicacionObra: "Vicente López",
        plazoInicio: PlazoInicio.en_3_meses,
        origen: "whatsapp",
        estado: "contactado",
      },
    }),
    prisma.cotizacion.create({
      data: {
        clienteId: clientes[2].id,
        tipoObra: TipoObra.vivienda_nueva,
        tipoConstruccion: TipoConstruccion.tradicional,
        rangoM2: RangoM2.m100_200,
        ubicacionObra: "San Isidro",
        plazoInicio: PlazoInicio.lo_antes_posible,
        origen: "facebook",
        estado: "visita_tecnica",
      },
    }),
    prisma.cotizacion.create({
      data: {
        clienteId: clientes[3].id,
        tipoObra: TipoObra.otro,
        tipoConstruccion: TipoConstruccion.seco,
        rangoM2: RangoM2.hasta_50,
        ubicacionObra: "Tigre",
        plazoInicio: PlazoInicio.no_sabe,
        origen: "estimador",
        estado: "presupuestado",
        montoEstimado: 4500000,
      },
    }),
    prisma.cotizacion.create({
      data: {
        clienteId: clientes[4].id,
        tipoObra: TipoObra.vivienda_nueva,
        tipoConstruccion: TipoConstruccion.seco,
        rangoM2: RangoM2.mas_200,
        ubicacionObra: "Pilar",
        plazoInicio: PlazoInicio.en_3_meses,
        origen: "referido",
        estado: "ganado",
        montoEstimado: 18000000,
        montoCerrado: 17500000,
        requerimiento:
          "Casa principal de 200m2 más quincho. Necesitamos plazos ciertos porque tenemos un bebé en camino.",
      },
    }),
    prisma.cotizacion.create({
      data: {
        clienteId: clientes[5].id,
        tipoObra: TipoObra.ampliacion,
        tipoConstruccion: TipoConstruccion.no_sabe,
        rangoM2: RangoM2.m50_100,
        ubicacionObra: "Escobar",
        plazoInicio: PlazoInicio.no_sabe,
        origen: "tiktok",
        estado: "perdido",
      },
    }),
    prisma.cotizacion.create({
      data: {
        clienteId: clientes[6].id,
        tipoObra: TipoObra.vivienda_nueva,
        tipoConstruccion: TipoConstruccion.seco,
        rangoM2: RangoM2.m100_200,
        ubicacionObra: "Quilmes",
        plazoInicio: PlazoInicio.lo_antes_posible,
        origen: "web",
        estado: "nuevo",
      },
    }),
    prisma.cotizacion.create({
      data: {
        clienteId: clientes[7].id,
        tipoObra: TipoObra.vivienda_nueva,
        tipoConstruccion: TipoConstruccion.seco,
        rangoM2: RangoM2.m50_100,
        ubicacionObra: "La Plata",
        plazoInicio: PlazoInicio.en_3_meses,
        origen: "whatsapp",
        estado: "contactado",
      },
    }),
  ]);
  console.log(`   ✅ ${cotizaciones.length} cotizaciones creadas`);

  console.log("📁 Creando proyectos de portafolio...");
  const proyectos = await Promise.all([
    prisma.proyecto.create({
      data: {
        clienteId: clientes[4].id,
        slug: "casa-steel-frame-pilar",
        titulo: "Casa Steel Frame en Pilar",
        tipoConstruccion: TipoConstruccion.seco,
        m2Construidos: 220,
        diasEjecucion: 45,
        ubicacion: "Pilar, Buenos Aires",
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
        slug: "ampliacion-vicente-lopez",
        titulo: "Ampliación en Vicente López",
        tipoConstruccion: TipoConstruccion.seco,
        m2Construidos: 65,
        diasEjecucion: 20,
        ubicacion: "Vicente López, Buenos Aires",
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
        slug: "local-comercial-caba",
        titulo: "Local Comercial en CABA",
        tipoConstruccion: TipoConstruccion.seco,
        m2Construidos: 90,
        diasEjecucion: 15,
        ubicacion: "San Telmo, CABA",
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
        ubicacion: "San Pedro, Buenos Aires",
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
        ubicacion: "Microcentro, CABA",
        problemaCliente:
          "Una startup necesitaba oficinas modulares que pudieran reconfigurar según crezca el equipo.",
        solucion:
          "Sistema de tabiques desmontables en drywall con puertas corredizas. El espacio se adapta al equipo sin obras.",
        publicado: true,
      },
    }),
    prisma.proyecto.create({
      data: {
        slug: "casa-ecologica-escobar",
        titulo: "Casa Ecológica en Escobar",
        tipoConstruccion: TipoConstruccion.seco,
        m2Construidos: 160,
        diasEjecucion: 35,
        ubicacion: "Escobar, Buenos Aires",
        problemaCliente:
          "Un arquitecto quería demostrar que la construcción en seco puede ser tan estética como la tradicional.",
        solucion:
          "Casa de diseño con tabiques vistos, cielorrasos de chapa ondulada y amplios vanos de vidrio. Publicada en revista de arquitectura.",
        publicado: true,
      },
    }),
  ]);
  console.log(`   ✅ ${proyectos.length} proyectos creados`);

  console.log("📸 Creando fotos de proyectos...");
  const fotos = await Promise.all([
    // Casa Pilar
    prisma.fotoProyecto.create({
      data: { proyectoId: proyectos[0].id, url: "/img/proyectos/pilar-antes.jpg", fase: FaseFoto.antes, orden: 1 },
    }),
    prisma.fotoProyecto.create({
      data: { proyectoId: proyectos[0].id, url: "/img/proyectos/pilar-durante.jpg", fase: FaseFoto.durante, orden: 2 },
    }),
    prisma.fotoProyecto.create({
      data: { proyectoId: proyectos[0].id, url: "/img/proyectos/pilar-despues.jpg", fase: FaseFoto.despues, orden: 3 },
    }),
    // Ampliación Vicente López
    prisma.fotoProyecto.create({
      data: { proyectoId: proyectos[1].id, url: "/img/proyectos/vlopez-antes.jpg", fase: FaseFoto.antes, orden: 1 },
    }),
    prisma.fotoProyecto.create({
      data: { proyectoId: proyectos[1].id, url: "/img/proyectos/vlopez-despues.jpg", fase: FaseFoto.despues, orden: 2 },
    }),
    // Local San Telmo
    prisma.fotoProyecto.create({
      data: { proyectoId: proyectos[2].id, url: "/img/proyectos/santelmo-durante.jpg", fase: FaseFoto.durante, orden: 1 },
    }),
    prisma.fotoProyecto.create({
      data: { proyectoId: proyectos[2].id, url: "/img/proyectos/santelmo-despues.jpg", fase: FaseFoto.despues, orden: 2 },
    }),
    // Quinta San Pedro
    prisma.fotoProyecto.create({
      data: { proyectoId: proyectos[3].id, url: "/img/proyectos/sanpedro-antes.jpg", fase: FaseFoto.antes, orden: 1 },
    }),
    prisma.fotoProyecto.create({
      data: { proyectoId: proyectos[3].id, url: "/img/proyectos/sanpedro-durante.jpg", fase: FaseFoto.durante, orden: 2 },
    }),
    prisma.fotoProyecto.create({
      data: { proyectoId: proyectos[3].id, url: "/img/proyectos/sanpedro-despues.jpg", fase: FaseFoto.despues, orden: 3 },
    }),
    // Oficinas Microcentro
    prisma.fotoProyecto.create({
      data: { proyectoId: proyectos[4].id, url: "/img/proyectos/oficinas-durante.jpg", fase: FaseFoto.durante, orden: 1 },
    }),
    prisma.fotoProyecto.create({
      data: { proyectoId: proyectos[4].id, url: "/img/proyectos/oficinas-despues.jpg", fase: FaseFoto.despues, orden: 2 },
    }),
  ]);
  console.log(`   ✅ ${fotos.length} fotos creadas`);

  console.log("💬 Creando testimonios...");
  const testimonios = await Promise.all([
    prisma.testimonio.create({
      data: {
        proyectoId: proyectos[0].id,
        clienteNombre: "Juan Pérez",
        texto:
          "Increíble cómo en 45 días pasamos de terreno a casa habitable. La calidad de los acabados superó nuestras expectativas. El aislamiento térmico es notable.",
        puntaje: 5,
        autorizaPublicar: true,
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
        autorizaPublicar: true,
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
        autorizaPublicar: true,
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
        autorizaPublicar: true,
        publicado: true,
      },
    }),
    prisma.testimonio.create({
      data: {
        clienteNombre: "María López",
        texto:
          "Contraté solo la cotización pero me sorprendió la profesionalidad y claridad del presupuesto. Muy recomendable.",
        puntaje: 5,
        autorizaPublicar: true,
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
        pregunta: "¿Cuánto tarda una casa en steel frame?",
        respuesta:
          "Una vivienda de 100m² tarda entre 30 y 45 días desde el inicio de la obra hasta la entrega de llaves. Es significativamente más rápido que la construcción tradicional.",
        orden: 1,
      },
    }),
    prisma.faq.create({
      data: {
        pregunta: "¿El steel frame es más caro que la construcción tradicional?",
        respuesta:
          "El costo por m² es comparable, pero el ahorro viene por el tiempo de obra (menos interés si financiás) y la eficiencia térmica (menor costo de calefacción/refrigeración).",
        orden: 2,
      },
    }),
    prisma.faq.create({
      data: {
        pregunta: "¿Sirve para ampliaciones?",
        respuesta:
          "Sí, es ideal para ampliaciones porque es más liviano que la estructura tradicional, lo que permite construir sobre estructuras existentes sin refuerzos costosos.",
        orden: 3,
      },
    }),
    prisma.faq.create({
      data: {
        pregunta: "¿Cómo es la aislación térmica?",
        respuesta:
          "El sistema incluye lana de vidrio o roca entre los parantes, logrando un coeficiente térmico superior a la construcción tradicional con muros de 20cm.",
        orden: 4,
      },
    }),
    prisma.faq.create({
      data: {
        pregunta: "¿Trabajan en toda la zona norte del Gran Buenos Aires?",
        respuesta:
          "Sí, cubrimos CABA y toda la zona norte del GBA: Vicente López, San Isidro, Tigre, Pilar, Escobar, y alrededores.",
        orden: 5,
      },
    }),
    prisma.faq.create({
      data: {
        pregunta: "¿Puedo ver ejemplos de trabajos anteriores?",
        respuesta:
          "Sí, en nuestra sección de proyectos encontrarás casos reales con fotos antes/durante/después, metros cuadrados y tiempos de ejecución.",
        orden: 6,
      },
    }),
    prisma.faq.create({
      data: {
        pregunta: "¿Cómo pido un presupuesto?",
        respuesta:
          "Podés usar nuestro estimador online para tener una referencia, o completar el formulario de cotización con los detalles de tu obra. Te contactamos en 24 horas.",
        orden: 7,
      },
    }),
    prisma.faq.create({
      data: {
        pregunta: "¿Qué incluye el presupuesto?",
        respuesta:
          "El presupuesto incluye estructura, tabiquería, cielorraso, revestimientos, aislación e instalaciones básicas. No incluye sanitarios, grifería ni pisos (a menos que se especifique).",
        orden: 8,
      },
    }),
  ]);
  console.log(`   ✅ ${faqs.length} FAQs creadas`);

  console.log("📜 Creando certificaciones...");
  const certificaciones = await Promise.all([
    prisma.certificacion.create({
      data: {
        titulo: "Matrícula Constructora",
        descripcion: "Matrícula habilitante para construcciones en seco — Ciudad de Buenos Aires y Provincia.",
      },
    }),
    prisma.certificacion.create({
      data: {
        titulo: "Certificación Steel Frame",
        descripcion: "Certificación oficial por la Association of Steel Frame Constructors (ASFC).",
      },
    }),
    prisma.certificacion.create({
      data: {
        titulo: "Seguro de Responsabilidad Civil",
        descripcion: "Cobertura completa de responsabilidad civil para obras de hasta $50.000.000.",
      },
    }),
    prisma.certificacion.create({
      data: {
        titulo: "15 años de experiencia",
        descripcion: "Más de 200 obras ejecutadas en la zona norte del Gran Buenos Aires y CABA.",
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
      nombre: clientes[4].nombre,
      email: "cliente@demo.com",
      passwordHash: clientePasswordHash,
      rol: Rol.cliente,
      clienteId: clientes[4].id,
    },
  });
  console.log(`   ✅ Usuario cliente creado: ${usuarioCliente.email}`);

  const contrato = await prisma.contrato.create({
    data: {
      clienteId: clientes[4].id,
      cotizacionId: cotizaciones[4].id,
      montoTotal: 17500000,
      fechaFirma: new Date("2026-06-20"),
      observaciones:
        "Contrato llave en mano. Incluye estructura steel frame, cerramientos, instalaciones y terminaciones.",
    },
  });

  const obra = await prisma.obraActiva.create({
    data: {
      clienteId: clientes[4].id,
      contratoId: contrato.id,
      direccionObra: "Los Alamillos 1450, Pilar",
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
          "Nivelacion del terreno, replanteo de ejes y ejecucion de platea de fundacion.",
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
          "Colocacion de chapa, aislacion hidrofuga y cerramientos exteriores.",
        fecha: new Date("2026-08-20"),
        visibleCliente: true,
      },
    }),
    prisma.hitosObra.create({
      data: {
        obraId: obra.id,
        titulo: "Instalaciones (en curso)",
        descripcion:
          "Tendido de canerias electricas y sanitarias. Previsto para septiembre.",
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
  console.log(`   Usuarios: 2 (admin@demo.com, cliente@demo.com)`);
  console.log(`   Clientes: ${clientes.length}`);
  console.log(`   Cotizaciones: ${cotizaciones.length}`);
  console.log(`   Proyectos: ${proyectos.length}`);
  console.log(`   Fotos: ${fotos.length}`);
  console.log(`   Testimonios: ${testimonios.length}`);
  console.log(`   Servicios: ${servicios.length}`);
  console.log(`   FAQs: ${faqs.length}`);
  console.log(`   Certificaciones: ${certificaciones.length}`);
  console.log(`   Precios de referencia: ${precios.length}`);
  console.log(`   Obras activas: 1 (cliente@demo.com / cliente123)`);
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

import { PrismaClient, Rol, TipoConstruccion, RangoM2, EstadoObra, EstadoPago, EstadoTestimonio, TipoEventoCalendario, AgenteChat, EstadoChatSesion, RolChatMensaje, EstadoChatAccion, AudienciaConocimiento } from "@prisma/client";
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
  await prisma.actualizacionObra.deleteMany();
  await prisma.eventoCalendario.deleteMany();
  await prisma.proyectoPortafolio.deleteMany();
  await prisma.contrato.deleteMany();
  await prisma.cotizacion.deleteMany();
  await prisma.chatMensaje.deleteMany();
  await prisma.chatSesion.deleteMany();
  await prisma.chatAccion.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.servicio.deleteMany();
  await prisma.faq.deleteMany();
  await prisma.certificacion.deleteMany();
  await prisma.conocimiento.deleteMany();
  await prisma.invitacionUsuario.deleteMany();

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
      nombre: "Rodrigo",
      apellidos: "Pacosillo Calcina",
      telefono: "62511524",
      email: "rodrigo@gmail.com",
      ciudad: "La Paz El Alto",
    },
  });
  console.log(`   ✅ Cliente creado: ${cliente.nombre} ${cliente.apellidos}`);

  console.log("📁 Creando proyectos de portafolio...");
  const proyectosPortafolio = await Promise.all([
    prisma.proyectoPortafolio.create({
      data: {
        slug: "remodelacion-residencia-diego",
        titulo: "Remodelación Residencia Diego",
        tipoConstruccion: TipoConstruccion.integral,
        m2Construidos: 65,
        diasEjecucion: 20,
        ubicacion: "Zona cercanía al aeropuerto, Santa Cruz, Bolivia",
        portadaUrl: "https://res.cloudinary.com/fjub0euv/image/upload/v1794204201/constr-art/proyectos/portadas/file_wyaeue.jpg",
        portadaPublicId: "constr-art/proyectos/portadas/file_wyaeue",
        galeriaUrls: [
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205694/constr-art/proyectos/galeria/file_i9kk8z.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205695/constr-art/proyectos/galeria/file_b5l2h4.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205696/constr-art/proyectos/galeria/file_oj3bsf.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205696/constr-art/proyectos/galeria/file_y66hy1.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205697/constr-art/proyectos/galeria/file_kyseth.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205698/constr-art/proyectos/galeria/file_ayiz8e.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205700/constr-art/proyectos/galeria/file_i4aeil.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205700/constr-art/proyectos/galeria/file_jcxhul.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205701/constr-art/proyectos/galeria/file_layjgr.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205702/constr-art/proyectos/galeria/file_samv3b.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205703/constr-art/proyectos/galeria/file_r3orf5.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205704/constr-art/proyectos/galeria/file_cbgkgj.jpg",
        ],
        galeriaPublicIds: [
          "constr-art/proyectos/galeria/file_i9kk8z",
          "constr-art/proyectos/galeria/file_b5l2h4",
          "constr-art/proyectos/galeria/file_oj3bsf",
          "constr-art/proyectos/galeria/file_y66hy1",
          "constr-art/proyectos/galeria/file_kyseth",
          "constr-art/proyectos/galeria/file_ayiz8e",
          "constr-art/proyectos/galeria/file_i4aeil",
          "constr-art/proyectos/galeria/file_jcxhul",
          "constr-art/proyectos/galeria/file_layjgr",
          "constr-art/proyectos/galeria/file_samv3b",
          "constr-art/proyectos/galeria/file_r3orf5",
          "constr-art/proyectos/galeria/file_cbgkgj",
        ],
        destacado: true,
        publicado: true,
        orden: 0,
      },
    }),
    prisma.proyectoPortafolio.create({
      data: {
        slug: "quinta-rehabilitacion",
        titulo: "Quinta en Rehabilitación",
        tipoConstruccion: TipoConstruccion.integral,
        m2Construidos: 350,
        diasEjecucion: 80,
        ubicacion: "Tarija, Bolivia",
        galeriaUrls: [],
        galeriaPublicIds: [],
        destacado: true,
        publicado: false,
        orden: 1,
      },
    }),
    prisma.proyectoPortafolio.create({
      data: {
        slug: "campamento-corporativo-pan-silver",
        titulo: "Campamento Corporativo Pan Silver",
        tipoConstruccion: TipoConstruccion.seco,
        m2Construidos: 90,
        diasEjecucion: 15,
        ubicacion: "Bolivia",
        portadaUrl: "https://res.cloudinary.com/fjub0euv/image/upload/v1794204202/constr-art/proyectos/portadas/file_sgjqs9.jpg",
        portadaPublicId: "constr-art/proyectos/portadas/file_sgjqs9",
        galeriaUrls: [
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205711/constr-art/proyectos/galeria/file_plqsn9.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205712/constr-art/proyectos/galeria/file_fdfdf1.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205713/constr-art/proyectos/galeria/file_hzamad.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205714/constr-art/proyectos/galeria/file_rqsnte.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205715/constr-art/proyectos/galeria/file_ipbsux.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205716/constr-art/proyectos/galeria/file_czlmqk.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205717/constr-art/proyectos/galeria/file_sd7hdl.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205718/constr-art/proyectos/galeria/file_way6w9.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205719/constr-art/proyectos/galeria/file_aeuf1z.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205720/constr-art/proyectos/galeria/file_ho7yg4.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205720/constr-art/proyectos/galeria/file_cm6h87.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205721/constr-art/proyectos/galeria/file_yapiuc.jpg",
        ],
        galeriaPublicIds: [
          "constr-art/proyectos/galeria/file_plqsn9",
          "constr-art/proyectos/galeria/file_fdfdf1",
          "constr-art/proyectos/galeria/file_hzamad",
          "constr-art/proyectos/galeria/file_rqsnte",
          "constr-art/proyectos/galeria/file_ipbsux",
          "constr-art/proyectos/galeria/file_czlmqk",
          "constr-art/proyectos/galeria/file_sd7hdl",
          "constr-art/proyectos/galeria/file_way6w9",
          "constr-art/proyectos/galeria/file_aeuf1z",
          "constr-art/proyectos/galeria/file_ho7yg4",
          "constr-art/proyectos/galeria/file_cm6h87",
          "constr-art/proyectos/galeria/file_yapiuc",
        ],
        destacado: false,
        publicado: true,
        orden: 2,
      },
    }),
    prisma.proyectoPortafolio.create({
      data: {
        slug: "plaza-isabela-catolica-asfi",
        titulo: "Plaza Isabela Católica ASFI",
        tipoConstruccion: TipoConstruccion.integral,
        m2Construidos: 220,
        diasEjecucion: 45,
        ubicacion: "Santa Cruz de la Sierra, Bolivia",
        portadaUrl: "https://res.cloudinary.com/fjub0euv/image/upload/v1794204198/constr-art/proyectos/portadas/file_ixzcak.jpg",
        portadaPublicId: "constr-art/proyectos/portadas/file_ixzcak",
        galeriaUrls: [
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205676/constr-art/proyectos/galeria/file_wocdao.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205676/constr-art/proyectos/galeria/file_n8kzkw.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205677/constr-art/proyectos/galeria/file_nkwul0.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205678/constr-art/proyectos/galeria/file_kakpey.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205679/constr-art/proyectos/galeria/file_sbtb21.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205680/constr-art/proyectos/galeria/file_wylszt.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205681/constr-art/proyectos/galeria/file_ilv9nu.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205682/constr-art/proyectos/galeria/file_z3js1d.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205683/constr-art/proyectos/galeria/file_urlsde.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205684/constr-art/proyectos/galeria/file_lvluic.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205684/constr-art/proyectos/galeria/file_rtf117.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794205685/constr-art/proyectos/galeria/file_n64twx.jpg",
        ],
        galeriaPublicIds: [
          "constr-art/proyectos/galeria/file_wocdao",
          "constr-art/proyectos/galeria/file_n8kzkw",
          "constr-art/proyectos/galeria/file_nkwul0",
          "constr-art/proyectos/galeria/file_kakpey",
          "constr-art/proyectos/galeria/file_sbtb21",
          "constr-art/proyectos/galeria/file_wylszt",
          "constr-art/proyectos/galeria/file_ilv9nu",
          "constr-art/proyectos/galeria/file_z3js1d",
          "constr-art/proyectos/galeria/file_urlsde",
          "constr-art/proyectos/galeria/file_lvluic",
          "constr-art/proyectos/galeria/file_rtf117",
          "constr-art/proyectos/galeria/file_n64twx",
        ],
        destacado: true,
        publicado: true,
        orden: 3,
      },
    }),
    prisma.proyectoPortafolio.create({
      data: {
        slug: "oficinas-empresariales",
        titulo: "Oficinas Empresariales",
        tipoConstruccion: TipoConstruccion.seco,
        m2Construidos: 180,
        diasEjecucion: 30,
        ubicacion: "La Paz, Bolivia",
        galeriaUrls: [],
        galeriaPublicIds: [],
        destacado: false,
        publicado: false,
        orden: 4,
      },
    }),
    prisma.proyectoPortafolio.create({
      data: {
        slug: "casa-ecologica-cochabamba",
        titulo: "Casa Ecológica en Cochabamba",
        tipoConstruccion: TipoConstruccion.seco,
        m2Construidos: 160,
        diasEjecucion: 35,
        ubicacion: "Cochabamba, Bolivia",
        galeriaUrls: [],
        galeriaPublicIds: [],
        destacado: false,
        publicado: false,
        orden: 5,
      },
    }),
    prisma.proyectoPortafolio.create({
      data: {
        slug: "construccion-campamento-mina-bedrock",
        titulo: "Construcción de Campamento Mina Bedrock",
        tipoConstruccion: TipoConstruccion.seco,
        m2Construidos: null,
        diasEjecucion: null,
        ubicacion: "Guadalupe, Potosí, Bolivia",
        portadaUrl: "https://res.cloudinary.com/fjub0euv/image/upload/v1794206545/constr-art/proyectos/portadas/file_jwb6ol.jpg",
        portadaPublicId: "constr-art/proyectos/portadas/file_jwb6ol",
        videoUrl: "https://res.cloudinary.com/fjub0euv/video/upload/v1794206588/constr-art/proyectos/videos/file_bdatuk.mp4",
        videoPublicId: "constr-art/proyectos/videos/file_bdatuk",
        galeriaUrls: [
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794206548/constr-art/proyectos/galeria/file_hegxbt.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794206550/constr-art/proyectos/galeria/file_lxcysz.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794206552/constr-art/proyectos/galeria/file_n4jf47.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794206553/constr-art/proyectos/galeria/file_stnbdk.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794206555/constr-art/proyectos/galeria/file_h0y7br.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794206556/constr-art/proyectos/galeria/file_cjdnqi.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794206558/constr-art/proyectos/galeria/file_ombc8w.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794206559/constr-art/proyectos/galeria/file_ds96va.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794206560/constr-art/proyectos/galeria/file_cqpozj.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794206561/constr-art/proyectos/galeria/file_krkfls.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794206563/constr-art/proyectos/galeria/file_ocvais.jpg",
          "https://res.cloudinary.com/fjub0euv/image/upload/v1794206564/constr-art/proyectos/galeria/file_b1m9gx.jpg",
        ],
        galeriaPublicIds: [
          "constr-art/proyectos/galeria/file_hegxbt",
          "constr-art/proyectos/galeria/file_lxcysz",
          "constr-art/proyectos/galeria/file_n4jf47",
          "constr-art/proyectos/galeria/file_stnbdk",
          "constr-art/proyectos/galeria/file_h0y7br",
          "constr-art/proyectos/galeria/file_cjdnqi",
          "constr-art/proyectos/galeria/file_ombc8w",
          "constr-art/proyectos/galeria/file_ds96va",
          "constr-art/proyectos/galeria/file_cqpozj",
          "constr-art/proyectos/galeria/file_krkfls",
          "constr-art/proyectos/galeria/file_ocvais",
          "constr-art/proyectos/galeria/file_b1m9gx",
        ],
        destacado: true,
        publicado: true,
        orden: 6,
      },
    }),
  ]);
  console.log(`   ✅ ${proyectosPortafolio.length} proyectos de portafolio creados`);

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
          "Puede completar el formulario de cotización con los detalles de su obra. Nos comunicamos con usted en 24 horas.",
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
          "Sí, todas nuestras obras tienen garantía de 1 año por construcción y materiales. Respaldamos nuestro trabajo con certificaciones y seguros vigentes.",
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

  console.log("🏗️  Creando usuario cliente + obra activa...");
  const clientePasswordHash = await bcrypt.hash("rodrigo55555", 10);
  const usuarioCliente = await prisma.usuario.create({
    data: {
      nombre: cliente.nombre,
      apellidos: cliente.apellidos,
      email: "rodrigo@gmail.com",
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

  console.log("💬 Creando testimonios de obra...");
  const testimonios = await Promise.all([
    prisma.testimonio.create({
      data: {
        obraId: obra.id,
        clienteId: cliente.id,
        nombrePublico: "Rodrigo P.",
        texto:
          "Increíble cómo en 45 días pasamos de terreno a casa habitable. La calidad de los acabados superó nuestras expectativas. El aislamiento térmico es notable.",
        puntaje: 5,
        estado: EstadoTestimonio.aprobado,
        publicado: true,
      },
    }),
    prisma.testimonio.create({
      data: {
        obraId: obra.id,
        clienteId: cliente.id,
        nombrePublico: "Laura F.",
        texto:
          "Necesitábamos ampliar sin demoler y cumplieron exactamente lo prometido. La ampliación se ve como si siempre hubiera estado ahí.",
        puntaje: 5,
        estado: EstadoTestimonio.aprobado,
        publicado: true,
      },
    }),
    prisma.testimonio.create({
      data: {
        obraId: obra.id,
        clienteId: cliente.id,
        nombrePublico: "Diego T.",
        texto:
          "El local quedó listo en 15 días, justo antes de la inauguración. Profesionales de primera.",
        puntaje: 5,
        estado: EstadoTestimonio.aprobado,
        publicado: true,
      },
    }),
    prisma.testimonio.create({
      data: {
        obraId: obra.id,
        clienteId: cliente.id,
        nombrePublico: "Roberto G.",
        texto:
          "Transformaron una quinta abandonada en una casa hermosa. Preservaron la fachada y modernizaron todo por dentro. Excelente trabajo.",
        puntaje: 4,
        estado: EstadoTestimonio.aprobado,
        publicado: true,
      },
    }),
    prisma.testimonio.create({
      data: {
        obraId: obra.id,
        clienteId: cliente.id,
        nombrePublico: "María L.",
        texto:
          "Contraté solo la cotización pero me sorprendió la profesionalidad y claridad del presupuesto. Muy recomendable.",
        puntaje: 5,
        estado: EstadoTestimonio.pendiente,
        publicado: false,
      },
    }),
  ]);
  console.log(`   ✅ ${testimonios.length} testimonios de obra creados`);

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

  console.log("🧠 Creando base de conocimiento para el chat...");
  const conocimientos = await Promise.all([
    prisma.conocimiento.create({
      data: {
        titulo: "Proceso de trabajo de CONSTR-ART (7 pasos)",
        categoria: "proceso",
        audiencia: AudienciaConocimiento.publico,
        contenido:
          "El proceso de obra en construcción en seco sigue estos pasos: 1) Recepción y análisis de la cotización. 2) Contacto en menos de 24 horas hábiles. 3) Visita técnica y toma de medidas. 4) Propuesta formal con alcances y plazo. 5) Firma de contrato. 6) Ejecución de obra con hitos y avance reportado. 7) Entrega y cierre. El cliente con cuenta puede seguir el avance, hitos, pagos y eventos del calendario desde su portal /cliente.",
      },
    }),
    prisma.conocimiento.create({
      data: {
        titulo: "Qué es la construcción en seco y steel frame",
        categoria: "tecnico",
        audiencia: AudienciaConocimiento.publico,
        contenido:
          "La construcción en seco (steel frame) usa perfiles metálicos galvanizados y placas de yeso/cementicias en lugar de ladrillo y mortero. Ventajas: tiempos de obra más cortos, menor peso sobre la estructura, precisión milimétrica, mejor aislación térmica y acústica, y menos desperdicio en obra. Se usa para vivienda nueva, ampliaciones, tabiques interiores, cielorrasos y revestimientos. También ejecutamos obra tradicional cuando el proyecto lo requiere.",
      },
    }),
    prisma.conocimiento.create({
      data: {
        titulo: "Política de precios y plazos del asistente",
        categoria: "politica",
        audiencia: AudienciaConocimiento.publico,
        contenido:
          "El asistente NO informa precios exactos ni precio por m²: el presupuesto se ajusta por visita técnica y materiales del momento. NO garantiza fechas de inicio o fin específicas; puede mencionar que el contacto se hace en 24-48 horas hábiles. NO habla de temas ajenos a la construcción (piscinas, jardines, decoración, política, religión). Si el visitante pide un precio, se invita a completar la cotización en /cotizacion o escribir por WhatsApp.",
      },
    }),
    prisma.conocimiento.create({
      data: {
        titulo: "Portal del cliente: qué puede hacer cada usuario con cuenta",
        categoria: "sitio_web",
        audiencia: AudienciaConocimiento.cliente,
        contenido:
          "El portal /cliente es de solo lectura para el cliente con cuenta y muestra: sus obras con avance y estado, los hitos visibles de cada obra con fotos, los pagos registrados y su estado (registrado/confirmado), los contratos con su PDF, el calendario con visitas y plazos de su obra, y las actualizaciones con fotos/videos que sube el equipo. El asistente del portal puede consultar sus cotizaciones, el avance de su obra y sus próximos eventos cuando el cliente lo pregunte.",
      },
    }),
    prisma.conocimiento.create({
      data: {
        titulo: "Cómo funciona el sitio web (flujo del visitante)",
        categoria: "sitio_web",
        audiencia: AudienciaConocimiento.publico,
        contenido:
          "El visitante puede: 1) Ver el portafolio de proyectos en /proyectos con fotos, m², días de ejecución y ubicación. 2) Revisar servicios en /servicios (steel frame, tabiques, cielorrasos, revestimientos, aislaciones). 3) Leer preguntas frecuentes en /faq. 4) Completar el formulario de cotización en /cotizacion, que pide tipo de obra, tipo de construcción, superficie aproximada, ubicación y plazo. 5) Al enviar la cotización, llega a la página de éxito con un asistente virtual que responde dudas sobre su solicitud. El equipo revisa cada cotización y contacta en menos de 24 horas hábiles para coordinar visita técnica.",
      },
    }),
    prisma.conocimiento.create({
      data: {
        titulo: "Gestión interna: cotizaciones, contratos, obras e inventario",
        categoria: "proceso",
        audiencia: AudienciaConocimiento.admin,
        contenido:
          "Estados de cotización: nuevo (por revisar) → contactado (tras confirmar contacto) → contratado o no_concretado. Abrir WhatsApp no cambia el estado. Un contrato puede crearse desde una cotización y al hacerlo la cotización pasa a contratado. Los contratos van de borrador a firmado (fecha de firma), y pueden anularse o finalizarse. Las obras nacen en curso, pueden pausarse, finalizarse y entregarse, con progreso 0-100. El inventario registra herramientas (disponible/en_uso/mantenimiento/baja) y materiales con stock; los movimientos de entrada/salida/ajuste quedan en el kardex (movimientos_materiales). Las cuentas de acceso (usuarios) se crean por invitación vinculada a una ficha de cliente.",
      },
    }),
  ]);
  console.log(`   ✅ ${conocimientos.length} entradas de conocimiento creadas`);

  console.log("\n🎉 ¡Seed completado exitosamente!");
  console.log(`   Usuarios: 2 (admin@gmail.com, rodrigo@gmail.com)`);
  console.log(`   Cliente: 1 (Rodrigo Pacosillo Calcina)`);
  console.log(`   Cotizaciones: 0`);
  console.log(`   Proyectos portafolio: ${proyectosPortafolio.length}`);
  console.log(`   Testimonios: ${testimonios.length}`);
  console.log(`   Servicios: ${servicios.length}`);
  console.log(`   FAQs: ${faqs.length}`);
  console.log(`   Certificaciones: ${certificaciones.length}`);
  console.log(`   Conocimiento: ${conocimientos.length}`);
  console.log(`   Obras activas: 1 (rodrigo@gmail.com / rodrigo55555)`);
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
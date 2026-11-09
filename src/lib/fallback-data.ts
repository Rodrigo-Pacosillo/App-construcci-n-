import type { Certificacion, Faq, Servicio } from "@prisma/client";

// ─── Fallbacks de contenido ─────────────────────────────────────────
// Se muestran cuando la BD devuelve vacío (por ejemplo, seed no corrido).
// MANTENER SINCRONIZADOS con prisma/seed.ts: mismo contenido, mismos slugs.
// No borrar: son la red de seguridad de la demo si la BD no responde.

const _FALLBACK_SERVICIOS: Omit<Servicio, "actualizadoEn">[] = [
  {
    id: "1",
    slug: "steel-frame",
    titulo: "Steel Frame",
    descripcion:
      "Construcción de viviendas y estructuras con perfilería de acero galvanizado. Más liviano, más rápido, más eficiente térmicamente.",
    orden: 1,
    activo: true,
  },
  {
    id: "2",
    slug: "drywall",
    titulo: "Tabiquería Drywall",
    descripcion:
      "Tabiques internos en placa de yeso sobre estructura de acero. Rápido, limpio y con excelente aislación acústica y térmica.",
    orden: 2,
    activo: true,
  },
  {
    id: "3",
    slug: "cielorrasos",
    titulo: "Cielorrasos",
    descripcion:
      "Cielorrasos suspendidos en placa de yeso, con opciones de diseños, iluminación empotrada y acabados lisos o texturizados.",
    orden: 3,
    activo: true,
  },
  {
    id: "4",
    slug: "revestimientos",
    titulo: "Revestimientos",
    descripcion:
      "Revestimientos interiores y exteriores en placas de yeso, fibrocemento u otros materiales. Acabados profesionales garantizados.",
    orden: 4,
    activo: true,
  },
  {
    id: "5",
    slug: "aislaciones",
    titulo: "Aislaciones Térmicas y Acústicas",
    descripcion:
      "Instalación de lana de vidrio, lana de roca y otros materiales aislantes para máxima eficiencia energética y confort.",
    orden: 5,
    activo: true,
  },
  {
    id: "6",
    slug: "habilitaciones",
    titulo: "Habilitaciones de Locales",
    descripcion:
      "Trámites y ejecución para habilitación de locales comerciales, oficinas y espacios gastronómicos. Cumplimiento de normativas.",
    orden: 6,
    activo: true,
  },
];

export const FALLBACK_SERVICIOS: Servicio[] = _FALLBACK_SERVICIOS.map((s) => ({
  ...s,
  actualizadoEn: new Date(0),
}));

export const FALLBACK_PROYECTOS = [
  {
    id: "1",
    slug: "remodelacion-residencia-diego",
    titulo: "Remodelación Residencia Diego",
    tipoConstruccion: "integral",
    m2Construidos: 65,
    diasEjecucion: 20,
    ubicacion: "Zona cercanía al aeropuerto, Santa Cruz, Bolivia",
    videoUrl: null,
    portadaUrl: "https://res.cloudinary.com/fjub0euv/image/upload/v1794204201/constr-art/proyectos/portadas/file_wyaeue.jpg",
    orden: 0,
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
    destacado: true,
    publicado: true,
  },
  {
    id: "2",
    slug: "quinta-rehabilitacion",
    titulo: "Quinta en Rehabilitación",
    tipoConstruccion: "integral",
    m2Construidos: 350,
    diasEjecucion: 80,
    ubicacion: "Tarija, Bolivia",
    videoUrl: null,
    portadaUrl: null,
    orden: 1,
    galeriaUrls: [],
    destacado: true,
    publicado: false,
  },
  {
    id: "3",
    slug: "campamento-corporativo-pan-silver",
    titulo: "Campamento Corporativo Pan Silver",
    tipoConstruccion: "seco",
    m2Construidos: 90,
    diasEjecucion: 15,
    ubicacion: "Bolivia",
    videoUrl: null,
    portadaUrl: "https://res.cloudinary.com/fjub0euv/image/upload/v1794204202/constr-art/proyectos/portadas/file_sgjqs9.jpg",
    orden: 2,
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
    destacado: false,
    publicado: true,
  },
  {
    id: "4",
    slug: "plaza-isabela-catolica-asfi",
    titulo: "Plaza Isabela Católica ASFI",
    tipoConstruccion: "integral",
    m2Construidos: 220,
    diasEjecucion: 45,
    ubicacion: "Santa Cruz de la Sierra, Bolivia",
    videoUrl: null,
    portadaUrl: "https://res.cloudinary.com/fjub0euv/image/upload/v1794204198/constr-art/proyectos/portadas/file_ixzcak.jpg",
    orden: 3,
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
    destacado: true,
    publicado: true,
  },
  {
    id: "5",
    slug: "oficinas-empresariales",
    titulo: "Oficinas Empresariales",
    tipoConstruccion: "seco",
    m2Construidos: 180,
    diasEjecucion: 30,
    ubicacion: "La Paz, Bolivia",
    videoUrl: null,
    portadaUrl: null,
    orden: 4,
    galeriaUrls: [],
    destacado: false,
    publicado: false,
  },
  {
    id: "6",
    slug: "casa-ecologica-cochabamba",
    titulo: "Casa Ecológica en Cochabamba",
    tipoConstruccion: "seco",
    m2Construidos: 160,
    diasEjecucion: 35,
    ubicacion: "Cochabamba, Bolivia",
    videoUrl: null,
    portadaUrl: null,
    orden: 5,
    galeriaUrls: [],
    destacado: false,
    publicado: false,
  },
  {
    id: "7",
    slug: "construccion-campamento-mina-bedrock",
    titulo: "Construcción de Campamento Mina Bedrock",
    tipoConstruccion: "seco",
    m2Construidos: null,
    diasEjecucion: null,
    ubicacion: "Guadalupe, Potosí, Bolivia",
    videoUrl: "https://res.cloudinary.com/fjub0euv/video/upload/v1794206588/constr-art/proyectos/videos/file_bdatuk.mp4",
    portadaUrl: "https://res.cloudinary.com/fjub0euv/image/upload/v1794206545/constr-art/proyectos/portadas/file_jwb6ol.jpg",
    orden: 6,
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
    destacado: true,
    publicado: true,
  },
];

const _FALLBACK_FAQS: Omit<Faq, "actualizadoEn">[] = [
  {
    id: "1",
    pregunta: "¿Cuánto tarda una vivienda en construcción en seco?",
    respuesta:
      "70 días para una vivienda pequeña (hasta 100 m²), desde el inicio de la obra hasta la entrega de llaves. Es significativamente más rápido que la construcción tradicional.",
    orden: 1,
    activo: true,
  },
  {
    id: "2",
    pregunta: "¿El steel frame es más caro que la construcción tradicional?",
    respuesta:
      "El costo por m² es comparable, pero el ahorro viene por el tiempo de obra (menos intereses si financia) y la eficiencia térmica (menor costo de calefacción y refrigeración).",
    orden: 2,
    activo: true,
  },
  {
    id: "3",
    pregunta: "¿Cómo se calcula el costo de una obra?",
    respuesta:
      "Cobramos por m². El costo varía según el tipo de construcción (tradicional, seco, integral), la ubicación, los acabados y la complejidad. Le damos un presupuesto detallado sin compromiso.",
    orden: 3,
    activo: true,
  },
  {
    id: "4",
    pregunta: "¿Realizan ampliaciones sobre estructuras existentes?",
    respuesta:
      "Sí, tanto en construcción en seco (ideal por su ligereza) como en tradicional. Evaluamos la estructura existente y diseñamos la solución adecuada.",
    orden: 4,
    activo: true,
  },
  {
    id: "5",
    pregunta: "¿Qué tipo de aislación térmica ofrecen?",
    respuesta:
      "En construcción en seco: lana de vidrio o roca entre parantes (coeficiente térmico superior). En tradicional: aislación en techos y muros según la normativa vigente.",
    orden: 5,
    activo: true,
  },
  {
    id: "6",
    pregunta: "¿Trabajan en todo Bolivia?",
    respuesta:
      "Sí, tenemos cobertura nacional en Bolivia.",
    orden: 6,
    activo: true,
  },
  {
    id: "7",
    pregunta: "¿Puedo ver ejemplos de trabajos anteriores?",
    respuesta:
      "Sí, en nuestra sección de proyectos encontrará casos reales con fotos de antes, durante y después, metros cuadrados y tiempos de ejecución.",
    orden: 7,
    activo: true,
  },
  {
    id: "8",
    pregunta: "¿Cómo pido un presupuesto?",
    respuesta:
      "Complete el formulario de cotización con los detalles de su obra. Nos comunicamos con usted en 24 horas.",
    orden: 8,
    activo: true,
  },
  {
    id: "9",
    pregunta: "¿Qué incluye el presupuesto?",
    respuesta:
      "El presupuesto incluye estructura, tabiquería, cielorraso, revestimientos, aislación e instalaciones básicas. No incluye sanitarios, grifería ni pisos (a menos que se especifique).",
    orden: 9,
    activo: true,
  },
  {
    id: "10",
    pregunta: "¿Ofrecen garantía en sus obras?",
    respuesta:
      "Sí, todas nuestras obras tienen garantía de 1 año por vicios de construcción y materiales. Respaldamos nuestro trabajo con certificaciones y seguros vigentes.",
    orden: 10,
    activo: true,
  },
];

export const FALLBACK_FAQS: Faq[] = _FALLBACK_FAQS.map((f) => ({
  ...f,
  actualizadoEn: new Date(0),
}));

export const FALLBACK_TESTIMONIOS = [
  {
    id: "1",
    nombrePublico: "Rodrigo P.",
    texto:
      "Increíble cómo en 45 días pasamos de terreno a casa habitable. La calidad de los acabados superó nuestras expectativas. El aislamiento térmico es notable.",
    puntaje: 5,
    publicado: true,
  },
  {
    id: "2",
    nombrePublico: "Laura Fernández",
    texto:
      "Necesitábamos ampliar sin demoler y cumplieron exactamente lo prometido. La ampliación se ve como si siempre hubiera estado ahí.",
    puntaje: 5,
    publicado: true,
  },
  {
    id: "3",
    nombrePublico: "Diego Torres",
    texto:
      "El local quedó listo en 15 días, justo antes de la inauguración. Profesionales de primera.",
    puntaje: 5,
    publicado: true,
  },
  {
    id: "4",
    nombrePublico: "Roberto García",
    texto:
      "Transformaron una quinta abandonada en una casa hermosa. Preservaron la fachada y modernizaron todo por dentro. Excelente trabajo.",
    puntaje: 4,
    publicado: true,
  },
  {
    id: "5",
    nombrePublico: "María López",
    texto:
      "Contraté solo la cotización pero me sorprendió la profesionalidad y claridad del presupuesto. Muy recomendable.",
    puntaje: 5,
    publicado: true,
  },
];

const _FALLBACK_CERTIFICACIONES: Omit<Certificacion, "actualizadoEn">[] = [
  {
    id: "1",
    titulo: "Matrícula Constructora Nacional",
    descripcion:
      "Matrícula habilitante para construcciones en todo el territorio boliviano.",
    imageUrl: null,
    imagePublicId: null,
    activo: true,
  },
  {
    id: "2",
    titulo: "Certificación Steel Frame",
    descripcion:
      "Certificación oficial en sistemas de construcción en seco con perfilería de acero galvanizado.",
    imageUrl: null,
    imagePublicId: null,
    activo: true,
  },
  {
    id: "3",
    titulo: "Garantía de 1 año",
    descripcion:
      "Garantía escrita de 1 año en todas nuestras obras por vicios de construcción y materiales.",
    imageUrl: null,
    imagePublicId: null,
    activo: true,
  },
  {
    id: "4",
    titulo: "Equipo profesional y especializado",
    descripcion:
      "Más de 14 años de experiencia y 200+ obras ejecutadas a nivel nacional en Bolivia.",
    imageUrl: null,
    imagePublicId: null,
    activo: true,
  },
];

export const FALLBACK_CERTIFICACIONES: Certificacion[] = _FALLBACK_CERTIFICACIONES.map(
  (c) => ({ ...c, actualizadoEn: new Date(0) })
);

export const FALLBACK_NUMEROS = [
  { label: "Metros cuadrados", valor: 5000, sufijo: "m²" },
  { label: "Obras ejecutadas", valor: 200, sufijo: "+" },
  { label: "Días — vivienda pequeña", valor: 70, sufijo: "" },
  { label: "Años de experiencia", valor: 14, sufijo: "" },
  { label: "Año de garantía", valor: 1, sufijo: "" },
];
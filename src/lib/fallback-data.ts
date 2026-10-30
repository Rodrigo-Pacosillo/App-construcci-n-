import type { Certificacion, Faq, Servicio } from "@prisma/client";

// ─── Fallbacks de contenido ─────────────────────────────────────────
// Se muestran cuando la BD devuelve vacío (por ejemplo, seed no corrido).
// MANTENER SINCRONIZADOS con prisma/seed.ts: mismo contenido, mismos slugs.
// No borrar: son la red de seguridad de la demo si la BD no responde.

export const FALLBACK_SERVICIOS: Servicio[] = [
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

export const FALLBACK_PROYECTOS = [
  {
    id: "1",
    slug: "casa-steel-frame-santa-cruz",
    titulo: "Casa Steel Frame en Santa Cruz",
    tipoConstruccion: "seco",
    m2Construidos: 220,
    diasEjecucion: 45,
    ubicacion: "Santa Cruz de la Sierra, Bolivia",
    videoUrl: null,
    portadaUrl: "/img/proyectos/pilar-despues.jpg",
    orden: 1,
    problemaCliente:
      "La familia quería una casa moderna y sustentable, pero con presupuesto limitado y plazo ajustado para mudarse.",
    solucion:
      "Construcción en steel frame con aislación térmica de alta eficiencia. Reducción del 40% en tiempo de obra respecto a tradicional, con mejor aislación.",
    destacado: true,
    publicado: true,
  },
  {
    id: "2",
    slug: "ampliacion-zona-sur-la-paz",
    titulo: "Ampliación en La Paz",
    tipoConstruccion: "seco",
    m2Construidos: 65,
    diasEjecucion: 20,
    ubicacion: "Zona Sur, La Paz, Bolivia",
    videoUrl: null,
    portadaUrl: "/img/proyectos/vlopez-despues.jpg",
    orden: 2,
    problemaCliente:
      "Necesitaban un estudio y un dormitorio extra en el piso superior, sin perder el jardín.",
    solucion:
      "Ampliación en steel frame sobre estructura existente. Se logró el doble de espacio sin demoler, con acabados idénticos a la casa original.",
    destacado: true,
    publicado: true,
  },
  {
    id: "3",
    slug: "local-comercial-santa-cruz",
    titulo: "Local Comercial en Santa Cruz",
    tipoConstruccion: "seco",
    m2Construidos: 90,
    diasEjecucion: 15,
    ubicacion: "Equipetrol, Santa Cruz, Bolivia",
    videoUrl: null,
    portadaUrl: "/img/proyectos/santelmo-despues.jpg",
    orden: 3,
    problemaCliente:
      "Un emprendedor quería habilitar un local gastronómico en un sótano, con plazo mínimo de demora.",
    solucion:
      "Acondicionamiento completo con tabiquería drywall, cielorrasos suspendidos y revestimientos resistentes a humedad. Listo en 15 días.",
    destacado: false,
    publicado: true,
  },
  {
    id: "4",
    slug: "quinta-rehabilitacion",
    titulo: "Quinta en Rehabilitación",
    tipoConstruccion: "integral",
    m2Construidos: 350,
    diasEjecucion: 80,
    ubicacion: "Tarija, Bolivia",
    videoUrl: null,
    portadaUrl: "/img/proyectos/sanpedro-despues.jpg",
    orden: 4,
    problemaCliente:
      "Una quinta familiar con décadas de abandono que querían convertir en casa de fin de semana.",
    solucion:
      "Rehabilitación integral: estructura reforzada, nuevos tabiques, aislación, instalaciones. Se preservó la fachada original.",
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
    portadaUrl: "/img/proyectos/oficinas-despues.jpg",
    orden: 5,
    problemaCliente:
      "Una startup necesitaba oficinas modulares que pudieran reconfigurar según crezca el equipo.",
    solucion:
      "Sistema de tabiques desmontables en drywall con puertas corredizas. El espacio se adapta al equipo sin obras.",
    destacado: false,
    publicado: true,
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
    orden: 6,
    problemaCliente:
      "Un arquitecto quería demostrar que la construcción en seco puede ser tan estética como la tradicional.",
    solucion:
      "Casa de diseño con tabiques vistos, cielorrasos de chapa ondulada y amplios vanos de vidrio. Publicada en revista de arquitectura.",
    destacado: false,
    publicado: true,
  },
];

export const FALLBACK_FAQS: Faq[] = [
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
      "Sí, en nuestra sección de proyectos encontrará casos reales con video de la obra, metros cuadrados y tiempos de ejecución.",
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

export const FALLBACK_TESTIMONIOS = [
  {
    id: "1",
    clienteNombre: "Juan Pérez",
    texto:
      "Increíble cómo en 45 días pasamos de terreno a casa habitable. La calidad de los acabados superó nuestras expectativas. El aislamiento térmico es notable.",
    puntaje: 5,
    publicado: true,
  },
  {
    id: "2",
    clienteNombre: "Laura Fernández",
    texto:
      "Necesitábamos ampliar sin demoler y cumplieron exactamente lo prometido. La ampliación se ve como si siempre hubiera estado ahí.",
    puntaje: 5,
    publicado: true,
  },
  {
    id: "3",
    clienteNombre: "Diego Torres",
    texto:
      "El local quedó listo en 15 días, justo antes de la inauguración. Profesionales de primera.",
    puntaje: 5,
    publicado: true,
  },
  {
    id: "4",
    clienteNombre: "Roberto García",
    texto:
      "Transformaron una quinta abandonada en una casa hermosa. Preservaron la fachada y modernizaron todo por dentro. Excelente trabajo.",
    puntaje: 4,
    publicado: true,
  },
  {
    id: "5",
    clienteNombre: "María López",
    texto:
      "Contraté solo la cotización pero me sorprendió la profesionalidad y claridad del presupuesto. Muy recomendable.",
    puntaje: 5,
    publicado: true,
  },
];

export const FALLBACK_CERTIFICACIONES: Certificacion[] = [
  {
    id: "1",
    titulo: "Matrícula Constructora Nacional",
    descripcion:
      "Matrícula habilitante para construcciones en todo el territorio boliviano.",
    imageUrl: null,
    activo: true,
  },
  {
    id: "2",
    titulo: "Certificación Steel Frame",
    descripcion:
      "Certificación oficial en sistemas de construcción en seco con perfilería de acero galvanizado.",
    imageUrl: null,
    activo: true,
  },
  {
    id: "3",
    titulo: "Garantía de 1 año",
    descripcion:
      "Garantía escrita de 1 año en todas nuestras obras por vicios de construcción y materiales.",
    imageUrl: null,
    activo: true,
  },
  {
    id: "4",
    titulo: "Equipo profesional y especializado",
    descripcion:
      "Más de 14 años de experiencia y 200+ obras ejecutadas a nivel nacional en Bolivia.",
    imageUrl: null,
    activo: true,
  },
];

export const FALLBACK_NUMEROS = [
  { label: "Metros cuadrados", valor: 5000, sufijo: "m²" },
  { label: "Obras ejecutadas", valor: 200, sufijo: "+" },
  { label: "Días — vivienda pequeña", valor: 70, sufijo: "" },
  { label: "Años de experiencia", valor: 14, sufijo: "" },
  { label: "Año de garantía", valor: 1, sufijo: "" },
];

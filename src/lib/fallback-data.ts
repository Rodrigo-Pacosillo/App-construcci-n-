import type { Faq, Servicio } from "@prisma/client";

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
    slug: "casa-steel-frame-pilar",
    titulo: "Casa Steel Frame en Pilar",
    tipoConstruccion: "seco",
    m2Construidos: 220,
    diasEjecucion: 45,
    ubicacion: "Pilar, Buenos Aires",
    problemaCliente:
      "La familia quería una casa moderna y sustentable, pero con presupuesto limitado y plazo ajustado para mudarse.",
    solucion:
      "Construcción en steel frame con aislación térmica de alta eficiencia. Reducción del 40% en tiempo de obra respecto a tradicional, con mejor aislación.",
    destacado: true,
    publicado: true,
    fotos: [
      { url: "/img/proyectos/pilar-antes.jpg", fase: "antes", orden: 1 },
      { url: "/img/proyectos/pilar-durante.jpg", fase: "durante", orden: 2 },
      { url: "/img/proyectos/pilar-despues.jpg", fase: "despues", orden: 3 },
    ],
  },
  {
    id: "2",
    slug: "ampliacion-vicente-lopez",
    titulo: "Ampliación en Vicente López",
    tipoConstruccion: "seco",
    m2Construidos: 65,
    diasEjecucion: 20,
    ubicacion: "Vicente López, Buenos Aires",
    problemaCliente:
      "Necesitaban un estudio y un dormitorio extra en el piso superior, sin perder el jardín.",
    solucion:
      "Ampliación en steel frame sobre estructura existente. Se logró el doble de espacio sin demoler, con acabados idénticos a la casa original.",
    destacado: true,
    publicado: true,
    fotos: [
      { url: "/img/proyectos/vlopez-antes.jpg", fase: "antes", orden: 1 },
      { url: "/img/proyectos/vlopez-despues.jpg", fase: "despues", orden: 2 },
    ],
  },
  {
    id: "3",
    slug: "local-comercial-caba",
    titulo: "Local Comercial en CABA",
    tipoConstruccion: "seco",
    m2Construidos: 90,
    diasEjecucion: 15,
    ubicacion: "San Telmo, CABA",
    problemaCliente:
      "Un emprendedor quería habilitar un local gastronómico en un sótano, con plazo mínimo de demora.",
    solucion:
      "Acondicionamiento completo con tabiquería drywall, cielorrasos suspendidos y revestimientos resistentes a humedad. Listo en 15 días.",
    destacado: false,
    publicado: true,
    fotos: [
      { url: "/img/proyectos/santelmo-durante.jpg", fase: "durante", orden: 1 },
      { url: "/img/proyectos/santelmo-despues.jpg", fase: "despues", orden: 2 },
    ],
  },
  {
    id: "4",
    slug: "quinta-rehabilitacion",
    titulo: "Quinta en Rehabilitación",
    tipoConstruccion: "integral",
    m2Construidos: 350,
    diasEjecucion: 80,
    ubicacion: "San Pedro, Buenos Aires",
    problemaCliente:
      "Una quinta familiar con décadas de abandono que querían convertir en casa de fin de semana.",
    solucion:
      "Rehabilitación integral: estructura reforzada, nuevos tabiques, aislación, instalaciones. Se preservó la fachada original.",
    destacado: true,
    publicado: true,
    fotos: [
      { url: "/img/proyectos/sanpedro-antes.jpg", fase: "antes", orden: 1 },
      { url: "/img/proyectos/sanpedro-durante.jpg", fase: "durante", orden: 2 },
      { url: "/img/proyectos/sanpedro-despues.jpg", fase: "despues", orden: 3 },
    ],
  },
  {
    id: "5",
    slug: "oficinas-empresariales",
    titulo: "Oficinas Empresariales",
    tipoConstruccion: "seco",
    m2Construidos: 180,
    diasEjecucion: 30,
    ubicacion: "Microcentro, CABA",
    problemaCliente:
      "Una startup necesitaba oficinas modulares que pudieran reconfigurar según crezca el equipo.",
    solucion:
      "Sistema de tabiques desmontables en drywall con puertas corredizas. El espacio se adapta al equipo sin obras.",
    destacado: false,
    publicado: true,
    fotos: [
      { url: "/img/proyectos/oficinas-durante.jpg", fase: "durante", orden: 1 },
      { url: "/img/proyectos/oficinas-despues.jpg", fase: "despues", orden: 2 },
    ],
  },
  {
    id: "6",
    slug: "casa-ecologica-escobar",
    titulo: "Casa Ecológica en Escobar",
    tipoConstruccion: "seco",
    m2Construidos: 160,
    diasEjecucion: 35,
    ubicacion: "Escobar, Buenos Aires",
    problemaCliente:
      "Un arquitecto quería demostrar que la construcción en seco puede ser tan estética como la tradicional.",
    solucion:
      "Casa de diseño con tabiques vistos, cielorrasos de chapa ondulada y amplios vanos de vidrio. Publicada en revista de arquitectura.",
    destacado: false,
    publicado: true,
    fotos: [],
  },
];

export const FALLBACK_FAQS: Faq[] = [
  {
    id: "1",
    pregunta: "¿Cuánto tarda una casa en steel frame?",
    respuesta:
      "Una vivienda de 100m² tarda entre 30 y 45 días desde el inicio de la obra hasta la entrega de llaves. Es significativamente más rápido que la construcción tradicional.",
    orden: 1,
    activo: true,
  },
  {
    id: "2",
    pregunta: "¿El steel frame es más caro que la construcción tradicional?",
    respuesta:
      "El costo por m² es comparable, pero el ahorro viene por el tiempo de obra (menos interés si financiás) y la eficiencia térmica (menor costo de calefacción/refrigeración).",
    orden: 2,
    activo: true,
  },
  {
    id: "3",
    pregunta: "¿Sirve para ampliaciones?",
    respuesta:
      "Sí, es ideal para ampliaciones porque es más liviano que la estructura tradicional, lo que permite construir sobre estructuras existentes sin refuerzos costosos.",
    orden: 3,
    activo: true,
  },
  {
    id: "4",
    pregunta: "¿Cómo es la aislación térmica?",
    respuesta:
      "El sistema incluye lana de vidrio o roca entre los parantes, logrando un coeficiente térmico superior a la construcción tradicional con muros de 20cm.",
    orden: 4,
    activo: true,
  },
  {
    id: "5",
    pregunta: "¿Trabajan en toda la zona norte del Gran Buenos Aires?",
    respuesta:
      "Sí, cubrimos CABA y toda la zona norte del GBA: Vicente López, San Isidro, Tigre, Pilar, Escobar, y alrededores.",
    orden: 5,
    activo: true,
  },
  {
    id: "6",
    pregunta: "¿Puedo ver ejemplos de trabajos anteriores?",
    respuesta:
      "Sí, en nuestra sección de proyectos encontrarás casos reales con fotos antes/durante/después, metros cuadrados y tiempos de ejecución.",
    orden: 6,
    activo: true,
  },
  {
    id: "7",
    pregunta: "¿Cómo pido un presupuesto?",
    respuesta:
      "Podés usar nuestro estimador online para tener una referencia, o completar el formulario de cotización con los detalles de tu obra. Te contactamos en 24 horas.",
    orden: 7,
    activo: true,
  },
  {
    id: "8",
    pregunta: "¿Qué incluye el presupuesto?",
    respuesta:
      "El presupuesto incluye estructura, tabiquería, cielorraso, revestimientos, aislación e instalaciones básicas. No incluye sanitarios, grifería ni pisos (a menos que se especifique).",
    orden: 8,
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

export const FALLBACK_NUMEROS = [
  { label: "Metros cuadrados", valor: 5000, sufijo: "m2" },
  { label: "Obras ejecutadas", valor: 200, sufijo: "+" },
  { label: "Dias promedio", valor: 35, sufijo: "" },
  { label: "Anos de experiencia", valor: 15, sufijo: "" },
];
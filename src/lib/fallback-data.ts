import type { Certificacion, Faq, Servicio } from "@prisma/client";

// ─── Fallbacks de contenido ─────────────────────────────────────────
// Se muestran cuando la BD devuelve vacío (por ejemplo, seed no corrido).
// MANTENER SINCRONIZADOS con prisma/seed.ts: mismo contenido, mismos slugs.
// No borrar: son la red de seguridad de la demo si la BD no responde.

export const FALLBACK_SERVICIOS: Servicio[] = [
  {
    id: "1",
    slug: "construccion-tradicional",
    titulo: "Construcción tradicional",
    descripcion:
      "Construcción de viviendas y edificaciones con métodos tradicionales de albañilería. Sólida, duradera y con acabados clásicos.",
    orden: 1,
    activo: true,
  },
  {
    id: "2",
    slug: "construccion-en-seco",
    titulo: "Construcción en seco",
    descripcion:
      "Construcción con perfilería de acero galvanizado (Steel Frame). Más liviano, más rápido, más eficiente térmicamente.",
    orden: 2,
    activo: true,
  },
  {
    id: "3",
    slug: "soluciones-integrales",
    titulo: "Soluciones integrales",
    descripcion:
      "Proyectos llave en mano: diseño, gestión de permisos, ejecución y entrega. Un solo interlocutor para toda tu obra.",
    orden: 3,
    activo: true,
  },
];

export const FALLBACK_PROYECTOS = [
  {
    id: "1",
    slug: "proyecto-1",
    titulo: "Proyecto Residencial Santa Cruz",
    tipoConstruccion: "seco",
    m2Construidos: 180,
    diasEjecucion: 70,
    ubicacion: "Santa Cruz de la Sierra, Bolivia",
    problemaCliente:
      "Familia requería vivienda moderna y eficiente en plazo ajustado.",
    solucion:
      "Vivienda Steel Frame con aislación térmica de alta eficiencia. Entregada en 70 días con acabados premium.",
    destacado: true,
    publicado: true,
    fotos: [
      { url: "/img/proyectos/proyecto1-antes.jpg", fase: "antes", orden: 1 },
      { url: "/img/proyectos/proyecto1-durante.jpg", fase: "durante", orden: 2 },
      { url: "/img/proyectos/proyecto1-despues.jpg", fase: "despues", orden: 3 },
    ],
  },
  {
    id: "2",
    slug: "proyecto-2",
    titulo: "Ampliación Comercial La Paz",
    tipoConstruccion: "integral",
    m2Construidos: 120,
    diasEjecucion: 45,
    ubicacion: "La Paz, Bolivia",
    problemaCliente:
      "Local comercial necesitaba ampliar superficie sin cerrar operaciones.",
    solucion:
      "Ampliación en construcción tradicional con ejecución por fases. Operaciones continuaron sin interrupciones.",
    destacado: true,
    publicado: true,
    fotos: [
      { url: "/img/proyectos/proyecto2-antes.jpg", fase: "antes", orden: 1 },
      { url: "/img/proyectos/proyecto2-despues.jpg", fase: "despues", orden: 2 },
    ],
  },
  {
    id: "3",
    slug: "proyecto-3",
    titulo: "Oficinas Corporativas Cochabamba",
    tipoConstruccion: "seco",
    m2Construidos: 200,
    diasEjecucion: 60,
    ubicacion: "Cochabamba, Bolivia",
    problemaCliente:
      "Empresa requería oficinas flexibles y modernas para equipo en crecimiento.",
    solucion:
      "Sistema de tabiques desmontables en Steel Frame. Espacio reconfigurable según necesidades del equipo.",
    destacado: false,
    publicado: true,
    fotos: [
      { url: "/img/proyectos/proyecto3-durante.jpg", fase: "durante", orden: 1 },
      { url: "/img/proyectos/proyecto3-despues.jpg", fase: "despues", orden: 2 },
    ],
  },
  {
    id: "4",
    slug: "proyecto-4",
    titulo: "Vivienda Familiar Sucre",
    tipoConstruccion: "tradicional",
    m2Construidos: 250,
    diasEjecucion: 120,
    ubicacion: "Sucre, Bolivia",
    problemaCliente:
      "Familia buscaba casa tradicional con materiales locales y acabados artesanales.",
    solucion:
      "Construcción tradicional con ladrillo visto, techos de teja y detalles artesanales. Estética colonial contemporánea.",
    destacado: true,
    publicado: true,
    fotos: [
      { url: "/img/proyectos/proyecto4-antes.jpg", fase: "antes", orden: 1 },
      { url: "/img/proyectos/proyecto4-durante.jpg", fase: "durante", orden: 2 },
      { url: "/img/proyectos/proyecto4-despues.jpg", fase: "despues", orden: 3 },
    ],
  },
  {
    id: "5",
    slug: "proyecto-5",
    titulo: "Centro Comercial Tarija",
    tipoConstruccion: "integral",
    m2Construidos: 500,
    diasEjecucion: 180,
    ubicacion: "Tarija, Bolivia",
    problemaCliente:
      "Inversionista requería centro comercial llave en mano con gestión integral.",
    solucion:
      "Solución integral: diseño, permisos, estructura mixta (tradicional + seco), instalaciones y entrega operativa.",
    destacado: false,
    publicado: true,
    fotos: [
      { url: "/img/proyectos/proyecto5-durante.jpg", fase: "durante", orden: 1 },
      { url: "/img/proyectos/proyecto5-despues.jpg", fase: "despues", orden: 2 },
    ],
  },
  {
    id: "6",
    slug: "proyecto-6",
    titulo: "Refacción Hotel Potosí",
    tipoConstruccion: "tradicional",
    m2Construidos: 300,
    diasEjecucion: 90,
    ubicacion: "Potosí, Bolivia",
    problemaCliente:
      "Hotel histórico necesitaba refacción completa preservando fachada patrimonial.",
    solucion:
      "Refacción integral con técnicas tradicionales. Fachada restaurada, interiores modernizados con eficiencia energética.",
    destacado: false,
    publicado: true,
    fotos: [],
  },
];

export const FALLBACK_FAQS: Faq[] = [
  {
    id: "1",
    pregunta: "¿Cuánto tarda una vivienda en construcción en seco?",
    respuesta:
      "70 días para vivienda pequeña (hasta 100m²) desde el inicio de la obra hasta la entrega de llaves. Es significativamente más rápido que la construcción tradicional.",
    orden: 1,
    activo: true,
  },
  {
    id: "2",
    pregunta: "¿Cómo se calcula el costo de una obra?",
    respuesta:
      "Cobramos por m². El costo varía según el tipo de construcción (tradicional, seco, integral), ubicación, acabados y complejidad. Te damos un presupuesto detallado sin compromiso.",
    orden: 2,
    activo: true,
  },
  {
    id: "3",
    pregunta: "¿Realizan ampliaciones sobre estructuras existentes?",
    respuesta:
      "Sí, tanto en construcción en seco (ideal por su ligereza) como en tradicional. Evaluamos la estructura existente y diseñamos la solución adecuada.",
    orden: 3,
    activo: true,
  },
  {
    id: "4",
    pregunta: "¿Qué tipo de aislación térmica ofrecen?",
    respuesta:
      "En construcción en seco: lana de vidrio/roca entre parantes (coeficiente térmico superior). En tradicional: aislación en techos y muros según normativa vigente.",
    orden: 4,
    activo: true,
  },
  {
    id: "5",
    pregunta: "¿Trabajan en todo Bolivia?",
    respuesta:
      "Sí, cobertura nacional. Ejecutamos proyectos en Santa Cruz, La Paz, Cochabamba, Sucre, Tarija, Potosí, Beni, Pando y Oruro.",
    orden: 5,
    activo: true,
  },
  {
    id: "6",
    pregunta: "¿Puedo ver ejemplos de trabajos anteriores?",
    respuesta:
      "Sí, en nuestra sección de proyectos encontrarás casos reales con fotos antes/durante/después, metros cuadrados, tiempos de ejecución y ubicaciones en Bolivia.",
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
  {
    id: "9",
    pregunta: "¿Ofrecen garantía en sus obras?",
    respuesta:
      "Sí, todas nuestras obras tienen garantía de 1 año por vicios de construcción y materiales. Respaldamos nuestro trabajo con certificaciones y seguros vigentes.",
    orden: 9,
    activo: true,
  },
];

export const FALLBACK_TESTIMONIOS = [
  {
    id: "1",
    clienteNombre: "Carlos Mendoza",
    texto:
      "Increíble cómo en 70 días pasamos de terreno a casa habitable. La calidad de los acabados superó nuestras expectativas. El aislamiento térmico es notable.",
    puntaje: 5,
    publicado: true,
  },
  {
    id: "2",
    clienteNombre: "Ana Gutiérrez",
    texto:
      "Necesitábamos ampliar sin cerrar el local y cumplieron exactamente lo prometido. La ampliación se ve como si siempre hubiera estado ahí.",
    puntaje: 5,
    publicado: true,
  },
  {
    id: "3",
    clienteNombre: "Roberto Flores",
    texto:
      "Las oficinas quedaron listas en 60 días, justo antes de la mudanza del equipo. Profesionales de primera, solución integral real.",
    puntaje: 5,
    publicado: true,
  },
  {
    id: "4",
    clienteNombre: "María Vargas",
    texto:
      "Transformaron una casa antigua en una joya colonial moderna. Preservaron la fachada y modernizaron todo por dentro. Excelente trabajo en construcción tradicional.",
    puntaje: 5,
    publicado: true,
  },
  {
    id: "5",
    clienteNombre: "Jorge Ávila",
    texto:
      "Contraté solo la cotización pero me sorprendió la profesionalidad y claridad del presupuesto. Muy recomendable para cualquier tipo de obra.",
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
    activo: true,
  },
  {
    id: "2",
    titulo: "Certificación Steel Frame",
    descripcion:
      "Certificación oficial en sistemas de construcción en seco con perfilería de acero galvanizado.",
    activo: true,
  },
  {
    id: "3",
    titulo: "Garantía de 1 año",
    descripcion:
      "Garantía escrita de 1 año en todas nuestras obras por vicios de construcción y materiales.",
    activo: true,
  },
  {
    id: "4",
    titulo: "Equipo profesional y especializado",
    descripcion:
      "Más de 14 años de experiencia y 200+ obras ejecutadas a nivel nacional en Bolivia.",
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
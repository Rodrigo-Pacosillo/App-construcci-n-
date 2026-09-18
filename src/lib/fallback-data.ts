export const FALLBACK_SERVICIOS = [
  {
    id: "1",
    slug: "steel-frame",
    titulo: "Steel Frame",
    descripcion:
      "Construccion de viviendas y estructuras con perfileria de acero galvanizado. Mas liviano, mas rapido, mas eficiente termicamente.",
    orden: 1,
    activo: true,
  },
  {
    id: "2",
    slug: "drywall",
    titulo: "Tabiqueria Drywall",
    descripcion:
      "Tabiques internos en placa de yeso sobre estructura de acero. Rapido, limpio y con excelente aislacion acustica y termica.",
    orden: 2,
    activo: true,
  },
  {
    id: "3",
    slug: "cielorrasos",
    titulo: "Cielorrasos",
    descripcion:
      "Cielorrasos suspendidos en placa de yeso, con opciones de disenos, iluminacion empotrada y acabados lisos o texturizados.",
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
    titulo: "Aislaciones Termicas y Acusticas",
    descripcion:
      "Instalacion de lana de vidrio, lana de roca y otros materiales aislantes para maxima eficiencia energetica y confort.",
    orden: 5,
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
      "La familia queria una casa moderna y sustentable, pero con presupuesto limitado y plazo ajustado para mudarse.",
    solucion:
      "Construccion en steel frame con aislacion termica de alta eficiencia. Reduccion del 40% en tiempo de obra respecto a tradicional.",
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
    titulo: "Ampliacion en Vicente Lopez",
    tipoConstruccion: "seco",
    m2Construidos: 65,
    diasEjecucion: 20,
    ubicacion: "Vicente Lopez, Buenos Aires",
    problemaCliente:
      "Necesitaban un estudio y un dormitorio extra en el piso superior, sin perder el jardin.",
    solucion:
      "Ampliacion en steel frame sobre estructura existente. Se logro el doble de espacio sin demoler.",
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
      "Un emprendedor queria habilitar un local gastronomico en un sótano, con plazo minimo de demora.",
    solucion:
      "Acondicionamiento completo con tabiqueria drywall, cielorrasos suspendidos y revestimientos resistentes a humedad. Listo en 15 dias.",
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
    titulo: "Quinta en Rehabilitacion",
    tipoConstruccion: "integral",
    m2Construidos: 350,
    diasEjecucion: 80,
    ubicacion: "San Pedro, Buenos Aires",
    problemaCliente:
      "Una quinta familiar con decadas de abandono que querian convertir en casa de fin de semana.",
    solucion:
      "Rehabilitacion integral: estructura reforzada, nuevos tabiques, aislacion, instalaciones. Se preservo la fachada original.",
    destacado: true,
    publicado: true,
    fotos: [
      { url: "/img/proyectos/sanpedro-antes.jpg", fase: "antes", orden: 1 },
      { url: "/img/proyectos/sanpedro-durante.jpg", fase: "durante", orden: 2 },
      { url: "/img/proyectos/sanpedro-despues.jpg", fase: "despues", orden: 3 },
    ],
  },
];

export const FALLBACK_FAQS = [
  {
    id: "1",
    pregunta: "Cuanto tarda una casa en steel frame?",
    respuesta:
      "Una vivienda de 100m2 tarda entre 30 y 45 dias desde el inicio de la obra hasta la entrega de llaves.",
    orden: 1,
    activo: true,
  },
  {
    id: "2",
    pregunta: "El steel frame es mas caro que la construccion tradicional?",
    respuesta:
      "El costo por m2 es comparable, pero el ahorro viene por el tiempo de obra (menos interes si financias) y la eficiencia termica.",
    orden: 2,
    activo: true,
  },
  {
    id: "3",
    pregunta: "Sirve para ampliaciones?",
    respuesta:
      "Si, es ideal para ampliaciones porque es mas liviano que la estructura tradicional, lo que permite construir sobre estructuras existentes sin refuerzos costosos.",
    orden: 3,
    activo: true,
  },
  {
    id: "4",
    pregunta: "Como es la aislacion termica?",
    respuesta:
      "El sistema incluye lana de vidrio o roca entre los parantes, logrando un coeficiente termico superior a la construccion tradicional.",
    orden: 4,
    activo: true,
  },
  {
    id: "5",
    pregunta: "Trabajan en toda la zona norte del Gran Buenos Aires?",
    respuesta:
      "Si, cubrimos CABA y toda la zona norte del GBA: Vicente Lopez, San Isidro, Tigre, Pilar, Escobar, y alrededores.",
    orden: 5,
    activo: true,
  },
];

export const FALLBACK_TESTIMONIOS = [
  {
    id: "1",
    clienteNombre: "Juan Perez",
    texto:
      "Increible como en 45 dias pasamos de terreno a casa habitable. La calidad de los acabados supero nuestras expectativas.",
    puntaje: 5,
    publicado: true,
  },
  {
    id: "2",
    clienteNombre: "Laura Fernandez",
    texto:
      "Necesitabamos ampliar sin demoler y cumplieron exactamente lo prometido. La ampliacion se ve como si siempre hubiera estado ahi.",
    puntaje: 5,
    publicado: true,
  },
  {
    id: "3",
    clienteNombre: "Diego Torres",
    texto:
      "El local quedo listo en 15 dias, justo antes de la inauguracion. Profesionales de primera.",
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

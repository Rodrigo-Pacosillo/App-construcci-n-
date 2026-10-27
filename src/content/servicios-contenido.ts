// Contenido de la PÁGINA DE DETALLE de cada servicio, indexado por slug.
// Las tarjetas (home y /servicios) siguen usando `titulo` y `descripcion` de la tabla `servicios`.
// Si un slug no está aquí, la página de detalle debe mostrar la versión simple de siempre.

export type ServicioContenido = {
  /** Frase principal bajo el título (distinta al texto de la tarjeta). */
  titular: string;
  /** Un párrafo que explica cómo se trabaja. */
  comoTrabajamos: string;
  /** Lista "Qué incluye". */
  incluye: string[];
  /** Frase "Ideal para". */
  idealPara: string;
};

export const servicioContenido: Record<string, ServicioContenido> = {
  "steel-frame": {
    titular:
      "Armamos su casa o ampliación con perfiles de acero galvanizado: una estructura liviana, precisa y lista para recibir aislación y terminaciones.",
    comoTrabajamos:
      "En lugar de levantar muros de ladrillo, armamos un esqueleto de perfiles de acero que se corta y se une con tornillos. La estructura pesa poco sobre la fundación y la obra queda más limpia y ordenada. Como el acero conduce el calor, la aislación va dentro del muro desde el diseño, algo clave en zonas frías.",
    incluye: [
      "Estructura para muros, entrepisos y techo",
      "Cerramiento con placas",
      "Aislación térmica",
      "Preparación para instalaciones eléctricas y sanitarias",
      "Terminaciones listas para pintar",
    ],
    idealPara:
      "Casas nuevas, ampliaciones y segundos pisos (previa evaluación de la estructura existente).",
  },
  drywall: {
    titular: "Divida o renueve ambientes con una obra rápida y limpia, sin ladrillo ni mezcla.",
    comoTrabajamos:
      "Un tabique de drywall es una estructura de perfiles de acero cubierta con placas de yeso. Se arma en el lugar, sin demolición, y el espacio sigue siendo utilizable. Si lo rellenamos con lana aislante, también reduce el ruido entre ambientes. Queda como un muro liso, listo para pintar.",
    incluye: [
      "Tabiques simples o dobles",
      "Placas estándar, resistentes a la humedad (baños, cocinas) o al fuego según el uso",
      "Lana aislante",
      "Puertas y vanos integrados",
      "Masillado y terminación lisa",
    ],
    idealPara: "Oficinas, departamentos, consultorios y cualquier espacio que necesite más divisiones.",
  },
  cielorrasos: {
    titular:
      "Un cielorraso liso que oculta cañerías y cables y deja la luz exactamente donde usted la quiere.",
    comoTrabajamos:
      "Colgamos una estructura de perfiles desde la losa o el techo y la cubrimos con placa de yeso. En el espacio de atrás quedan ocultas las instalaciones, el aislante y la iluminación empotrada. Puede ser plano o con niveles, con acabado liso o texturizado.",
    incluye: [
      "Cielorraso continuo o por niveles",
      "Iluminación empotrada e indirecta",
      "Ocultamiento de instalaciones",
      "Registros de acceso donde hagan falta",
      "Acabado listo para pintar",
    ],
    idealPara:
      "Comercios, oficinas, salas y viviendas donde importan la iluminación y el orden de las instalaciones.",
  },
  revestimientos: {
    titular: "Cambie el aspecto de muros interiores y fachadas con el material correcto para cada lugar.",
    comoTrabajamos:
      "No todos los muros piden lo mismo. Adentro funciona bien la placa de yeso; afuera, con lluvia y sol, se usan materiales como el fibrocemento. Revisamos el muro, preparamos la superficie, colocamos las placas y sellamos las juntas para que el acabado dure y se vea parejo.",
    incluye: [
      "Revisión y preparación del muro",
      "Placas de yeso para interiores",
      "Fibrocemento u otros materiales para exteriores",
      "Tratamiento de juntas",
      "Acabado listo para pintar",
    ],
    idealPara:
      "Renovar fachadas, cubrir muros dañados o desparejos y dar un nuevo aspecto a locales y viviendas.",
  },
  aislaciones: {
    titular: "Menos frío, menos ruido y menos pérdida de calor, con el aislante adecuado en cada lugar.",
    comoTrabajamos:
      "Instalamos lana de vidrio o de roca entre muros, techos y cielorrasos para frenar el paso del calor y del sonido. La lana de roca se elige cuando se pide más resistencia al fuego y buen rendimiento acústico; la de vidrio es liviana y económica. Le recomendamos según el uso del espacio y el clima de su zona.",
    incluye: [
      "Lana de vidrio y de roca",
      "Aislación de techos, muros y cielorrasos",
      "Tratamiento acústico entre ambientes",
      "Barrera de vapor cuando corresponde",
      "Recomendación del material según el uso",
    ],
    idealPara: "Viviendas en zonas frías, techos metálicos, oficinas y locales con ruido.",
  },
  habilitaciones: {
    titular:
      "Preparamos su local u oficina para que cumpla lo que se exige y pueda abrir con los papeles en regla.",
    comoTrabajamos:
      "Habilitar un local no es solo un trámite: el espacio tiene que cumplir lo que pide la normativa. Revisamos qué se exige para su tipo de negocio, adecuamos el espacio con obra en seco y le acompañamos con la documentación. Usted se enfoca en su negocio y nosotros coordinamos la obra y el proceso.",
    incluye: [
      "Revisión de requisitos según el tipo de local",
      "Adecuación del espacio con obra en seco",
      "Coordinación de la documentación",
      "Entrega del local listo para la inspección",
    ],
    idealPara: "Locales comerciales, oficinas, restaurantes, cafés y consultorios.",
  },
};

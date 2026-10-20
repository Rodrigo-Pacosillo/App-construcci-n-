// ─── Estados del embudo de ventas ──────────────────────────────────
// VARCHAR + Zod: cambiar un estado no requiere migración de BD.
// Conjunto reducido según ESPECIFICACION_PANEL_ADMIN_CONTRART.md §5.3:
// no se guardan `visita_tecnica` ni `presupuestado`, y los valores
// antiguos `ganado`/`perdido` se remapean a `contratado`/`no_concretado`.
export const ESTADOS_COTIZACION = [
  "nuevo",
  "contactado",
  "contratado",
  "no_concretado",
] as const;

export type EstadoCotizacion = (typeof ESTADOS_COTIZACION)[number];

// ─── Mapeo lógico de estados antiguos → nuevos (§5.3) ──────────────
// Para migrar datos existentes. NO se ejecuta automáticamente.
export const MAPEO_ESTADOS_ANTIGUOS: Record<string, EstadoCotizacion> = {
  nuevo: "nuevo",
  contactado: "contactado",
  visita_tecnica: "contactado",
  presupuestado: "contactado",
  ganado: "contratado",
  perdido: "no_concretado",
};

// ─── Agrupación visual del panel Cotizaciones (§5.2) ───────────────
// "Por revisar" y "Pendientes" son estados persistidos; "Finalizadas"
// agrupa los dos resultados finales.
export const GRUPOS_COTIZACION = ["por_revisar", "pendientes", "finalizadas"] as const;
export type GrupoCotizacion = (typeof GRUPOS_COTIZACION)[number];

export const ESTADOS_POR_GRUPO: Record<GrupoCotizacion, EstadoCotizacion[]> = {
  por_revisar: ["nuevo"],
  pendientes: ["contactado"],
  finalizadas: ["contratado", "no_concretado"],
};

export const GRUPO_LABELS: Record<GrupoCotizacion, string> = {
  por_revisar: "Por revisar",
  pendientes: "Pendientes",
  finalizadas: "Finalizadas",
};

// ─── Orígenes de las cotizaciones ──────────────────────────────────
// VARCHAR + Zod: agregar un canal no requiere migración de BD
export const ORIGENES_COTIZACION = [
  "web",
  "whatsapp",
  "tiktok",
  "facebook",
  "referido",
  "estimador",
] as const;

export type OrigenCotizacion = (typeof ORIGENES_COTIZACION)[number];

// ─── Navegación pública ────────────────────────────────────────────
export const NAV_ITEMS = [
  { label: "Inicio", href: "/" },
  { label: "Servicios", href: "/servicios" },
  { label: "Proyectos", href: "/proyectos" },
  { label: "FAQ", href: "/faq" },
  { label: "Cotización", href: "/cotizacion" },
] as const;

// ─── Navegación admin: secciones colapsables ───────────────────────
export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: string;
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

export const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    id: "negocio",
    label: "Negocio",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
      { id: "cotizaciones", label: "Cotizaciones", href: "/admin/cotizaciones", icon: "FileText" },
      { id: "contratos", label: "Contratos", href: "/admin/contratos", icon: "FileCheck" },
      { id: "usuarios", label: "Usuarios", href: "/admin/usuarios", icon: "UserCog" },
      { id: "obras", label: "Obras", href: "/admin/obras", icon: "HardHat" },
    ],
  },
  {
    id: "sitio",
    label: "Sitio",
    items: [
      { id: "proyectos", label: "Proyectos", href: "/admin/proyectos", icon: "FolderOpen" },
      { id: "servicios", label: "Servicios", href: "/admin/servicios", icon: "Wrench" },
      { id: "testimonios", label: "Testimonios", href: "/admin/testimonios", icon: "MessageSquare" },
      { id: "certificaciones", label: "Certificaciones", href: "/admin/certificaciones", icon: "Award" },
      { id: "faqs", label: "FAQs", href: "/admin/faqs", icon: "HelpCircle" },
    ],
  },
  {
    id: "secundario",
    label: "Módulos secundarios",
    items: [
      { id: "clientes", label: "Clientes", href: "/admin/clientes", icon: "Users" },
      { id: "empleados", label: "Empleados", href: "/admin/empleados", icon: "Users" },
      { id: "materiales", label: "Materiales", href: "/admin/materiales", icon: "Package" },
      { id: "herramientas", label: "Herramientas", href: "/admin/herramientas", icon: "Wrench" },
    ],
  },
];

// Vista plana para retrocompatibilidad con código existente
export const ADMIN_NAV_ITEMS = ADMIN_NAV_SECTIONS.flatMap((s) =>
  s.items.map(({ label, href, icon }) => ({ label, href, icon })),
);

// ─── Navegación portal cliente: secciones colapsables ──────────────
export const CLIENTE_NAV_SECTIONS: NavSection[] = [
  {
    id: "obra",
    label: "Mi obra",
    items: [
      { id: "resumen", label: "Resumen", href: "/cliente", icon: "LayoutDashboard" },
      { id: "avance", label: "Avance", href: "/cliente/avance", icon: "FileCheck" },
      { id: "pagos", label: "Pagos", href: "/cliente/pagos", icon: "DollarSign" },
      { id: "documentos", label: "Documentos", href: "/cliente/documentos", icon: "FileText" },
    ],
  },
  {
    id: "historial",
    label: "Mi historial",
    items: [
      { id: "cotizaciones", label: "Cotizaciones", href: "/cliente/cotizaciones", icon: "FileText" },
      { id: "contratos", label: "Contratos", href: "/cliente/contratos", icon: "FileCheck" },
    ],
  },
  {
    id: "cuenta",
    label: "Mi cuenta",
    items: [
      { id: "perfil", label: "Perfil", href: "/cliente/perfil", icon: "User" },
    ],
  },
];

// ─── Labels para UI ────────────────────────────────────────────────
// Etiquetas según §5.3 de la especificación.
export const ESTADO_LABELS: Record<EstadoCotizacion, string> = {
  nuevo: "Por revisar",
  contactado: "Pendiente",
  contratado: "Contratada",
  no_concretado: "No concretada",
};

export const ORIGEN_LABELS: Record<OrigenCotizacion, string> = {
  web: "Sitio web",
  whatsapp: "WhatsApp",
  tiktok: "TikTok",
  facebook: "Facebook",
  referido: "Referido",
  estimador: "Estimador",
};

// ─── Colores de estado para UI ─────────────────────────────────────
export const ESTADO_COLORES: Record<EstadoCotizacion, string> = {
  nuevo: "bg-blue-100 text-blue-800",
  contactado: "bg-yellow-100 text-yellow-800",
  contratado: "bg-green-100 text-green-800",
  no_concretado: "bg-red-100 text-red-800",
};

// ─── Estados de obra activa (Fase 2) ───────────────────────────────
export const ESTADOS_OBRA = [
  "en_curso",
  "pausada",
  "finalizada",
  "entregada",
] as const;

export type EstadoObraLabel = (typeof ESTADOS_OBRA)[number];

export const ESTADO_OBRA_LABELS: Record<EstadoObraLabel, string> = {
  en_curso: "En curso",
  pausada: "Pausada",
  finalizada: "Finalizada",
  entregada: "Entregada",
};

export const ESTADO_OBRA_COLORES: Record<EstadoObraLabel, string> = {
  en_curso: "bg-green-100 text-green-800",
  pausada: "bg-yellow-100 text-yellow-800",
  finalizada: "bg-blue-100 text-blue-800",
  entregada: "bg-purple-100 text-purple-800",
};

// ─── Estados de pago de obra (Fase 2) ──────────────────────────────
export const ESTADOS_PAGO = [
  "registrado",
  "confirmado",
] as const;

export type EstadoPagoLabel = (typeof ESTADOS_PAGO)[number];

export const ESTADO_PAGO_LABELS: Record<EstadoPagoLabel, string> = {
  registrado: "Registrado",
  confirmado: "Confirmado",
};

export const ESTADO_PAGO_COLORES: Record<EstadoPagoLabel, string> = {
  registrado: "bg-gray-100 text-gray-600",
  confirmado: "bg-green-100 text-green-800",
};

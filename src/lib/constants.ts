// ─── Estados del embudo de ventas ──────────────────────────────────
// VARCHAR + Zod: cambiar un estado no requiere migración de BD
export const ESTADOS_COTIZACION = [
  "nuevo",
  "contactado",
  "visita_tecnica",
  "presupuestado",
  "ganado",
  "perdido",
] as const;

export type EstadoCotizacion = (typeof ESTADOS_COTIZACION)[number];

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

// ─── Navegación admin ──────────────────────────────────────────────
export const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { label: "Cotizaciones", href: "/admin/cotizaciones", icon: "FileText" },
  { label: "Proyectos", href: "/admin/proyectos", icon: "FolderOpen" },
  { label: "Obras", href: "/admin/obras", icon: "HardHat" },
  { label: "Testimonios", href: "/admin/testimonios", icon: "MessageSquare" },
  { label: "Servicios", href: "/admin/servicios", icon: "Wrench" },
  { label: "FAQs", href: "/admin/faqs", icon: "HelpCircle" },
] as const;

// ─── Labels para UI ────────────────────────────────────────────────
export const ESTADO_LABELS: Record<EstadoCotizacion, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  visita_tecnica: "Visita técnica",
  presupuestado: "Presupuestado",
  ganado: "Ganado",
  perdido: "Perdido",
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
  visita_tecnica: "bg-purple-100 text-purple-800",
  presupuestado: "bg-orange-100 text-orange-800",
  ganado: "bg-green-100 text-green-800",
  perdido: "bg-red-100 text-red-800",
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

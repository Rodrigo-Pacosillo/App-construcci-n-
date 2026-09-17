Sitio web — Contratista de construcción en seco (steel frame)
Qué es este proyecto

Sistema web para un contratista independiente de construcción en seco(steel frame, tabiques de drywall, cielorrasos, revestimientos, aislaciones).

    Sitio público: portafolio de obras, servicios, testimonios, FAQ,estimador orientativo y captura de cotizaciones. Requisito #1: SEO local.
    Panel admin (/admin): gestión de cotizaciones con embudo de ventas,portafolio, testimonios y contenido del sitio.

El propósito de cada página pública es uno de dos: convertir (cotización)o posicionar (SEO). Toda decisión de UI y animación sirve a eso: transmitirsolidez y confianza. Nada decorativo por decorar.
FASE ACTUAL: DEMO — leer antes de cualquier tarea

Estamos construyendo una demo con datos de muestra para mostrarle al dueñodel negocio. Esto gobierna las decisiones:

    Todo el contenido (proyectos, testimonios, servicios, precios) escontenido semilla cargado por prisma/seed.ts. Datos verosímiles,NO reales.
    Las imágenes viven en /public/img/ (stock descargado). NO implementarupload de imágenes ni integrar storage externo — decisión postergada apropósito hasta que el dueño apruebe.
    NO implementar nada de Fase 2 (portal de cliente, obras, hitos, pagos)aunque schema.prisma incluya esos modelos. Están para que la migraciónfutura no duela, no para codear ahora.
    Restricción dura: todo corre en tiers gratis (Vercel Hobby + Neon free).

Stack (cerrado — no agregar dependencias sin justificar contra esto)

    Next.js + TypeScript (App Router) — Server Components por defecto;use client solo donde es imprescindible
    Prisma + PostgreSQL (Neon) — migraciones versionadas
    Zod — única capa de validación; tipos derivados con z.infer
    Auth.js v5 — protege /admin vía middleware desde el día 1
    Tailwind CSS
    Motion — micro-interacciones UI (hovers, reveals, acordeones)
    GSAP + ScrollTrigger — scroll narrativo con pinning

Reglas del proyecto (no negociables)

    Validación: todo input pasa por schema Zod en el server action.Nunca confiar en el cliente.
    Dominio: los datos de negocio viven en clientes; usuarios soloresuelve login y permisos. Nunca duplicar datos entre ambos.
    Contenido desde BD: ninguna página pública hardcodea contenido;todo sale de la BD (en demo: del seed).
    Animaciones: Motion para UI, GSAP para scroll. Toda animación respetaprefers-reduced-motion.
    Imágenes: jamás binarios en la BD — siempre rutas/URLs.
    Queries Prisma: solo en Server Components o server actions, nuncaen componentes cliente.
    Nomenclatura: español sin tildes ni ñ (cotizacion, presupuesto),consistente con el modelo de datos. Copy de UI en español rioplatensecon voseo (Pedí tu presupuesto).

Mapa del repositorio

    src/app/ — sitio público: /, /proyectos/[slug], /servicios/[slug],/cotizacion, /estimador, /faq
    src/app/admin/ — panel protegido por middleware
    src/components/ — sections/, proyecto/, ui/, admin/
    src/lib/ — db.ts, auth.ts, constants.ts (estados, orígenes, nav),validators.ts (schemas Zod compartidos)
    prisma/ — schema.prisma (fuente de verdad del modelo) + seed.ts
    public/img/ — imágenes de demo

Documentación por tarea — leer ANTES de empezar
Si la tarea es...	Leer primero
Setup, estructura, convenciones	docs/arquitectura.md
Tocar el modelo o queries	prisma/schema.prisma + docs/modelo-datos.md
Tocar UI, estilos o animaciones	docs/diseno-ui.md
Decidir qué hacer / en qué orden	docs/plan-demo.md
Identidad visual (resumen — detalle en docs/diseno-ui.md)

Estética spec sheet / plano técnico: tema claro, hero y footer oscuros,acento naranja de obra, bordes de 1px en vez de sombras blandas, etiquetasen fuente mono uppercase. No crear UI fuera de este lenguaje.
Comandos

    pnpm dev — desarrollo
    pnpm build — build de producción
    pnpm db:migrate — crear/aplicar migraciones
    pnpm db:seed — reset + recarga de datos semilla (solo dev/demo)

Infraestructura

    Deploy: Vercel (Hobby) por push; previews por rama
    BD: Neon — branch dev para desarrollo (conexión pooled), main paraproducción
    Secrets: DATABASE_URL, AUTH_SECRET
    Entorno: devcontainer (Node 22 + pnpm) 

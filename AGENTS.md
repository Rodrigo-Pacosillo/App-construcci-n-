# Sitio web — Contratista de construcción en seco (steel frame)

## Qué es este proyecto

Sistema web para un contratista independiente de construcción en seco
(steel frame, tabiques de drywall, cielorrasos, revestimientos, aislaciones).

- **Sitio público:** portafolio de obras, servicios, testimonios, FAQ,
  estimador orientativo y captura de cotizaciones. Requisito #1: SEO local.
- **Panel admin (/admin):** gestión de cotizaciones con embudo de ventas,
  portafolio, testimonios, contenido del sitio y obras activas (hitos/pagos).
- **Portal cliente (/cliente):** área autenticada donde cada cliente ve sus
  contratos, cotizaciones, avance de obra y perfil.

El propósito de cada página pública es uno de dos: **convertir** (cotización)
o **posicionar** (SEO). Toda decisión de UI y animación sirve a eso: transmitir
solidez y confianza. Nada decorativo por decorar.

## FASE ACTUAL: DEMO — leer antes de cualquier tarea

Estamos construyendo una demo con datos de muestra para mostrarle al dueño
del negocio. Esto gobierna las decisiones:

- Todo el contenido (proyectos, testimonios, servicios, precios) es
  **contenido semilla** cargado por `prisma/seed.ts`. Datos verosímiles,
  NO reales.
- Las imágenes viven en `/public/img/` (stock descargado). **NO implementar
  upload de imágenes ni integrar storage externo** — decisión postergada a
  propósito hasta que el dueño apruebe.
- **Portal de cliente y obras activas — YA IMPLEMENTADOS** (auth unificado,
  `/cliente`, `/admin/obras`, hitos y pagos). No agregar módulos nuevos
  (facturación, portal avanzado, etc.) sin aprobación del dueño.
- Restricción dura: todo corre en tiers gratis (**Vercel Hobby + Neon free**).

## Stack (cerrado — no agregar dependencias sin justificar contra esto)

- **Next.js + TypeScript** (App Router) — Server Components por defecto;
  `"use client"` solo donde es imprescindible
- **Prisma + PostgreSQL** (Neon) — migraciones versionadas
- **Zod** — única capa de validación; tipos derivados con `z.infer`
- **Auth.js v5** — protege `/admin` y `/cliente` (`src/proxy.ts` + guards
  de layout)
- **Tailwind CSS**
- **Motion** — micro-interacciones UI (hovers, reveals, acordeones)
- **GSAP + ScrollTrigger** — scroll narrativo con pinning

## Reglas del proyecto (no negociables)

1. **Validación:** todo input pasa por schema Zod en el server action.
   Nunca confiar en el cliente.
2. **Dominio:** los datos de negocio viven en `clientes`; `usuarios` solo
   resuelve login y permisos. Nunca duplicar datos entre ambos.
3. **Contenido desde BD:** ninguna página pública hardcodea contenido;
   todo sale de la BD (en demo: del seed).
4. **Animaciones:** Motion para UI, GSAP para scroll. Toda animación respeta
   `prefers-reduced-motion`.
5. **Imágenes:** jamás binarios en la BD — siempre rutas/URLs.
6. **Queries Prisma:** solo en Server Components o server actions, nunca
   en componentes cliente.
7. **Nomenclatura:** español sin tildes ni ñ (`cotizacion`, `presupuesto`),
   consistente con el modelo de datos. Copy de UI en español rioplatense
   con voseo ("Pedí tu presupuesto").

## Mapa del repositorio

- `src/app/` — sitio público: `/`, `/proyectos/[slug]`, `/servicios/[slug]`,
  `/cotizacion`, `/estimador`, `/faq`, `/login`, `/registro`
- `src/app/admin/` — panel protegido (cotizaciones, obras, contenido)
- `src/app/cliente/` — portal de cliente (contratos, cotizaciones, obra, perfil)
- `src/components/` — `sections/`, `proyecto/`, `ui/`, `admin/`, `cliente/`,
  `auth/`
- `src/lib/` — `db.ts`, `auth.ts`, `constants.ts` (estados, orígenes, nav),
  `validators.ts` (schemas Zod compartidos)
- `prisma/` — `schema.prisma` (fuente de verdad del modelo) + `seed.ts`
- `public/img/` — imágenes de demo

## Documentación por tarea — leer ANTES de empezar

| Si la tarea es...                    | Leer primero                              |
| ------------------------------------ | ----------------------------------------- |
| Setup, estructura, convenciones      | `docs/arquitectura.md`                    |
| Tocar el modelo o queries            | `prisma/schema.prisma` + `docs/modelo-datos.md` |
| Tocar UI, estilos o animaciones      | `docs/diseno-ui.md`                       |
| Decidir qué hacer / en qué orden     | `docs/plan-demo.md`                       |

## Identidad visual (resumen — detalle en `docs/diseno-ui.md`)

Estética "spec sheet / plano técnico": tema claro, hero y footer oscuros,
acento naranja de obra, bordes de 1px en vez de sombras blandas, etiquetas
en fuente mono uppercase. No crear UI fuera de este lenguaje.

## Comandos

- `pnpm dev` — desarrollo
- `pnpm build` — build de producción
- `pnpm db:migrate` — crear/aplicar migraciones
- `pnpm db:seed` — DESTRUCTIVO: borra y recarga los datos semilla (demo)

## Infraestructura

- Deploy: Vercel (Hobby) por push; previews por rama
- BD: Neon — una única branch (`main`/production), conexión pooled
- Migraciones: NO corren en el build de Vercel; aplicarlas a mano contra la BD
- Secrets: `DATABASE_URL`, `AUTH_SECRET`
- Entorno: devcontainer (Node 22 + pnpm)

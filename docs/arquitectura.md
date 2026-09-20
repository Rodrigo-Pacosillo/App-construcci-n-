# Arquitectura técnica

Cuándo leer: antes de tocar estructura, convenciones o configuración del
proyecto. Modelo de datos: `docs/modelo-datos.md`. Visión de negocio:
`docs/proyecto.md`. Diseño visual: `docs/diseno-ui.md`.

## Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime | Node.js | 22.x |
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript (strict) | 5.x |
| ORM | Prisma | 8.x |
| DB | PostgreSQL (Neon) | — |
| Validación | Zod | 4.x |
| Auth | Auth.js v5 (beta) | 5.0.0-beta |
| CSS | Tailwind CSS v4 | 4.x |
| Animaciones UI | Motion (Framer) | 13.x |
| Animaciones scroll | GSAP + ScrollTrigger | 3.x |
| Iconos | Lucide React | — |
| Tema | next-themes | 0.4.x |

## Estructura del repositorio

```
src/
├── app/
│   ├── layout.tsx              # Root layout (fuentes, ThemeProvider)
│   ├── page.tsx                # Home (/)
│   ├── globals.css             # Tokens + utilidades base
│   ├── cotizacion/page.tsx     # Formulario de cotización (/cotizacion)
│   ├── estimador/page.tsx      # Estimador orientativo (/estimador)
│   ├── faq/page.tsx            # Preguntas frecuentes (/faq)
│   ├── proyectos/
│   │   ├── page.tsx            # Portafolio completo (/proyectos)
│   │   └── [slug]/page.tsx     # Detalle de proyecto (/proyectos/[slug])
│   ├── servicios/
│   │   ├── page.tsx            # Lista de servicios (/servicios)
│   │   └── [slug]/page.tsx     # Detalle de servicio (/servicios/[slug])
│   ├── admin/
│   │   ├── layout.tsx          # Layout admin (sidebar, auth check)
│   │   ├── page.tsx            # Dashboard embudo
│   │   ├── cotizaciones/       # CRUD cotizaciones
│   │   ├── proyectos/          # CRUD proyectos + fotos
│   │   ├── testimonios/        # CRUD testimonios
│   │   └── servicios/          # CRUD servicios
│   └── api/
│       └── auth/[...nextauth]/ # Auth.js route handler
├── components/
│   ├── sections/               # Secciones del home (Hero, Servicios, etc.)
│   ├── proyecto/               # Componentes de portafolio
│   ├── ui/                     # Primitivos reutilizables (Button, Card, etc.)
│   ├── admin/                  # Componentes del panel admin
│   └── layout/                 # Header, Footer, Navigation
├── lib/
│   ├── db.ts                   # Instancia singleton de Prisma
│   ├── auth.ts                 # Configuración Auth.js
│   ├── constants.ts            # Enums evolutivos (estados, orígenes, nav)
│   ├── validators.ts           # Schemas Zod compartidos
│   └── utils.ts                # cn() y utilidades generales
└── types/
    └── index.ts                # Tipos compartidos (si needed)
prisma/
├── schema.prisma               # Fuente de verdad del modelo
├── seed.ts                     # Datos semilla para demo
└── migrations/                 # Migraciones versionadas
public/
├── img/                        # Imágenes de demo (stock)
└── fonts/                      # Fuentes locales (si needed)
```

## Convenciones de código

### Server Components vs Client Components

- **Server Components** por defecto (sin `"use client"`)
- `"use client"` solo cuando es imprescindible:
  - Hooks de estado (`useState`, `useReducer`)
  - Efectos secundarios (`useEffect`)
  - Event handlers (`onClick`, `onSubmit`)
  - Browser APIs (`window`, `localStorage`)
  - Animaciones con `motion` o `gsap`

### Queries Prisma

- **SIEMPRE** en Server Components o server actions
- **NUNCA** en componentes cliente
- Patrón: extraer queries a funciones en `src/lib/` o directamente en el Server Component

### Validación

- Todo input pasa por schema Zod en el server action
- Nunca confiar en el cliente
- Schemas compartidos en `src/lib/validators.ts`

### Nomenclatura

- **Archivos:** `kebab-case.ts` (validators.ts, db.ts)
- **Componentes:** `PascalCase.tsx` (HeroSection.tsx, CotizacionForm.tsx)
- **Funciones:** `camelCase.ts` (formatCurrency.ts)
- **Enums BD:** `snake_case` (vivienda_nueva, en_curso)
- **Copy de UI:** español rioplatense con voseo ("Pedí tu presupuesto")

### CSS

- Tailwind v4 con `@theme inline` en `globals.css`
- Utility `cn()` para combinar clases (clsx + tailwind-merge)
- Tokens de color viven en CSS custom properties
- Animaciones: solo `transform` y `opacity` (nunca props de layout)

## Infraestructura

| Servicio | Tier | Uso |
|---|---|---|
| Vercel | Hobby (gratis) | Deploy + previews por rama |
| Neon | Free | PostgreSQL (una única branch: `main`/production) |
| GitHub | Free | Repo + CI básico |

### Environment Variables

```bash
# Base de datos (Neon)
DATABASE_URL=postgresql://...?sslmode=require

# Auth.js
AUTH_SECRET=... (generar con `openssl rand -base64 32`)
```

### Comandos

```bash
pnpm dev          # Desarrollo local
pnpm build        # Build de producción
pnpm lint         # ESLint
pnpm db:migrate   # Crear/aplicar migraciones
pnpm db:seed      # DESTRUCTIVO: borra y recarga los datos semilla (demo)
```

## Decisiones técnicas clave

| Decisión | Por qué |
|---|---|
| App Router (no Pages Router) | Server Components nativos, layouts anidados, streaming |
| Tailwind v4 (no v3) | `@theme inline` simplifica tokens, mejor rendimiento |
| Prisma (no Drizzle/Knex) | Tipo safety completo, migraciones declarativas, DX superior |
| Auth.js v5 (no v4) | Mejor integración App Router, Prisma adapter oficial |
| Zod (no Yup) | Inferencia de tipos nativa, tree-shakeable, más rápido |
| Motion (no React Spring) | Mejor soporte React 19, API más clara |
| GSAP (no CSS animations) | Control preciso de scroll, pinning, timeline |
| pnpm (no npm/yarn) | Más rápido, estricto con dependencias, monorepo-ready |

# Plan de desarrollo — Demo

Cuándo leer: antes de planificar qué hacer, en qué orden, o cuándo
parar. Arquitectura: `docs/arquitectura.md`. Modelo: `docs/modelo-datos.md`.

## Filosofía

Cada paso entrega algo **visible y verificable**. Nada se avanza sin que
lo anterior compile y funcione. El dueño debería poder ver progreso
concreto en cada entregable.

## Orden de construcción

### FASE 1 — Infraestructura base ✅ COMPLETADA

- [x] Next.js + TypeScript + Tailwind v4
- [x] Dependencias core (Prisma, Zod, bcryptjs)
- [x] Dependencias UI (Motion, GSAP, Lucide, next-themes)
- [x] Auth.js v5 + Prisma adapter
- [x] Design tokens en globals.css
- [x] Layout raíz con fuentes + ThemeProvider
- [x] Utility `cn()`

### FASE 2 — Documentación técnica ✅ COMPLETADA

- [x] `docs/arquitectura.md` — stack, estructura, convenciones
- [x] `docs/modelo-datos.md` — modelo, enums, migraciones, seed
- [x] `docs/plan-demo.md` — este archivo

### FASE 3 — Base de datos

**Objetivo:** schema Prisma funcional + seed cargado + queries base.

- [ ] `prisma/schema.prisma` — todas las entidades Fase 1
- [ ] `src/lib/db.ts` — singleton de Prisma
- [ ] `src/lib/constants.ts` — enums evolutivos (estados, orígenes, nav)
- [ ] `src/lib/validators.ts` — schemas Zod compartidos
- [ ] Migración inicial (`pnpm db:migrate`)
- [ ] `prisma/seed.ts` — datos semilla verosímiles
- [ ] Verificar con `pnpm db:seed`

### FASE 4 — Auth + Layout base ✅ COMPLETADA

**Objetivo:** admin protegido, layout público con header/footer.

- [x] `src/lib/auth.ts` — configuración Auth.js
- [x] `src/app/api/auth/[...nextauth]/route.ts` — route handler
- [x] `src/middleware.ts` — proteger `/admin`
- [x] Componente `Header` (nav pública)
- [x] Componente `Footer`
- [x] `src/app/admin/layout.tsx` — layout admin con sidebar
- [x] `src/app/admin/page.tsx` — dashboard mínimo (placeholder)
- [x] `src/app/admin/login/page.tsx` — página de login

### FASE 5 — Páginas públicas (contenido estático) ✅ COMPLETADA

**Objetivo:** todas las páginas públicas con contenido desde BD.

- [x] Home: maqueta de secciones (sin animaciones aún)
- [x] `/servicios` — lista de servicios
- [x] `/servicios/[slug]` — detalle de servicio
- [x] `/proyectos` — portafolio grid
- [x] `/proyectos/[slug]` — detalle de proyecto + fotos
- [x] `/faq` — acordeones
- [x] `/cotizacion` — formulario de captura
- [x] `/estimador` — wizard de 3 pasos

### FASE 6 — Admin CRUD ✅ COMPLETADA

**Objetivo:** panel funcional para gestionar todo el contenido.

- [x] Dashboard — embudo de cotizaciones (tabla)
- [x] Cotizaciones — listar, filtrar, cambiar estado
- [x] Proyectos — CRUD + toggle publicado/destacado
- [x] Testimonios — CRUD + toggle publicado
- [x] Servicios — CRUD + activo/inactivo
- [x] FAQs — CRUD + activo/inactivo

### FASE 7 — Animaciones y scroll ✅ COMPLETADA

**Objetivo:** site con vida — las joyas de la demo.

- [x] Hero — blueprint animado (GSAP timeline)
- [x] Marquee de especialidades (Motion)
- [x] Sección "Números" — contadores animados (Motion)
- [x] Reveals laterales (Motion whileInView)
- [x] Spotlight en cards de servicios
- [x] Testimonios — scroll horizontal

### FASE 8 — SEO + Deploy ✅ COMPLETADA

**Objetivo:** posicionamiento local + deploy en Vercel.

- [x] Meta tags por página (Next.js Metadata API)
- [x] Sitemap dinámico (`/sitemap.xml`)
- [x] Robots.txt
- [ ] Open Graph images
- [ ] Vercel deploy + dominio
- [ ] Neon setup (producción)

### FASE 9 — Polish + Demo final ✅ COMPLETADA

**Objetivo:** pulir para mostrarle al dueño.

- [x] Revisar responsive (mobile, tablet, desktop)
- [x] Testing de accesibilidad
- [x] Performance audit (Lighthouse)
- [ ] Contenido real del dueño (reemplazar seed)
- [ ] Pricing real en estimador
- [ ] Walkthrough grabado para el dueño

---

## Reglas de avance

1. **Una fase a la vez** — no saltar sin completar la anterior
2. **Compila siempre** — `pnpm build` debe pasar antes de cerrar cada fase
3. **Seed verificable** — después de FASE 3, el seed debe cargar sin errores
4. **Visible en cada entregable** — el dueño debería poder ver algo nuevo
5. **Sin scope creep** — si surge algo nuevo, va a la lista, no al código

## Entregables al dueño

| FASE | Qué puede ver |
|---|---|
| 3 | Datos en BD (via Prisma Studio o queries) |
| 4 | Admin login funcional |
| 5 | Sitio público navegable (sin animaciones) |
| 6 | Panel admin completo |
| 7 | Sitio con animaciones y scroll |
| 8 | Deploy en Vercel, accesible por URL |
| 9 | Demo final lista para presentar |

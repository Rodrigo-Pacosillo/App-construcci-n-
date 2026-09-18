# TODO — Pendientes de desarrollo

Estado actual: FASE 1-3 completadas. Ver `docs/plan-demo.md` para el roadmap
completo. Este archivo es la referencia rápida de qué hacer en la próxima sesión.

---

## FASE 4 — Auth + Layout base ✅ COMPLETADA

### 4.1 Auth.js
- [x] `src/lib/auth.ts` — Configuración Auth.js v5 con Prisma adapter + Credentials provider
- [x] `src/app/api/auth/[...nextauth]/route.ts` — Route handler (GET + POST)
- [x] `src/middleware.ts` — Proteger rutas `/admin` con `auth()`

### 4.2 Layout público
- [x] `src/components/layout/Header.tsx` — Nav pública con links de `NAV_ITEMS` + toggle tema
- [x] `src/components/layout/Footer.tsx` — Footer con datos del contratista
- [x] Actualizar `src/app/layout.tsx` — Envolver children con Header + Footer

### 4.3 Layout admin
- [x] `src/app/admin/layout.tsx` — Layout admin con sidebar + check de auth
- [x] `src/app/admin/page.tsx` — Dashboard placeholder (embudo de cotizaciones)
- [x] `src/app/admin/login/page.tsx` — Página de login

---

## FASE 5 — Páginas públicas (contenido estático desde BD) ✅ COMPLETADA

- [x] Home: maqueta de secciones (Hero, Servicios, Proyectos, FAQ, CTA) — sin animaciones aún
- [x] `/servicios/page.tsx` — Lista de servicios
- [x] `/servicios/[slug]/page.tsx` — Detalle de servicio
- [x] `/proyectos/page.tsx` — Portafolio grid
- [x] `/proyectos/[slug]/page.tsx` — Detalle de proyecto + fotos
- [x] `/faq/page.tsx` — Acordeones
- [x] `/cotizacion/page.tsx` — Formulario de captura
- [x] `/estimador/page.tsx` — Wizard de 3 pasos

---

## FASE 6 — Admin CRUD ✅ COMPLETADA

- [x] Dashboard — embudo de cotizaciones (tabla)
- [x] Cotizaciones — listar, filtrar, cambiar estado
- [x] Proyectos — CRUD + toggle publicado/destacado
- [x] Testimonios — CRUD + toggle publicado
- [x] Servicios — CRUD + activo/inactivo
- [x] FAQs — CRUD + activo/inactivo

---

## FASE 7 — Animaciones y scroll (joyas de la demo) ✅ COMPLETADA

- [x] Hero — blueprint animado (GSAP timeline)
- [x] Marquee de especialidades (Motion)
- [x] Sección "Números" — contadores animados (Motion)
- [x] Reveals laterales (Motion whileInView)
- [x] Spotlight en cards
- [x] Testimonios — scroll horizontal

---

## FASE 8 — SEO + Deploy ✅ COMPLETADA

- [x] Meta tags por página (Next.js Metadata API)
- [x] Sitemap dinámico (`/sitemap.xml`)
- [x] Robots.txt
- [ ] Open Graph images
- [ ] Vercel deploy + dominio
- [ ] Neon setup (producción)

---

## FASE 9 — Polish + Demo final ✅ COMPLETADA

- [x] Revisar responsive (mobile, tablet, desktop)
- [x] Testing de accesibilidad
- [x] Performance audit (Lighthouse)
- [ ] Contenido real del dueño (reemplazar seed)
- [ ] Pricing real en estimador
- [ ] Walkthrough grabado para el dueño

---

## NOTAS TÉCNICAS

### Credenciales de demo
- Admin: `admin@demo.com` / `admin123`
- DB: configurar `DATABASE_URL` en `.env.local`
- Auth: generar `AUTH_SECRET` con `openssl rand -base64 32`

### Comandos útiles
```bash
pnpm dev          # Desarrollo local
pnpm build        # Build de producción
pnpm db:migrate   # Crear/aplicar migraciones
pnpm db:seed      # Reset + carga de datos semilla
pnpm db:studio    # Abrir Prisma Studio
```

### Convenciones
- Server Components por defecto; `"use client"` solo donde es imprescindible
- Queries Prisma solo en Server Components o server actions
- Todo input pasa por schema Zod en el server action
- Nomenclatura: español sin tildes (cotizacion, presupuesto)
- Copy UI: español rioplatense con voseo ("Pedí tu presupuesto")

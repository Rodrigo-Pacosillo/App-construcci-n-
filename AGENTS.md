# AGENTS.md — Guía de trabajo para agentes (Contr-art)

> Esta guía es un **índice de autoridad y reglas de trabajo**, no un manual
> completo. Ante cualquier duda funcional, gana la fuente de verdad (abajo);
> este archivo solo te dice dónde está y cómo trabajar.

## Fuentes de verdad (en orden de precedencia)

1. **`ESPECIFICACION_PANEL_ADMIN_CONTRART.md`** — flujo y reglas del panel
   admin (Cotizaciones, Contratos, Usuarios, Obras). Autoridad funcional #1
   para el panel.
2. **`FLUJO DE PERSONAS.md`** — las 4 realidades de una persona (visitante,
   prospecto, cliente-usuario, cliente histórico) y sus reglas duras.
   Autoridad funcional #1 para el flujo de personas.
3. **`DATABASE.md`** — descripción del modelo de datos. Debe reflejar el
   esquema real.
4. **`prisma/schema.prisma`** — **estructura real** de la base de datos.
   Gana ante `DATABASE.md` si hay discrepancia.

Jerarquía para resolver contradicciones:

- Reglas funcionales del panel → `ESPECIFICACION_PANEL_ADMIN_CONTRART.md`.
- Flujo de personas y etapas del negocio → `FLUJO DE PERSONAS.md`.
- Campos y relaciones reales → `prisma/schema.prisma` (y `DATABASE.md` debe
  reflejarlo).
- `AGENTS.md` y `docs/*` son documentación secundaria: se actualizan para
  concordar con lo anterior; **no inventan ni imponen reglas nuevas**.

Si detectás una contradicción entre estos archivos y el código, **no elijas
una versión en silencio**: registrala, determiná si es un error descriptivo
o una decisión pendiente, y pedí confirmación antes de un cambio irreversible.

## Qué es este proyecto

Sistema web para un contratista independiente de construcción en seco
(steel frame, tabiques de drywall, cielorrasos, revestimientos, aislaciones).

- **Sitio público:** portafolio, servicios, testimonios, FAQ, estimador y
  captura de cotizaciones. Propósito de cada página: **convertir** o
  **posicionar**. Requisito #1: SEO local.
- **Panel admin (`/admin`):** gestión del negocio. Cuatro paneles principales:
  **Cotizaciones, Contratos, Usuarios, Obras**.
- **Portal cliente (`/cliente`):** área autenticada de solo lectura; cada
  usuario ve únicamente sus obras, hitos visibles, pagos, contratos y perfil.

## Cliente vs Usuario — NO confundir (regla transversal)

| Concepto | Tabla | Qué es |
|---|---|---|
| **Cliente** | `clientes` | Ficha de **persona/contacto**. Se vincula con cotizaciones, contratos y obras. **Puede existir sin cuenta de acceso.** |
| **Usuario** | `usuarios` | **Cuenta de acceso**: credenciales, rol, estado. Se vincula a un `Cliente` mediante `Usuario.clienteId` (opcional y único). |

- Decí "persona/contacto", "registro de cliente", "ficha del cliente",
  "cliente sin cuenta" cuando hables de `Cliente`.
- Decí "usuario con cuenta", "cuenta de usuario", "usuario autenticado",
  "cuenta del cliente" cuando hables de `Usuario`.
- **Nunca** afirmes que todo `Cliente` puede iniciar sesión.
- En instrucciones técnicas (rutas, permisos, queries, validaciones) usá los
  nombres precisos `Usuario` y `Cliente`. Evitá "el cliente inicia sesión"
  cuando técnicamente hablás de `Usuario`.
- El **panel Usuarios lista cuentas de `usuarios`**, no todos los registros de
  `clientes`. Un prospecto sin cuenta **no** aparece como usuario.
- **No dupliques personas**: crear contrato o cuenta no debe crear otra ficha
  `Cliente` si ya existe la correcta. No asocies dos personas solo porque
  comparten nombre.

## Reglas de negocio que toda la documentación comparte

**Cotizaciones**
- Estado inicial: `nuevo` → etiqueta "Por revisar".
- Tras confirmar manualmente el contacto: `contactado`.
- Resultado final: `contratado` o `no_concretado`.
- Abrir WhatsApp **no** significa que el mensaje se envió: no cambia el estado.
- No agregar pasos obligatorios de visita técnica o presupuesto.
- Las no concretadas se conservan; la persona puede cotizar de nuevo.
- Crear contrato desde cotización: evitar duplicados y marcar `contratado`
  **solo** después de guardar bien.

**Contratos**
- Se inician desde una cotización o desde el panel Contratos.
- `Contrato.cotizacionId` es opcional en el esquema.
- El backend debe impedir más de un contrato por cotización
  (`cotizacionId` **no** es único en el esquema actual).
- Tras guardar: abrir la cuenta existente o continuar a crear cuenta, sin
  duplicar cliente ni usuario.

**Usuarios**
- El panel lista únicamente cuentas `Usuario`.
- Suspender una cuenta requiere confirmación y **no** borra historial,
  contratos ni obras.
- Finalizar una obra **no** desactiva la cuenta.

**Obras e hitos**
- Estados de obra: `en_curso`, `pausada`, `finalizada`, `entregada`. No
  confundir "Finalizada" con "Entregada".
- Los hitos usan `visibleCliente`. **No existe un estado de hito** ni debe
  documentarse como si existiera.
- Hito no visible: guardado en admin, no aparece al cliente.
- Hito visible: se publica al usuario autenticado que corresponde a la obra.
- Visibilidad o fecha pasada **no** prueban que el hito esté completado.

**Seguridad**
- Validar permisos en backend, no solo en frontend.
- Un usuario solo consulta sus propias obras y los hitos visibles de esas obras.
- No exponer notas internas, hashes de contraseña, ni datos de otros clientes.
- No ejecutar operaciones destructivas sin autorización.

## Reglas de trabajo para el agente

1. **Leé primero** la especificación de admin, `FLUJO DE PERSONAS.md`,
   `DATABASE.md` y `prisma/schema.prisma`.
2. Tratá las instrucciones funcionales antiguas de `docs/` como **referencias
   a verificar**, no como autoridad si contradicen las fuentes aprobadas.
3. **No hagas cambios destructivos** ni ejecutes seeds que borran datos sin
   autorización expresa. `npm run db:seed` borra y recarga: corrélo solo a
   propósito.
4. **No modifiques silenciosamente** reglas de negocio, ni crees campos,
   estados o entidades nuevas por iniciativa propia. Si el esquema no alcanza,
   proponé el cambio mínimo y esperá autorización.
5. **Inspeccioná la implementación antes de editar**; presentá un plan breve
   cuando el cambio sea amplio; verificá el resultado antes de declararlo
   terminado. No declares "terminado" solo porque compila.
6. Mantené consistencia entre frontend, backend, esquema y documentación.
7. **No inventes** rutas, comandos, servicios, variables de entorno ni
   capacidades. Si una tarea está pendiente, etiquetala como pendiente.
8. Diferenciá siempre **nombre visible (UI)** y **valor guardado**. Ejemplo:
   `en_curso` → "En ejecución".

## Stack (cerrado — no agregar dependencias sin justificar)

- **Next.js + TypeScript** (App Router) — Server Components por defecto;
  `"use client"` solo donde es imprescindible.
- **Prisma + PostgreSQL** (Neon) — migraciones versionadas.
- **Zod** — única capa de validación; tipos derivados con `z.infer`.
- **Auth.js v5** — protege `/admin` y `/cliente` (`src/proxy.ts` + guards).
- **Tailwind CSS**
- **Motion** — micro-interacciones UI.
- **GSAP + ScrollTrigger** — scroll narrativo con pinning.

## Convenciones del proyecto (no negociables)

1. **Validación:** todo input pasa por schema Zod en el server action. Nunca
   confiar en el cliente.
2. **Dominio:** los datos de negocio viven en `clientes`; `usuarios` solo
   resuelve login y permisos. Nunca duplicar datos entre ambos.
3. **Contenido desde BD:** ninguna página pública hardcodea contenido; todo
   sale de la BD (en demo: del seed). Excepción deliberada:
   `src/lib/fallback-data.ts` se muestra solo cuando la query devuelve vacío.
   **Mantener los fallbacks sincronizados con `seed.ts`.**
4. **Animaciones:** Motion para UI, GSAP para scroll. Toda animación respeta
   `prefers-reduced-motion`.
5. **Imágenes:** jamás binarios en la BD — siempre rutas/URLs.
6. **Queries Prisma:** solo en Server Components o server actions, nunca en
   componentes cliente.
7. **Nomenclatura:** español sin tildes ni ñ (`cotizacion`, `presupuesto`),
   consistente con el modelo de datos. Copy de UI en español neutro con trato
   de usted ("Solicite su presupuesto").

## Mapa del repositorio

- `src/app/(public)/` — sitio público: `/`, `/proyectos/[slug]`,
  `/servicios/[slug]`, `/cotizacion`, `/estimador`, `/faq`, `/login`.
- `src/app/admin/` — panel protegido. Rutas reales incluyen
  `(panel)/cotizaciones`, `(panel)/contratos`, `(panel)/obras`,
  `(panel)/clientes`, `(panel)/usuarios`, `(panel)/proyectos`,
  `(panel)/servicios`, `(panel)/testimonios`, `(panel)/faqs`,
  `(panel)/certificaciones`, `empleados`, `materiales`, `herramientas`,
  `autorizar-cuentas`.
- `src/app/cliente/` — portal de cliente (`/cliente`, `/avance`, `/pagos`,
  `/documentos`, `/cotizaciones`, `/contratos`, `/perfil`).
- `src/app/api/` — route handlers: `auth/[...nextauth]` y
  `admin/{clientes,contratos,cotizaciones,empleados,herramientas,materiales}`.
- `src/components/` — `sections/`, `proyecto/`, `ui/`, `admin/`, `cliente/`,
  `auth/`.
- `src/lib/` — `db.ts`, `auth.ts`, `auth-utils.ts`, `constants.ts`,
  `validators.ts`.
- `src/proxy.ts` — guard de `/admin` (ver Gotchas).
- `prisma/` — `schema.prisma` (fuente de verdad del modelo) + `seed.ts`.
- `public/img/` — imágenes de demo.

## Documentación por tarea — leer ANTES de empezar

| Si la tarea es...                | Leer primero |
| -------------------------------- | ------------ |
| Reglas del panel admin           | `ESPECIFICACION_PANEL_ADMIN_CONTRART.md` |
| Flujo de personas / realidades   | `FLUJO DE PERSONAS.md` |
| Tocar el modelo o queries        | `prisma/schema.prisma` + `DATABASE.md` |
| Setup, estructura, convenciones  | `docs/arquitectura.md` |
| UI, estilos o animaciones        | `docs/diseno-ui.md` |
| Deploy, límites de tier gratis   | `docs/deploy-constraints.md` |

## Identidad visual (resumen — detalle en `docs/diseno-ui.md`)

Estética "spec sheet / plano técnico": tema claro, hero y footer oscuros,
acento naranja de obra, bordes de 1px en vez de sombras blandas, etiquetas en
fuente mono uppercase. No crear UI fuera de este lenguaje. El admin usa los
mismos tokens pero es funcional, sin storytelling.

## Estado de implementación (verificar en código antes de asumir)

> Los docs antiguos pueden describir como terminado algo que es un stub.
> Esta tabla resume lo verificado; si tocás una zona, verificala en el código.

| Zona | Estado |
|---|---|
| Sitio público (home, servicios, proyectos, FAQ, cotización, estimador, SEO) | Implementado |
| Auth (Auth.js v5, JWT, Credentials) + guard `/admin` (`src/proxy.ts`) + guard `/cliente` (layout) | Implementado |
| Portal cliente (resumen, avance, pagos, documentos, cotizaciones, contratos, perfil) | Implementado (solo lectura) |
| Admin · Cotizaciones (lista, detalle, cambio de estado) | Implementado — usa los estados **antiguos** (ver decision pendiente) |
| Admin · Contratos (lista, detalle, alta) | Implementado |
| Admin · Obras (lista, detalle, hitos, pagos) | Implementado — `/admin/obras/new` es placeholder |
| Admin · Proyectos / Servicios / Testimonios / FAQs / Certificaciones | Implementado |
| Admin · Clientes | **Stub** — "módulo en el siguiente paso" |
| Admin · Usuarios | **Placeholder** (`ModuloPlaceholder`) |
| Admin · Empleados / Materiales / Herramientas | Parcial (hay API routes; revisar UI) |
| Alta de cuentas (`/admin/autorizar-cuentas`) | Implementado (vía separada del panel Usuarios) |
| Auto-registro público (`/registro`) | **Eliminado** — cumple la regla "nadie se registra solo" |
| Tests automatizados | **No hay test runner** (ver Gotchas) |

## Comandos

- `npm run dev` — desarrollo
- `npm run build` — build de producción (typecheck incluido)
- `npm run lint` — ESLint (flat config, sin args)
- `npm run db:migrate` — crear/aplicar migraciones
- `npm run db:seed` — **DESTRUCTIVO**: borra y recarga los datos semilla (demo)
- `npm run db:studio` — Prisma Studio (puerto 5555)
- El `postinstall` corre `prisma generate` (necesario antes del primer `dev`)

## Gotchas

- **Next.js 16 renombró el middleware: el archivo es `src/proxy.ts`.**
  El guard de `/admin` vive ahí (matcher `/admin/:path*`) y corre en runtime
  Node.js. Un `src/middleware.ts` mencionado en doc vieja **no se ejecuta**
  (no existe). El guard de `/cliente` vive en su layout, no en el proxy.
- **No hay test runner configurado.** La verificación es `npm run build` +
  `npm run lint` + `npm run db:seed` contra una BD.
- **Credenciales de demo (reales del seed):** `admin@gmail.com` / `admin123`
  y `cliente@gmail.com` / `cliente123`. (Documentación antigua decía
  `admin@demo.com` / `cliente@demo.com`: **incorrecto**.)
- **El seed crea 0 cotizaciones.** Documentación antigua afirmaba ~12-15.
  Si una tarea necesita cotizaciones de demo, hay que agregarlas al seed (o
  cargarlas a mano), no asumir que existen.

## Infraestructura

- Deploy: Vercel (Hobby) por push; previews por rama.
- BD: Neon — una única branch (`main`/production), conexión pooled.
- Migraciones: **no** corren en el build de Vercel; aplicarlas a mano contra
  la BD.
- Migraciones versionadas: `init`, `bd_hardening`,
  `fix_drift_and_modules_5_7` (el `schema.prisma` refleja las tres).
- Secrets: `DATABASE_URL`, `AUTH_SECRET`.
- Entorno: devcontainer (Node 22 + npm). Si `DATABASE_URL` llega vacío, levantá
  un Postgres local para `db:seed`/verificación.

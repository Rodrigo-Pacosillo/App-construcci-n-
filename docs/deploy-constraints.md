# Deploy Constraints — Capa gratuita (Vercel Hobby + Neon Free)

Leer ANTES de hacer cambios que afecten el deploy, el middleware, o la BD.

## Vercel Hobby (gratis)

| Recurso | Límite |
|---|---|
| Edge Functions (legacy `middleware.ts`) | **1 MB** por función |
| Serverless Functions | 10 seg ejecución (Hobby) |
| Bandwidth | 100 GB/mes |
| Despliegues | 100/día |
| Proyectos de producción | 1 |

### ⚠️ Runtime del proxy (actualizado a Next.js 16)
En Next.js 16 `src/middleware.ts` se renombró a **`src/proxy.ts`** y corre
**siempre en runtime Node.js** (el runtime Edge ya no está soportado ni es
configurable). Por eso `src/proxy.ts` SÍ puede importar `auth` —y con él
Prisma— sin el límite de 1 MB que tenía el middleware en Edge.

Regla vigente:
- Verificación de sesión y rol vía `auth()` de Auth.js (JWT, sin query a BD)
- Redirecciones y headers simples

La restricción vieja de "no importar Prisma/Auth.js" aplicaba solo a
`middleware.ts` en Edge y ya NO rige para `proxy.ts`.

## Neon Free

| Recurso | Límite |
|---|---|
| Almacenamiento | 0.5 GB |
| Compute | 191.9 horas/mes (~24/7 un instante) |
| Conexiones concurrentes | 100 |
| Branches | 1 (`main`/production) |
| Backups automáticos | No (solo en planes de pago) |

### ⚠️ Reglas para la BD
- No hacer migraciones destructivas ni pesadas en producción sin aviso
- Migraciones: `pnpm db:migrate` en local; contra la BD de producción se
  aplican a mano (el build de Vercel NO corre `prisma migrate deploy`)
- Connection pooling: siempre usar el URL pooled de Neon (`?pgbouncer=true`)
- Seed: `pnpm db:seed` es DESTRUCTIVO (borra y recarga); correrlo solo a propósito
- Queries: solo en Server Components o server actions, nunca en client components

## Restricciones del proyecto

- Imágenes: servidas desde `/public/img/` (stock de demo), NO de storage externo
- Contenido: todo sale de la BD (en demo: del seed)
- Auth demo: admin `admin@demo.com`/`admin123` y cliente `cliente@demo.com`/`cliente123`
- Fase 2 implementada: portal de cliente (`/cliente`) y obras activas
  (`/admin/obras`, hitos y pagos)
- Copy UI: español rioplatense con voseo

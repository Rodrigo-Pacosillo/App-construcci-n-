# Deploy Constraints — Capa gratuita (Vercel Hobby + Neon Free)

Leer ANTES de hacer cambios que afecten el deploy, el middleware, o la BD.

## Vercel Hobby (gratis)

| Recurso | Límite |
|---|---|
| Edge Functions (middleware/proxy) | **1 MB** por función |
| Serverless Functions | 10 seg ejecución (Hobby) |
| Bandwidth | 100 GB/mes |
| Despliegues | 100/día |
| Proyectos de producción | 1 |

### ⚠️ Regla de oro para el middleware/proxy
**NO importar Prisma, bcryptjs, ni dependencias pesadas** en `src/proxy.ts` o `src/middleware.ts`. El bundle completo debe pesar **< 1 MB**.

Lo que SÍ va en el middleware:
- Verificación JWT liviana (Web Crypto API / `crypto.subtle`)
- Redirecciones
- Headers simples

Lo que NO va en el middleware:
- Prisma Client (~400 KB)
- bcryptjs (~60 KB)
- Auth.js completo (~200 KB)
- Cualquier query a BD

## Neon Free

| Recurso | Límite |
|---|---|
| Almacenamiento | 0.5 GB |
| Compute | 191.9 horas/mes (~24/7 un instante) |
| Conexiones concurrentes | 100 |
| Branches | 1 principal + 1 preview |
| Backups automáticos | No (solo en planes de pago) |

### ⚠️ Reglas para la BD
- No hacer migraciones pesadas en producción (usar `prisma db push` en dev)
- Connection pooling: siempre usar el URL pooled de Neon (`?pgbouncer=true`)
- Seed: solo en desarrollo (`pnpm db:seed`)
- Queries: solo en Server Components o server actions, nunca en client components

## Restricciones del proyecto

- Imágenes: servidas desde `/public/img/` (stock de demo), NO de storage externo
- Contenido: todo sale de la BD (en demo: del seed)
- Auth: solo 1 admin (`admin@demo.com` / `admin123`)
- Solo Fase 1-3 del schema (sin portal de cliente, obras, pagos)
- Copy UI: español rioplatense con voseo

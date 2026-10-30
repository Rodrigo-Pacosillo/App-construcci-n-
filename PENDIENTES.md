# Pendientes — Contr-art (post plan v2)

Este archivo lista lo que falta hacer, priorizado. Nada de esto bloquea el funcionamiento actual del sitio web.

## 1. Foto del lote en cotizaciones (sin Cloudinary todavía)

La columna `foto_lote_url` existe en `cotizaciones` (nullable) pero no se usa en el formulario público.

**Por hacer:**
- Agregar `fotoLoteUrl` a `cotizacionFormSchema` en `src/lib/validators.ts`
- Agregar el campo al formulario público `src/app/(public)/cotizacion/`
- Guardarlo en `cotizacion/actions.ts`
- Mostrarlo en `CotizacionDetalle.tsx` (admin)

**Sin Cloudinary:** usar un input de texto donde se pega una URL (validador permisivo, sin restricción a `res.cloudinary.com`). Cuando haya cuenta de Cloudinary, cambiar el validador a `cloudinaryImageUrl` y agregar el uploader firmado.

---

## 2. Otros pendientes del plan v2 (docs ya actualizados)

- `DATABASE.md` y `docs/modelo-datos.md` ya reflejan el esquema real (20 tablas, sin `origen`, sin `fotos_proyecto`, sin `montoCerrado`, sin `autorizaPublicar`).
- `package.json` tiene `"test": "playwright test"`.
- `tests/critical-flows.spec.ts` usa credenciales reales (`admin@gmail.com`, `cliente@gmail.com`).

---

## 3. Mejora posterior (no urgente)

- Migrar estados de cotización del código (`ganado`/`perdido`) a la especificación (`contratado`/`no_concretado`). Requiere migración de datos y autorización.
- Revisar `PrecioReferencia`: ¿se usa o se elimina?
- Quitar `@auth/prisma-adapter` (configurado pero sin tablas).

---

## Estado actual del sitio

**El sitio web funciona.** `tsc`, `build`, `lint`, `seed` y `migrate status` pasan sin errores. Se pueden dejar tablas vacías o sin llenar sin problema; nada se rompe por eso.

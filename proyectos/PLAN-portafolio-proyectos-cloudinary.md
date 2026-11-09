# PLAN — Portafolio de Proyectos con Cloudinary

**Proyecto:** CONSTR-ART · **Módulo:** `ProyectoPortafolio` (portada + galería + video) · **Fecha:** 09/11/2026

> Este documento es **solo el plan** (idea + decisiones + código de referencia). No ejecuta nada.
> Todo lo que se propone está basado en el código real del repo (`App-construcci-n--main`) y en las
> 100 fotos que subiste (15 + 27 + 58, revisadas una por una — ver §4).

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Estado actual del código: lo que ya tienes y lo que falta](#2-estado-actual-del-código)
3. [Los 3 proyectos mapeados a la tabla `ProyectoPortafolio`](#3-mapeo-de-los-3-proyectos-a-la-tabla)
4. [Curaduría foto por foto + portadas recomendadas](#4-curaduría-foto-por-foto)
5. [Estrategia Cloudinary (carpetas, nombres, transformaciones)](#5-estrategia-cloudinary)
6. [Ruta A — Formulario admin (cuándo sí y cuándo no)](#6-ruta-a--formulario-admin)
7. [Ruta B — Script por lotes (recomendada para esta carga)](#7-ruta-b--script-por-lotes-recomendada)
8. [UI propuesta: wireframes + componentes + rendimiento](#8-ui-propuesta)
9. [Correcciones detectadas en el código (hacer antes de publicar)](#9-correcciones-detectadas-en-el-código)
10. [Mejora opcional: editar proyecto y reordenar galería desde el admin](#10-mejora-opcional-editar-proyecto-y-reordenar-galería)
11. [Plan de trabajo por fases + checklist QA](#11-plan-de-trabajo-por-fases--checklist-qa)
12. [Supuestos y pendientes de confirmación](#12-supuestos-y-pendientes-de-confirmación)

---

## 1. Resumen ejecutivo

La tabla `ProyectoPortafolio` y todo el pipeline admin→Cloudinary→BD **ya existen y funcionan**.
Lo que falta para que el portafolio se vea bien con tus 3 proyectos reales es:

| # | Qué | Tipo |
|---|---|---|
| 1 | Curar las 100 fotos, definir 3 portadas y subirlas a Cloudinary con nombres limpios | Contenido |
| 2 | Crear los 3 registros en la BD (títulos, slugs, tipo, datos que tengas — el resto `null`) | Contenido |
| 3 | **Mostrar la galería en la página de detalle** (hoy se consulta `galeriaUrls` pero **nunca se renderiza**) | UI |
| 4 | **Hero con la portada en el detalle** (hoy la portada solo existe en la tarjeta del listado) | UI |
| 5 | **Espacio vacío del video** con estado "próximamente" (hoy simplemente no aparece nada) | UI |
| 6 | Rendimiento: transformaciones `f_auto,q_auto` + crops por rol + `lazy`/`priority` afinados | Perf |
| 7 | Corregir 3 detalles del código: orden de listado, filtro `publicado` en detalle, proyectos demo del seed | Fix |

**Recomendación de carga:** usar la **Ruta B (script por lotes)** para esta carga inicial, porque el
formulario admin (Ruta A) choca con dos límites reales de tu deploy en Vercel Hobby (body de ~1 MB en
server actions y funciones de 10 s) — ver §6 con los números exactos. La Ruta A queda útil para
galerías pequeñas y ediciones futuras puntuales.

---

## 2. Estado actual del código

Lo que **ya existe** y se va a reutilizar sin cambios (o casi):

| Pieza | Archivo | Estado |
|---|---|---|
| Modelo Prisma | `prisma/schema.prisma` → `ProyectoPortafolio` | ✅ completo (portada, video, galería, publicIds, destacado, publicado, orden) |
| Subida/eliminación Cloudinary | `src/lib/cloudinary.ts` | ✅ `uploadFile` / `deleteFile` con `CLOUDINARY_URL` |
| Server actions admin | `src/app/admin/(panel)/proyectos/actions.ts` | ✅ crear, actualizar, toggles, eliminar (con limpieza de Cloudinary si falla la BD) |
| Formulario de creación | `src/app/admin/(panel)/proyectos/ProyectoForm.tsx` | ✅ portada + galería múltiple + video |
| Listado admin | `src/components/admin/ProyectosList.tsx` | ✅ toggles publicado/destacado + eliminar (sin editar) |
| Listado público | `src/app/(public)/proyectos/page.tsx` | ✅ grid de tarjetas 4:3 |
| Detalle público | `src/app/(public)/proyectos/[slug]/page.tsx` | ⚠️ trae `galeriaUrls` pero **no la muestra**; sin hero de portada; sin estado vacío de video |
| Reproductores de video | `CloudinaryVideoPlayer.tsx` / `TikTokPlayer.tsx` | ✅ click-to-play, listos para cuando haya video |
| Sección home | `src/components/sections/ProyectosSection.tsx` | ✅ usa `destacado` (take 4) |
| Config imágenes | `next.config.ts` | ✅ `res.cloudinary.com` en `remotePatterns` |
| Fallback demo | `src/lib/fallback-data.ts` + `prisma/seed.ts` | ⚠️ 6 proyectos demo con portadas locales — conviene ocultarlos de la BD real (§9) |

**Conclusión:** el plan no toca la arquitectura; agrega 2–3 componentes de UI, 3 scripts de carga
y corrige 3 detalles. Estimación total: **6–8 horas de trabajo**.

---

## 3. Mapeo de los 3 proyectos a la tabla

Cada campo de `ProyectoPortafolio` con el valor propuesto. Los campos que no me diste quedan en
`null` (**no invento datos de obra**) y se completan después desde el admin o Prisma Studio.

### Proyecto 1 — Plaza Isabela Católica ASFI

> Tu texto: *"Plaza Isabela católica ASFI — REMODELACIÓN RETIRO DE CIELO FALSO AMSTRONG Y reposición de cielo falso PVC"*

| Campo | Valor propuesto | Nota |
|---|---|---|
| `slug` | `plaza-isabela-catolica-asfi` | minúsculas, sin acentos (cumple el regex `^[a-z0-9-]+$` de la action) |
| `titulo` | `Remodelación Plaza Isabela Católica ASFI` | el alcance (Armstrong → PVC) iría en `descripcion` (§9.3) o se agrega al título si no quieres migración |
| `tipoConstruccion` | `integral` | remodelación de acabados: en la UI se muestra "SOLUCIÓN INTEGRAL" (si eliges `seco` la tarjeta diría "STEEL FRAME", que no corresponde a un cielo falso) |
| `m2Construidos` | `null` | ⚠️ completar después |
| `diasEjecucion` | `null` | ⚠️ completar después |
| `ubicacion` | `null` | ⚠️ completar después (¿ciudad/zona?) |
| `portadaUrl` / `portadaPublicId` | foto **#14** (ver §4.1) | subida a `constr-art/proyectos/plaza-isabela-catolica-asfi/portada` |
| `videoUrl` / `videoPublicId` | `null` | sin video por ahora — la UI reserva el espacio (§8.3) |
| `galeriaUrls` / `galeriaPublicIds` | las 13 fotos aprobadas de §4.1, **en orden** | |
| `destacado` | `false` | es el más "obrero/proceso" de los tres |
| `publicado` | `false` al crear → `true` tras QA | el formulario siempre crea no publicado; se activa con el toggle del listado |
| `orden` | `3` | ver orden global abajo |

### Proyecto 2 — Remodelación Residencia Diego

> Tu texto: *"REMODELACIÓN de residencia Diego — Zona cercanía al aeropuerto"*

| Campo | Valor propuesto | Nota |
|---|---|---|
| `slug` | `remodelacion-residencia-diego` | |
| `titulo` | `Remodelación Residencia Diego` | |
| `tipoConstruccion` | `integral` | drywall + carpintería de acabados; misma lógica de etiqueta que el anterior |
| `m2Construidos` / `diasEjecucion` | `null` / `null` | ⚠️ completar después |
| `ubicacion` | `Zona cercana al aeropuerto` (texto literal tuyo) o `null` | decide si lo muestras público sin la ciudad |
| `portadaUrl` / `portadaPublicId` | foto **#22** (alternativa: #27, ver §4.2) | |
| `videoUrl` / `videoPublicId` | `null` | |
| `galeriaUrls` / `galeriaPublicIds` | las ~25 fotos aprobadas de §4.2, en orden | |
| `destacado` | `true` | interiores terminados muy atractivos (cielo con LED, mueble TV, chimenea) |
| `publicado` | `false` → `true` tras QA | |
| `orden` | `2` | |

### Proyecto 3 — Campamento Corporativo Pan Silver

> Tu texto: *"Trabajo del pasado año vetillas campamento corporativo pan silver"*.
> Interpreté "vetillas" como **viguetas/cerchas de steel frame** (las fotos #06–#13 muestran justamente
> la estructura) — confirmar en §12. Las fotos cuentan la obra completa: fundación → estructura →
> cierre azul → interiores terminados. Es tu mejor carta de presentación.

| Campo | Valor propuesto | Nota |
|---|---|---|
| `slug` | `campamento-corporativo-pan-silver` | |
| `titulo` | `Campamento Corporativo Pan Silver` | "obra del pasado año" podría ir en `descripcion` (§9.3) |
| `tipoConstruccion` | `seco` | ✅ construction en seco real: perfilería visible en la mayoría de las fotos; la tarjeta mostrará "STEEL FRAME" |
| `m2Construidos` / `diasEjecucion` | `null` / `null` | ⚠️ completar después |
| `ubicacion` | `null` | ⚠️ completar después (altiplano según fotos, pero no invento zona) |
| `portadaUrl` / `portadaPublicId` | foto **#49** (alternativa: #44, ver §4.3) | edificio azul terminado con montaña de fondo, horizontal — la mejor "portada de historia" |
| `videoUrl` / `videoPublicId` | `null` | |
| `galeriaUrls` / `galeriaPublicIds` | las 58 fotos en orden (o ~40 si recortas repetidas de §4.3) | la secuencia completa de obra es un activo comercial: muestra el método steel frame de punta a punta |
| `destacado` | `true` | |
| `publicado` | `false` → `true` tras QA | |
| `orden` | `1` | |

**Orden global propuesto** (campo `orden`): Pan Silver `1` → Residencia Diego `2` → Plaza ASFI `3`.
Con la corrección §9.1, el listado público respetará ese orden en vez del más-recente-primero.

---

## 4. Curaduría foto por foto

Revisé las 3 carpetas completas. Las hojas de contacto con la numeración están en
[`./curaduria/`](./curaduria/) (`proyecto-1-plaza-asfi.jpg`, `proyecto-2-residencia-diego.jpg`,
`proyecto-3-campamento-pan-silver.jpg`) — el número `#NN` de cada tabla corresponde a la miniatura
de esas hojas, y los scripts de §7 usan **el mismo orden alfabético**, así la numeración coincide
de punta a punta.

Veredictos: **PORTADA** (la mejor del proyecto), **GALERÍA** (va), **REVISAR** (a tu criterio),
**DESCARTAR** (no subir).

### 4.1 Plaza Isabela Católica ASFI — 15 fotos (casi todas horizontales 1600×1204)

| # | Contenido | Veredicto |
|---|---|---|
| 01 | Trabajo junto a ventana, material apilado | GALERÍA |
| 02 | Armazón de cielo falso con lámpara circular al centro | GALERÍA |
| 03 | Montaje de estructura con luminarias LED colgando | GALERÍA |
| 04 | Hall con escalera, techo en avance | GALERÍA |
| 05 | Techo de madera en instalación, dos operarios con escalera | GALERÍA |
| 06 | Techo en avance con **marca/dibujo verde sobre la foto** | **DESCARTAR** (parece anotación de obra, no da imagen prolija) |
| 07 | Sala amplia con escalera y cielo armado | GALERÍA |
| 08 | Estructura vista entre ladrillos (muy obstruida) | **DESCARTAR** (o REVISAR) |
| 09 | Cielo de madera + luces, ángulo dramático | GALERÍA (segunda mejor) |
| 10 | Ambiente oscuro con ventana | REVISAR (queda mejor en el lightbox que como miniatura) |
| 11 | Estructura en vertical | GALERÍA (aporta variedad de orientación) |
| 12 | Esquina de cielo armado | GALERÍA |
| 13 | Detalle de luminarias empotradas | GALERÍA |
| **14** | **Cielo de madera con luces cálidas, toma amplia, casi terminado** | **PORTADA** ✅ |
| 15 | Sala con panel de madera vertical + escalera | GALERÍA |

→ Portada: **#14** · Alternativa: **#09** · Galería final: 13 fotos.

### 4.2 Remodelación Residencia Diego — 27 fotos (mayoría verticales 1204×1600)

| # | Contenido | Veredicto |
|---|---|---|
| 01 | Cielo con aislante, oscura | REVISAR |
| 02 | Montaje de cielo de doble nivel | GALERÍA |
| 03 | Estructura metálica con aislante (proceso) | GALERÍA |
| 04 | Detalle de aislante en láminas | GALERÍA |
| 05 | Cielo con aislante + ventanal | GALERÍA |
| 06 | Cielo de sala en avance | GALERÍA |
| 07 | Columna/estructura junto a escalera, operario trabajando | GALERÍA |
| 08 | Detalle de armazón inclinado | GALERÍA |
| 09 | Nichos empotrados en construcción | GALERÍA |
| 10 | Nichos blancos vacíos | REVISAR |
| 11 | Cielo con moldura + lámpara | GALERÍA |
| 12 | Sala en obra con paquetes de madera | GALERÍA |
| 13 | Arco empotrado en progreso | GALERÍA |
| 14 | Mueble TV negro curvo | GALERÍA |
| 15 | Nichos con fondo de madera | GALERÍA |
| 16 | Hall con escalera y trabajo de madera | GALERÍA |
| 17 | Cocina abierta en obra | GALERÍA |
| 18 | Detalle de arco blanco | REVISAR |
| 19 | Mueble TV de listones negros, terminado | GALERÍA |
| 20 | Nichos terminados con marco de madera | GALERÍA |
| 21 | Muro de madera + mármol + barra | GALERÍA |
| **22** | **Cielo con LED azul + madera + mármol, ambiente terminado** | **PORTADA** ✅ (alternativa: #27) |
| 23 | Columna con nichos de madera | GALERÍA |
| 24 | Mueble TV curvo blanco | GALERÍA |
| 25 | Cocina terminada con piso de madera | GALERÍA |
| 26 | Pasillo con puertas de madera | GALERÍA |
| 27 | **Chimenea de diseño curvo con madera — muy impactante** | GALERÍA (PORTADA alternativa) |

→ Portada: **#22** · Alternativa: **#27** · Galería final: 24–25 fotos.

### 4.3 Campamento Corporativo Pan Silver — 58 fotos (mayoría verticales, con horizontales al final)

La serie es una secuencia de obra completa y eso es exactamente lo que la vende como proyecto
steel frame. Recomendación: **subir las 58 en orden**; si prefieres una galería más liviana, recorta
dentro de los bloques marcados "repetidas" quedándote con la mejor de cada serie.

| # | Contenido | Veredicto |
|---|---|---|
| 01–05 | Montaje de perfilería sobre losa, operarios con casco | GALERÍA |
| 06–08 | Armado de estructura y pisos en seco | GALERÍA |
| 09–12 | **Series de estructura muy parecidas entre sí** | GALERÍA (o recortar repetidas) |
| 13 | Cerchas/viguetas del techo apiladas (aquí se ve tu "vetillas") | GALERÍA |
| 14–23 | Cierre de estructura exterior, montañas de fondo | GALERÍA (pasa por revisión rápida que no haya anotaciones de obra sobre las tomas) |
| 24–28 | Envolvente azul + personal en obra | GALERÍA |
| 29–41 | Interiores en progreso: drywall, baños, escalera | GALERÍA |
| 42–45 | Edificio terminado: fachada gris, luego azul | GALERÍA |
| 46–47 | Interiores terminados: ambiente con personal, baño | GALERÍA |
| 48 | Edificio azul completo, horizontal | GALERÍA |
| **49** | **Edificio azul terminado, montaña y cielo, horizontal** | **PORTADA** ✅ (alternativa: #44) |
| 50–57 | Interiores terminados: baños, habitaciones, pasillos | GALERÍA |
| 58 | Vista final del edificio (vertical) | GALERÍA |

→ Portada: **#49** · Alternativa: **#44** · Galería final: 58 (o ~40 recortada).

> Nota honesta: la curaduría la hice sobre miniaturas; antes de subir, mira las 3 marcadas REVISAR
> y confirma que ninguna portada tenga detalles que no quieras mostrar (patentes, caras, anotaciones).

---

## 5. Estrategia Cloudinary

### 5.1 Estructura de carpetas y `public_id`

El código actual sube todo a carpetas planas (`constr-art/proyectos/portadas`, `.../galeria`) con
nombres autogenerados. Con 100 fotos de WhatsApp eso produce basura ilegible tipo
`WhatsApp_Image_2026-11-08_at_8.41.24_PM_(1)_xyz123`. Propuesta (a partir de ahora, sin migrar lo
viejo):

```
constr-art/proyectos/
├── campamento-corporativo-pan-silver/
│   ├── portada/campamento-corporativo-pan-silver-portada.jpg
│   └── galeria/campamento-corporativo-pan-silver-g-01.jpg … -g-58.jpg
├── remodelacion-residencia-diego/
│   ├── portada/remodelacion-residencia-diego-portada.jpg
│   └── galeria/remodelacion-residencia-diego-g-01.jpg … -g-25.jpg
└── plaza-isabela-catolica-asfi/
    ├── portada/plaza-isabela-catolica-asfi-portada.jpg
    └── galeria/plaza-isabela-catolica-asfi-g-01.jpg … -g-13.jpg
```

Beneficios: identificas cualquier foto al verla en el dashboard de Cloudinary; el `public_id`
determinista permite re-subir una foto concreta sin duplicar; y el orden de la galería queda
escrito en el propio nombre (`-g-01` … `-g-58`).

### 5.2 Transformaciones: la clave del rendimiento sin esfuerzo

No guardes versiones distintas de cada foto: deja que Cloudinary entregue la variante correcta por
rol insertando transformaciones en la URL (se cachean en su CDN la primera vez):

| Rol | Transformación | Peso esperado |
|---|---|---|
| Tarjeta del listado | `f_auto,q_auto:good,w_1200,c_fill,g_auto,ar_4:3` | ~80–150 KB |
| Tile de galería | `f_auto,q_auto:good,w_900,c_fill,g_auto,ar_4:3` | ~60–120 KB |
| Hero del detalle | `f_auto,q_auto:good,w_1600,c_fill,g_auto,ar_16:9` | ~150–250 KB |
| Lightbox (al hacer clic) | `f_auto,q_auto:good,w_1600` (sin recorte) | ~200–350 KB |
| Miniatura de blur (opcional) | `q_auto:eco,w_16` | ~1 KB |

- `f_auto` → WebP/AVIF según el navegador (30–50 % menos que JPEG).
- `c_fill,g_auto` → recorte inteligente al 4:3 (tus fotos son 4:3 y verticales 3:4; `g_auto` elige
  el foco, no corta cabezas ni cerchas).
- `w_900`/`w_1200` → nunca sirves 1600 px donde se pintan 400 px.

Plan gratuito de Cloudinary: 100 fotos ≈ **19 MB** de storage — irrelevante frente a los 25 GB del
plan free. El consumo real será bandwidth de visitas, cubierto por el CDN y las transformaciones
cacheadas.

### 5.3 Helper único de URLs (nuevo archivo, 1 función)

```ts
// src/lib/cloudinary-img.ts
type Opts = { w?: number; ar?: string };

/**
 * Inserta transformaciones en una secure_url de Cloudinary.
 * Si la URL no es de Cloudinary (p. ej. portadas locales /img/... del seed), la devuelve igual.
 */
export function cloudSrc(secureUrl: string, opts: Opts = {}): string {
  const t = ["f_auto", "q_auto:good"];
  if (opts.w) t.push(`w_${opts.w}`);
  if (opts.ar) t.push(`ar_${opts.ar}`, "c_fill", "g_auto");
  else t.push("c_limit");
  const [base, rest] = secureUrl.split("/image/upload/");
  return rest ? `${base}/image/upload/${t.join(",")}/${rest}` : secureUrl;
}
```

---

## 6. Ruta A — Formulario admin

**Cuándo funciona:** para crear el registro con **galerías pequeñas (≤ ~10 fotos)** o para
ediciones puntuales futuras. Es el flujo que ya tienes, con cero código nuevo.

**Cuándo NO funciona (y por qué):** tus límites reales de deploy (`docs/deploy-constraints.md`) son
Vercel Hobby: server actions con body de ~1 MB (no hay `bodySizeLimit` configurado) y hard-cap de
~4.5 MB por request, con funciones de 10 s. Tus fotos pesan ~150–220 KB cada una:

| Proyecto | Fotos | Peso total | ¿Pasa por el formulario? |
|---|---|---|---|
| Plaza ASFI | 15 | 2.5 MB | ❌ falla ya (supera 1 MB) |
| Residencia Diego | 27 | 3.9 MB | ❌ |
| Pan Silver | 58 | 12.9 MB | ❌❌ ni con `bodySizeLimit` subido (pasaría de 4.5 MB) y 58 subidas secuenciales no caben en 10 s |

Si aun así quieres usarla para galerías pequeñas:

1. Subir `bodySizeLimit` en `next.config.ts`:

```ts
// next.config.ts (solo si vas a usar la Ruta A)
const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }] },
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  // ...headers() igual que hoy
};
```

2. Pasos por proyecto: `/admin/proyectos` → completar slug/título/tipo/ubicación → elegir portada
   → **seleccionar las fotos de la galería en orden** (el orden de selección = orden de `galeriaUrls`)
   → dejar el input de video vacío → *Crear proyecto* → en el listado, activar *Publicado* y si
   corresponde *Destacado*.
3. Limitación importante: `updateProyecto` **reemplaza** la galería completa cuando subes fotos
   nuevas (no agrega). Para añadir fotos después sin tocar las existentes, usa la Ruta B o la
   mejora de §10.

---

## 7. Ruta B — Script por lotes (recomendada)

Corre **en tu máquina local** (sin límites de Vercel), sube directo a Cloudinary con tu
`CLOUDINARY_URL` y luego actualiza la BD con Prisma. Tres pasos por proyecto, ~20 min cada uno.

### Paso 0 — Preparar carpetas

```
fotos/
├── plaza-isabela-catolica-asfi/     ← contenido del zip 1 (las 15)
├── remodelacion-residencia-diego/   ← zip 2 (las 27)
└── campamento-corporativo-pan-silver/ ← zip 3 (las 58)
```

> Orden de archivos: los nombres de WhatsApp ordenan alfabéticamente casi idéntico al orden
> cronológico (solo varía si hubo disparos en el mismo segundo). Los scripts de abajo ordenan
> alfabético — **la misma regla que usé para numerar las hojas de contacto de §4**, así `#NN`
> coincide siempre. Si quieres forzar un orden distinto, renombra los archivos a mano antes.

### Paso 1 — Renombrar (conserva el orden, nombres limpios)

```js
// scripts/carga/renombrar.mjs
// Uso: node scripts/carga/renombrar.mjs <carpeta_origen> <carpeta_destino> <slug>
import fs from "node:fs";
import path from "node:path";

const [origen, destino, slug] = process.argv.slice(2);
if (!origen || !destino || !slug) {
  console.error("Uso: node renombrar.mjs <origen> <destino> <slug>");
  process.exit(1);
}
fs.mkdirSync(destino, { recursive: true });
const fotos = fs.readdirSync(origen).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
fotos.forEach((f, i) => {
  const n = String(i + 1).padStart(2, "0");
  fs.copyFileSync(path.join(origen, f), path.join(destino, `${slug}-g-${n}.jpg`));
});
console.log(`✅ ${fotos.length} fotos renombradas (orden alfabético) en ${destino}`);
```

### Paso 2 — Subir a Cloudinary (portada + galería) y guardar manifiesto

```js
// scripts/carga/subir-proyecto.mjs
// Uso: node scripts/carga/subir-proyecto.mjs <slug> <carpeta_fotos_renombradas> [ruta_portada.jpg]
// Requiere CLOUDINARY_URL en el entorno (misma variable que usa la app).
import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs";
import path from "node:path";

const [slug, carpeta, portada] = process.argv.slice(2);
if (!slug || !carpeta) {
  console.error("Uso: node subir-proyecto.mjs <slug> <carpeta> [portada.jpg]");
  process.exit(1);
}
cloudinary.config({ secure: true });

const manifiesto = { slug, portadaUrl: null, portadaPublicId: null, urls: [], publicIds: [] };

if (portada) {
  const r = await cloudinary.uploader.upload(portada, {
    folder: `constr-art/proyectos/${slug}/portada`,
    public_id: `${slug}-portada`,
    overwrite: false,
  });
  manifiesto.portadaUrl = r.secure_url;
  manifiesto.portadaPublicId = r.public_id;
  console.log(`  ✓ portada → ${r.public_id}`);
}

const fotos = fs.readdirSync(carpeta).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
for (const f of fotos) {
  const num = path.basename(f).match(/g-(\d+)\./)?.[1] ?? String(manifiesto.urls.length + 1);
  const r = await cloudinary.uploader.upload(path.join(carpeta, f), {
    folder: `constr-art/proyectos/${slug}/galeria`,
    public_id: `${slug}-g-${num}`,
    overwrite: false, // no pisa nada existente
  });
  manifiesto.urls.push(r.secure_url);
  manifiesto.publicIds.push(r.public_id);
  console.log(`  ✓ ${f} → ${r.public_id} (${(r.bytes / 1024).toFixed(0)} KB)`);
}

const out = `scripts/carga/manifest-${slug}.json`;
fs.writeFileSync(out, JSON.stringify(manifiesto, null, 2));
console.log(`✅ Listo: ${manifiesto.urls.length} fotos + ${manifiesto.portadaUrl ? "portada" : "sin portada"}. Manifiesto: ${out}`);
```

### Paso 3 — Aplicar el manifiesto a la BD

```ts
// scripts/carga/set-galeria.ts
// Uso: npx tsx --env-file=.env scripts/carga/set-galeria.ts <slug> scripts/carga/manifest-<slug>.json
// (si --env-file no está disponible: npm i -D dotenv  y agrega  import "dotenv/config";  arriba)
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

async function main() {
  const [slug, manifiestoPath] = process.argv.slice(2);
  if (!slug || !manifiestoPath) throw new Error("Uso: tsx set-galeria.ts <slug> <manifest.json>");
  const { portadaUrl, portadaPublicId, urls, publicIds } = JSON.parse(fs.readFileSync(manifiestoPath, "utf8"));

  const prisma = new PrismaClient();
  const existe = await prisma.proyectoPortafolio.findUnique({ where: { slug } });
  if (!existe) {
    // El registro aún no existe: se crea solo con media (los textos los completas luego en el admin)
    await prisma.proyectoPortafolio.create({
      data: {
        slug,
        titulo: slug, // placeholder editable desde el admin
        ubicacion: null,
        portadaUrl, portadaPublicId,
        galeriaUrls: urls, galeriaPublicIds: publicIds,
        videoUrl: null, videoPublicId: null,
        publicado: false,
      },
    });
    console.log(`✅ Creado ${slug} con ${urls.length} fotos`);
  } else {
    await prisma.proyectoPortafolio.update({
      where: { slug },
      data: {
        portadaUrl: portadaUrl ?? existe.portadaUrl,
        portadaPublicId: portadaPublicId ?? existe.portadaPublicId,
        galeriaUrls: urls,
        galeriaPublicIds: publicIds,
      },
    });
    console.log(`✅ Actualizado ${slug} con ${urls.length} fotos`);
  }
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
```

### Ejecución completa (los 3 proyectos)

```bash
# 1) Plaza  (la portada recomendada #14 queda como ...-g-14.jpg tras renombrar)
node scripts/carga/renombrar.mjs fotos/plaza-isabela-catolica-asfi/curadas fotos/tmp plaza-isabela-catolica-asfi
node scripts/carga/subir-proyecto.mjs plaza-isabela-catolica-asfi fotos/tmp fotos/tmp/plaza-isabela-catolica-asfi-g-14.jpg
npx tsx --env-file=.env scripts/carga/set-galeria.ts plaza-isabela-catolica-asfi scripts/carga/manifest-plaza-isabela-catolica-asfi.json

# 2) Diego … 3) Pan Silver (mismos 3 comandos cambiando slug/carpeta)
```

> Detalle de la portada con el script: como la numeración es alfabética, la foto #14 de §4.1 será
> `plaza-isabela-catolica-asfi-g-14.jpg` en la carpeta renombrada — pásala como argumento de portada
> y, si no quieres verla repetida como primera foto de la galería, sáltala del directorio de galería
> (o déjala, es inofensiva). Con Diego usa `...-g-22.jpg` y con Pan Silver `...-g-49.jpg`.

---

## 8. UI propuesta

Diseño acorde a lo que ya tienes: tema oscuro, acento ámbar `#FFB300`, headings Archivo, radios
pequeños, estética industrial. **Cero librerías nuevas**: la galería y el lightbox son un solo
componente cliente (~3 KB gz), el resto sigue siendo server components.

### 8.1 Wireframe — Listado `/proyectos`

```
┌────────────────────────────────────────────────────────────────────┐
│  PORTAFOLIO                                                        │
│  Nuestros proyectos                                                │
│  Cada proyecto cuenta una historia…                                │
│                                                                    │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐         │
│  │  PORTADA 4:3  │   │  PORTADA 4:3  │   │  PORTADA 4:3  │         │
│  │   (hover:     │   │               │   │               │         │
│  │  zoom suave + │   │               │   │               │         │
│  │  pill "Ver    │   │               │   │               │         │
│  │  proyecto →") │   │               │   │               │         │
│  │▓▓▓gradiente▓▓▓│   │▓▓▓gradiente▓▓▓│   │▓▓▓gradiente▓▓▓│         │
│  │ STEEL FRAME   │   │ INTEGRAL      │   │ INTEGRAL      │         │
│  │ Campamento    │   │ Remodelación  │   │ Remodelación  │         │
│  │ Pan Silver    │   │ Res. Diego    │   │ Plaza I. C.   │         │
│  │ — m² · — días │   │ — m² · — días │   │ — m² · — días │         │
│  └───────────────┘   └───────────────┘   └───────────────┘         │
│   (los "—" desaparecen solos cuando completes m²/días)             │
└────────────────────────────────────────────────────────────────────┘
```

Cambios respecto a hoy: imagen pre-recortada a 4:3 vía `cloudSrc` (menos bytes), `priority`
solo en las tarjetas visibles, `sizes` afinado, zoom + pill en hover (CSS puro, `motion-safe`).

### 8.2 Wireframe — Detalle `/proyectos/[slug]`

```
┌──────────────────────────────────────────────────────┐
│  ← PROYECTOS                                         │
│  SOLUCIÓN INTEGRAL                     [DESTACADO]   │
│  Remodelación Residencia Diego                       │
│  UBICACIÓN …    SUPERFICIE — m²    PLAZO — días      │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │            HERO PORTADA 16:9  (priority)         ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  VIDEO DE OBRA                                       │
│  ┌──────────────────────────────────────────────────┐│
│  │        ▶   borde punteado (estado vacío)         ││
│  │        Recorrido en video — próximamente         ││
│  │   Cuando subas el video, este bloque se          ││
│  │   convierte solo en el reproductor               ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  GALERÍA (25 FOTOS)                                  │
│  ┌────────┐ ┌────────┐ ┌────────┐                    │
│  │ 4:3    │ │ 4:3    │ │ 4:3    │   click → lightbox │
│  └────────┘ └────────┘ └────────┘  ┌──────────────┐  │
│  ┌────────┐ ┌────────┐ ┌────────┐  │ ▶ foto full  │  │
│  │        │ │        │ │        │  │ ‹   12/25  ✕ │  │
│  └────────┘ └────────┘ └────────┘  └──────────────┘  │
│  … lazy: solo carga lo visible                       │
│                                                      │
│              [ Solicite su presupuesto ]             │
└──────────────────────────────────────────────────────┘
```

### 8.3 Componente: espacio vacío del video (server, 0 JS)

```tsx
// src/components/proyecto/VideoSlot.tsx  (solo el bloque punteado, sin el rótulo)
export function VideoSlot() {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3
                    rounded-xl border border-dashed border-border bg-surface/40 text-center">
      <span aria-hidden="true"
            className="grid h-12 w-12 place-items-center rounded-full border border-border text-ink-faint">
        ▶
      </span>
      <p className="text-sm font-medium text-ink-muted">Recorrido en video — próximamente</p>
      <p className="max-w-sm text-xs text-ink-faint">
        Estamos preparando el video de esta obra. Mientras tanto, explore la galería de fotos.
      </p>
    </div>
  );
}
```

Cableado en `[slug]/page.tsx` (reemplaza el bloque actual `{proyecto.videoUrl && …}`):

```tsx
<div className="mt-12">
  <p className="section-label mb-2 text-ink-faint">VIDEO DE OBRA</p>
  {proyecto.videoUrl ? (
    proyecto.videoUrl.includes("res.cloudinary.com") ? (
      <CloudinaryVideoPlayer videoUrl={proyecto.videoUrl} portadaUrl={proyecto.portadaUrl} titulo={proyecto.titulo} />
    ) : (
      <TikTokPlayer videoUrl={proyecto.videoUrl} portadaUrl={proyecto.portadaUrl} titulo={proyecto.titulo} />
    )
  ) : (
    <VideoSlot />
  )}
</div>
```

> Cuando subas el video (Cloudinary → `videoUrl`/`videoPublicId`), el bloque punteado desaparece y
> aparece tu reproductor click-to-play existente. **No hay que tocar la UI de nuevo.**

### 8.4 Componente: galería con lightbox (única pieza cliente, sin dependencias)

Grid uniforme 4:3 con recorte inteligente de Cloudinary (cero layout shift, no hace falta guardar
dimensiones en la BD), lightbox con `<dialog>` nativo (Esc y focus gratis):

```tsx
"use client";
// src/components/proyecto/GaleriaProyecto.tsx
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cloudSrc } from "@/lib/cloudinary-img";

export function GaleriaProyecto({ urls, titulo }: { urls: string[]; titulo: string }) {
  const [abierta, setAbierta] = useState<number | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (abierta !== null) dlg.current?.showModal();
  }, [abierta]);

  if (urls.length === 0) return null;

  const mover = (delta: number) =>
    setAbierta((a) => (a === null ? a : (a + delta + urls.length) % urls.length));

  return (
    <section className="mt-12">
      <p className="section-label mb-2 text-ink-faint">
        GALERÍA <span className="ml-1 text-ink-faint/60">({urls.length} FOTOS)</span>
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {urls.map((url, i) => (
          <button
            key={url}
            onClick={() => setAbierta(i)}
            aria-label={`Abrir foto ${i + 1} de ${titulo}`}
            className="group relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded bg-surface"
          >
            <Image
              src={cloudSrc(url, { w: 900, ar: "4:3" })}
              alt={`${titulo} — foto ${i + 1} de ${urls.length}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 384px"
              loading={i < 6 ? "eager" : "lazy"}
              className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.04]"
            />
          </button>
        ))}
      </div>

      <dialog
        ref={dlg}
        onClose={() => setAbierta(null)}
        onClick={(e) => { if (e.target === dlg.current) dlg.current?.close(); }}
        className="fixed inset-0 m-auto max-h-[92vh] max-w-[92vw] bg-transparent p-0 backdrop:bg-black/90"
      >
        {abierta !== null && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cloudSrc(urls[abierta], { w: 1600 })}
              alt={`${titulo} — foto ${abierta + 1}`}
              className="max-h-[85vh] max-w-[92vw] rounded object-contain"
            />
            <button onClick={() => mover(-1)} aria-label="Foto anterior"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-white">‹</button>
            <button onClick={() => mover(1)} aria-label="Foto siguiente"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-white">›</button>
            <button onClick={() => dlg.current?.close()} aria-label="Cerrar"
                    className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1 text-white">✕</button>
            <p className="mt-2 text-center text-xs text-white/70">{abierta + 1} / {urls.length}</p>
          </div>
        )}
      </dialog>
    </section>
  );
}
```

Y en `[slug]/page.tsx`, después de los datos / antes del CTA:

```tsx
<GaleriaProyecto urls={proyecto.galeriaUrls} titulo={proyecto.titulo} />
```

> Limitación honesta del lightbox nativo: sin gestos de swipe en móvil (navegar con las flechas).
> Si algún día quieres swipe/pinch, la opción es `yet-another-react-lightbox` (~7 KB gz) — hasta
> entonces, esto cumple con 0 dependencias.

### 8.5 Hero de portada en el detalle (hoy no existe)

```tsx
{proyecto.portadaUrl && (
  <figure className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl border border-border">
    <Image
      src={cloudSrc(proyecto.portadaUrl, { w: 1600, ar: "16:9" })}
      alt={proyecto.titulo}
      fill
      priority                     // es el LCP de la página
      sizes="(max-width: 896px) 100vw, 896px"
      className="object-cover"
    />
  </figure>
)}
```

### 8.6 Ajustes finos de la tarjeta del listado (CSS puro)

```tsx
{/* dentro del <Link> existente de /proyectos/page.tsx y ProyectosSection.tsx */}
<Image
  src={cloudSrc(proyecto.portadaUrl ?? "", { w: 1200, ar: "4:3" })}
  alt={proyecto.titulo}
  fill
  priority={i < 3}              // solo las tarjetas visibles
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
  className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
/>
{/* pill de hover, junto al título */}
<span className="mt-2 inline-flex items-center gap-1 text-xs text-accent opacity-0
                 transition-opacity duration-300 group-hover:opacity-100">
  Ver proyecto →
</span>
```

### 8.7 Tabla de decisiones de rendimiento (por qué esto NO afecta la velocidad)

| Decisión | Efecto | Coste |
|---|---|---|
| `f_auto,q_auto` en todas las URLs | WebP/AVIF + calidad adaptativa por CDN de Cloudinary | 0 JS |
| Pre-recorte por rol (`ar_4:3`, `w_900/1200`) | nunca se sirve más píxel del que se pinta | 0 JS |
| `fill` + wrapper `aspect-[4/3]` | **CLS = 0** aunque la imagen tarde | 0 JS |
| `loading="lazy"` desde la foto 7; `priority` solo en hero/primeras tarjetas | LCP rápido, no se descargan 58 fotos de golpe | 0 JS |
| Lightbox con `<dialog>` nativo + `<img>` solo al abrir | 0 bytes hasta que el usuario hace clic | ~1 KB JSX |
| Un solo componente cliente (galería); resto server components | hidratación mínima (~3 KB gz) | — |
| Sin librerías nuevas (ni gallery, ni lightbox, ni slider) | bundle igual al de hoy | — |
| `motion-safe:` en todos los hovers | respeta `prefers-reduced-motion` | CSS |
| Blur real solo si quieres (hero): miniatura `w_16` como `blurDataURL` | opcional; el shimmer CSS de los tiles ya evita el "salto" | 1 fetch server-side |

Opcional para el hero (blur "de lujo", solo si te conviene el fetch extra):

```ts
// en el server component del detalle
const blur = await fetch(cloudSrc(portadaUrl, { w: 16 }))
  .then((r) => r.arrayBuffer())
  .then((b) => `data:image/jpeg;base64,${Buffer.from(b).toString("base64")}`);
// <Image ... blurDataURL={blur} placeholder="blur" />
```

---

## 9. Correcciones detectadas en el código

Tres detalles reales que conviene arreglar **antes** de publicar (todos pequeños):

### 9.1 El listado ignora el campo `orden`

`/proyectos/page.tsx` y `ProyectosSection.tsx` ordenan por `creadoEn desc` (el índice
`@@index([publicado, orden])` del schema está sin usar). Cambiar en ambos:

```ts
orderBy: [{ orden: "asc" }, { creadoEn: "desc" }],
```

### 9.2 El detalle muestra proyectos no publicados

`getProyecto(slug)` usa `findUnique({ where: { slug } })` sin filtrar `publicado`: cualquier slug
no publicado es visible si se conoce la URL. Cambiar a:

```ts
const proyecto = await prisma.proyectoPortafolio.findFirst({
  where: { slug, publicado: true },
  select: { /* igual que hoy */ },
});
```

(`generateMetadata` usa la misma función, así que también queda protegido.)

### 9.3 (Recomendado) Campo `descripcion` + ocultar proyectos demo del seed

- **`descripcion String? @map("descripcion")`** en `ProyectoPortafolio`: hoy no hay dónde contar el
  alcance ("retiro de cielo falso Armstrong y reposición en PVC", "obra del pasado año"). Con este
  campo, el detalle gana un párrafo y `generateMetadata` una descripción real (SEO). Migración:
  `npx prisma migrate dev --name proyecto_add_descripcion` (y recordar: a producción se aplica a
  mano según `docs/deploy-constraints.md`).
- **Proyectos demo:** el seed insertó 6 proyectos con `publicado: true` que hoy aparecen en tu
  portafolio público. Ocultarlos (no borrarlos, para conservar la demo local):

```ts
// scripts/carga/ocultar-demo.ts → npx tsx --env-file=.env scripts/carga/ocultar-demo.ts
import { PrismaClient } from "@prisma/client";
async function main() {
  const prisma = new PrismaClient();
  const demo = ["casa-steel-frame-santa-cruz", "ampliacion-zona-sur-la-paz",
    "local-comercial-santa-cruz", "quinta-rehabilitacion", "oficinas-empresariales",
    "casa-ecologica-cochabamba"];
  const r = await prisma.proyectoPortafolio.updateMany({
    where: { slug: { in: demo } }, data: { publicado: false },
  });
  console.log(`Demo ocultada: ${r.count} proyectos`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
```

---

## 10. Mejora opcional: editar proyecto y reordenar galería

Hoy `updateProyecto` existe pero **ninguna UI lo llama**, y reordenar la galería requiere tocar la
BD. Si quieres cerrar el ciclo completo desde el admin (útil para completar m²/días/ubicación y
subir el video después):

1. Página de edición `/admin/(panel)/proyectos/[id]/page.tsx` que reutiliza el layout del
   `ProyectoForm` con los campos precargados y llama a `updateProyecto(id, formData)`.
2. Componente `GaleriaEditor` (cliente): miniaturas con botones **↑ ↓ ✕** que mutan localmente los
   arreglos `galeriaUrls`/`galeriaPublicIds` y los envían en un nuevo server action
   `actualizarGaleria(id, urls, ids)` (solo `prisma.update` — los archivos ya están en Cloudinary).
3. Input de video opcional: `CloudinaryVideoPlayer` ya está listo; con la edición podrás subir el
   video cuando exista sin tocar código.

Estimación: 2–3 h. Puede ir después de publicar los 3 proyectos; no bloquea nada.

---

## 11. Plan de trabajo por fases + checklist QA

### Fases

| Fase | Qué | Tiempo |
|---|---|---|
| **0 — Preparación** | Confirmar títulos/slugs/tipo (§3, §12) · ocultar demo del seed (§9.3) · fixes `orden` y `publicado` (§9.1–9.2) · (opcional) migración `descripcion` | 30–45 min |
| **1 — Carga** | Curar localmente según §4 (mover las DESCARTAR/REVISAR a una subcarpeta) → `renombrar.mjs` → `subir-proyecto.mjs` → `set-galeria.ts`, por cada proyecto | 1–1.5 h |
| **2 — UI** | `cloudSrc` → `GaleriaProyecto` + lightbox → hero de portada → estado vacío del video → ajustes de tarjeta (priority/sizes/hover) | 3–4 h |
| **3 — QA + publicación** | Checklist de abajo → toggle *Publicado* (y *Destacado* en Pan Silver y Diego) | 45 min |

Total estimado: **6–8 horas** repartibles en 2–3 sesiones.

### Checklist QA (antes del toggle "Publicado")

- [ ] `/proyectos` muestra exactamente tus 3 proyectos reales, en el orden 1-2-3, sin demos
- [ ] Tarjetas: portada nítida en 4:3, hover con zoom y pill, badge de tipo correcto
  (Pan Silver = STEEL FRAME; los otros = SOLUCIÓN INTEGRAL)
- [ ] Cada detalle abre con: hero de portada, datos (los pendientes muestran "—" sin romper nada)
- [ ] Bloque "VIDEO DE OBRA" visible con el estado punteado en los 3 proyectos
- [ ] Galería completa y **en orden** (contar: 13 / ~25 / 58 según tu curaduría final de §4); miniaturas nítidas y cuadradas
- [ ] Lightbox: abre, ‹ › navegan en bucle, Esc y clic fuera cierran, contador correcto
- [ ] DevTools → Network: imágenes en `webp`/`avif`, tiles < ~150 KB, las fotos 7+ solo cargan al
      hacer scroll (lazy)
- [ ] Lighthouse móvil en `/proyectos` y un detalle: LCP < 2.5 s, CLS ≈ 0
- [ ] Slug inexistente → 404; proyecto no publicado → 404 (tras el fix §9.2)
- [ ] Home: sección "Obras destacadas" muestra Pan Silver y Diego
- [ ] Compartir el link de un detalle en WhatsApp: la tarjeta de preview muestra su portada
      (si hiciste el cambio OG de §8.5 o mantienes `/og`, verificar visualmente)

---

## 12. Supuestos y pendientes de confirmación

Cosas que **no inventé** y quedan marcadas como pendientes o interpretación:

| Tema | Estado |
|---|---|
| `m2Construidos` y `diasEjecucion` de los 3 proyectos | `null` — completar cuando los tengas (admin o §10) |
| `ubicacion` exacta (ciudad/zona de Plaza ASFI y de Pan Silver) | `null` — "Zona cercana al aeropuerto" se propone literal para Diego, decide si la muestras sin ciudad |
| "vetillas" (Pan Silver) | Interpretado como viguetas/cerchas del techo según las fotos #06–#13; confirmar |
| Título "Campamento Corporativo Pan Silver" | Tomado de tu texto; si el cliente prefiere otra denominación pública, ajustar |
| `tipoConstruccion` de las 2 remodelaciones | Propuesto `integral` por la etiqueta que muestra la UI; tu decisión final |
| Marca/anotación verde en algunas fotos (Plaza #06, posibles en Pan Silver) | Marcadas DESCARTAR/REVISAR — revisar en grande antes de subir |
| Descripciones por proyecto | Pendientes de la migración `descripcion` (§9.3); el alcance que me diste (Armstrong→PVC, obra del año pasado) ya sirve de base |
| Video | Sin video hoy; la UI reserva el espacio y el reproductor existente se activará solo al subir el archivo |

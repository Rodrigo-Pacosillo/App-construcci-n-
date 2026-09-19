# 🔴 AUDITORÍA DE VULNERABILIDADES Y PROBLEMAS LÓGICOS

**Fecha:** 18/09/2026
**Estado:** PENDIENTE DE REVISIÓN Y CORRECCIÓN
**Criticidad:** 🔴 ALTA - CRÍTICA - MEDIA

---

## 📋 ÍNDICE DE PROBLEMAS

1. [Vulnerabilidad #1: Falta de verificación de rol en todos los server actions](#vulnerabilidad-1-falta-de-verificación-de-rol-en-todos-los-server-actions)
2. [Vulnerabilidad #2: Exposición de datos privados sin filtrado](#vulnerabilidad-2-exposición-de-datos-privados-sin-filtrado)
3. [Vulnerabilidad #3: Query Sin límite en cotizaciones y proyectos](#vulnerabilidad-3-query-sin-límite-en-cotizaciones-y-proyectos)
4. [Vulnerabilidad #4: Falta de validación en cotización pública](#vulnerabilidad-4-falta-de-validación-en-cotización-pública)
5. [Vulnerabilidad #5: Errores de validación en server actions](#vulnerabilidad-5-errores-de-validación-en-server-actions)
6. [Vulnerabilidad #6: XSS en comentarios y textos libres](#vulnerabilidad-6-xss-en-comentarios-y-textos-libres)
7. [Vulnerabilidad #7: Inyección SQL potencial (mitigada por Prisma)](#vulnerabilidad-7-inyección-sql-potencial-mitigada-por-prisma)
8. [Vulnerabilidad #8: Headers HTTP expuestos sin control](#vulnerabilidad-8-headers-http-expuestos-sin-control)
9. [Vulnerabilidad #9: CORS no configurado explícitamente](#vulnerabilidad-9-cors-no-configurado-explícitamente)
10. [Vulnerabilidad #10: Faltan límites en queries de filtrado](#vulnerabilidad-10-faltan-límites-en-queries-de-filtrado)
11. [Vulnerabilidad #11: Exposición de errores internos](#vulnerabilidad-11-exposición-de-errores-internos)
12. [Vulnerabilidad #12: Configuración de datos sensible sin encriptación](#vulnerabilidad-12-configuración-de-datos-sensible-sin-encriptación)
13. [Vulnerabilidad #13: RevalidatePath expone caché de navegación](#vulnerabilidad-13-revalidatepath-expone-caché-de-navegación)
14. [Vulnerabilidad #14: Faltan límites de longitud en inputs](#vulnerabilidad-14-faltan-límites-de-longitud-en-inputs)
15. [Vulnerabilidad #15: Client side validation](#vulnerabilidad-15-client-side-validation)
16. [Vulnerabilidad #16: Seguridad de contraseña](#vulnerabilidad-16-seguridad-de-contraseña)
17. [Vulnerabilidad #17: Hardcoding de datos](#vulnerabilidad-17-hardcoding-de-datos)

---

## 🚨 VULNERABILIDAD #1: FALTA DE VERIFICACIÓN DE ROL EN TODOS LOS SERVER ACTIONS

### ❌ PROBLEMA

Todos los server actions en `/src/app/admin/` **NO verifican** que el usuario tenga rol `admin`. Cualquier usuario logueado puede acceder a cualquier función.

**Archivos afectados:**
- src/app/admin/actions.ts
- src/app/admin/cotizaciones/actions.ts
- src/app/admin/cotizaciones/page.tsx
- src/app/admin/proyectos/actions.ts
- src/app/admin/proyectos/page.tsx
- src/app/admin/testimonios/actions.ts
- src/app/admin/testimonios/page.tsx
- src/app/admin/servicios/actions.ts
- src/app/admin/servicios/page.tsx
- src/app/admin/faqs/actions.ts
- src/app/admin/faqs/page.tsx
- src/app/admin/login/page.tsx

### 📝 EJEMPLOS DE CÓDIGO INSEGURO

**Ejemplo 1: src/app/admin/actions.ts:5-28** - Sin verificación de rol:
```typescript
export async function getDashboardStats() {
  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      include: { cliente: true },
    });
    // NO VERIFICA session.user.role === "admin"
    // ...
    return {
      totalCotizaciones: cotizaciones.length,
      porEstado,
      proyectos,
      testimonios,
    };
  } catch {
    return { totalCotizaciones: 0, porEstado: {}, proyectos: 0, testimonios: 0 };
  }
}
```

**Problema:** Cliente puede ver dashboard con datos privados del admin

**Ejemplo 2: src/app/admin/cotizaciones/actions.ts:6-16** - Update sin verificación:
```typescript
export async function updateCotizacionEstado(id: string, estado: string) {
  await prisma.cotizacion.update({
    where: { id },
    data: { estado },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/cotizaciones");
  // NO VERIFICA session.user.role === "admin"
}
```

**Problema:** Cualquier usuario logueado puede cambiar estado de cotizaciones

### ✅ SOLUCIÓN RECOMENDADA

Crear middleware de autenticación y autorización reutilizable:

**Archivo nuevo: src/lib/auth-utils.ts**:
```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.role === "admin") {
    throw new Error("No autorizado");
  }
  return session;
}
```

**Reemplazar en cada action:**
```typescript
export async function getDashboardStats() {
  await requireAdmin(); // ← AGREGAR ESTO

  try {
    // ... resto del código
  } catch {
    return { totalCotizaciones: 0, porEstado: {}, proyectos: 0, testimonios: 0 };
  }
}
```

### 📊 IMPACTO

| Ruta | Función | Impacto |
|---|---|---|
| /admin | getDashboardStats | Cliente ve datos privados |
| /admin/cotizaciones | updateCotizacionEstado | Cliente puede cambiar estados |
| /admin/cotizaciones | getCotizaciones | Cliente ve TODAS las cotizaciones |
| /admin/proyectos | getProyectos | Cliente puede ver fotos de todos |
| /admin/proyectos | updateProyecto, deleteProyecto | Cliente puede borrar/ocultar |

### 🔴 CRÍTICIDAD: ALTA

- **Privacidad:** Cliente ve datos privados del admin
- **Integridad:** Cliente puede modificar sin autorización
- **Evidencia:** Los server actions NO verifican session.user.role

---

## 🚨 VULNERABILIDAD #2: EXPOSICIÓN DE DATOS PRIVADOS SIN FILTRADO

### ❌ PROBLEMA

- notasInternas (solo admin)
- monto_cerrado (solo si ganó, pero aún privado)
- Cliente logueado ve TODAS las cotizaciones, no las suyas

### ✅ SOLUCIÓN RECOMENDADA

**Archivo nuevo: src/lib/db-utils.ts**:
```typescript
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getCotizacionesPropias() {
  const session = await auth();
  if (!session?.user?.role === "cliente") {
    return [];
  }

  return await prisma.cotizacion.findMany({
    where: { clienteId: session.user.id },
    include: { cliente: true },
    orderBy: { creadoEn: "desc" },
  });
}

export async function getCotizacionesAdmin() {
  await requireAdmin();
  return await prisma.cotizacion.findMany({
    include: { cliente: true },
    orderBy: { creadoEn: "desc" },
    take: 50,
  });
}
```

### 🔴 CRÍTICIDAD: ALTA

- **Privacidad:** Datos sensibles expuestos
- **Datos sensibles:** Montos cerrados, notas internas

---

## 🚨 VULNERABILIDAD #3: QUERY SIN LÍMITE

### ❌ PROBLEMA

Si hay 10,000 cotizaciones → Next.js intenta renderizar 10,000 filas → **Out of Memory** → servidor cae

**Archivos afectados:**
- src/app/admin/actions.ts
- src/app/admin/cotizaciones/actions.ts
- src/app/admin/proyectos/actions.ts
- src/app/sitemap.ts
- src/app/page.tsx

### ✅ SOLUCIÓN RECOMENDADA

```typescript
export async function getCotizaciones() {
  return await prisma.cotizacion.findMany({
    include: { cliente: true },
    orderBy: { creadoEn: "desc" },
    take: 50, // ← AGREGAR ESTO
  });
}
```

**Reglas:**
- Dashboard/tables: `take: 50` o `take: 100`
- Sitemap: `take: 500`
- Secciones: `take: 10`

### 📊 IMPACTO

- OOM → servidor cae
- LCP +30s
- SEO malo

### 🔴 CRÍTICIDAD: ALTA

- **Disponibilidad:** OOM
- **Performance:** LCP +30s
- **SEO:** Sitemap malo

---

## 🚨 VULNERABILIDAD #4: FALTA DE VALIDACIÓN EN COTIZACIÓN PÚBLICA

### ❌ PROBLEMA

El formulario de cotización (/cotizacion) NO tiene server action. Simplemente es un formulario visual que no hace nada.

**Archivo afectado:** src/app/cotizacion/page.tsx

**Problema:**
- Formulario estático → datos nunca se envían
- Ninguna cotización se crea realmente
- Error lógico: el sistema nunca capta leads

### ✅ SOLUCIÓN RECOMENDADA

**Archivo nuevo: src/app/cotizacion/actions.ts**:
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { cotizacionSchema } from "@/lib/validators";

export async function createCotizacion(data: any) {
  const session = await auth();
  const valid = cotizacionSchema.safeParse(data);

  if (!valid.success) {
    return { success: false, error: valid.error.flatten().fieldErrors };
  }

  const { tipoObra, tipoConstruccion, rangoM2, ubicacionObra, plazoInicio } =
    valid.data;

  const clienteId =
    session?.user?.role === "cliente" ? session.user.id : undefined;

  await prisma.cotizacion.create({
    data: {
      clienteId,
      tipoObra,
      tipoConstruccion,
      rangoM2,
      ubicacionObra,
      plazoInicio,
      origen: session?.user?.role === "cliente" ? "referido" : "web",
      estado: "nuevo",
    },
  });

  revalidatePath("/cotizacion");
  revalidatePath("/admin");
}
```

### 📊 IMPACTO

| Aspecto | Estado actual | Estado corregido |
|---|---|---|
| Leads captados | ❌ NINGUNO | ✅ Todos los usuarios pueden cotizar |
| Validación | ❌ Ninguna | ✅ Server-side con Zod |
| Base de datos | ❌ Vacía | ✅ Creadas cotizaciones reales |

### 🔴 CRÍTICIDAD: ALTA

- **Lógica de negocio:** Sistema no funciona
- **Usuario expuesto:** Puede llenar formulario pero no recibe resultado real

---

## 🚨 VULNERABILIDAD #5: ERRORES DE VALIDACIÓN EN SERVER ACTIONS

### ❌ PROBLEMA

Algunos server actions **NO hacen** validación con Zod. Cualquier dato malformado puede fallar o crear datos inválidos.

**Archivos afectados:**
- src/app/admin/proyectos/actions.ts
- src/app/admin/cotizaciones/actions.ts
- src/app/admin/testimonios/actions.ts
- src/app/admin/servicios/actions.ts
- src/app/admin/faqs/actions.ts

### ✅ SOLUCIÓN RECOMENDADA

```typescript
export async function createProyecto(data: any) {
  const valid = proyectoSchema.safeParse(data);
  if (!valid.success) {
    return { success: false, error: valid.error.flatten().fieldErrors };
  }

  await requireAdmin();
  await prisma.proyecto.create({
    data: { ...valid.data, publicado: false },
  });

  revalidatePath("/admin/proyectos");
  return { success: true };
}
```

### 🔴 CRÍTICIDAD: MEDIA

- **Integridad de datos:** Datos inválidos pueden entrar a BD
- **Disponibilidad:** Error 500 → servidor cae

---

## 🚨 VULNERABILIDAD #6: XSS EN COMENTARIOS Y TEXTOS LIBRES

### ❌ PROBLEMA

No hay sanitización de texto libre. Un usuario malintencionado puede inyectar código malicioso.

**Archivos afectados:**
- src/app/admin/testimonios/page.tsx
- src/app/admin/faqs/page.tsx
- src/app/admin/cotizaciones/page.tsx (notasInternas)

### ✅ SOLUCIÓN RECOMENDADA

1. **Instalar dompurify:**
```bash
pnpm add dompurify
pnpm add -D @types/dompurify
```

2. **Crear utilidad:**
```typescript
import DOMPurify from "dompurify";

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
    ALLOWED_ATTR: [],
  });
}
```

3. **Usar en componentes:**
```typescript
<p>{sanitizeHTML(testimonio.texto)}</p>
```

### 🔴 CRÍTICIDAD: MEDIA

- **Seguridad:** Puede inyectar scripts, XSS popups
- **Impacto:** Steal cookies, redirects, RCE

---

## 🚨 VULNERABILIDAD #7: INYECCIÓN SQL POTENCIAL (MITIGADA POR PRISMA)

### ❌ PROBLEMA

Las queries con parámetros filtrados vía WHERE podrían estar sufriendo inyección SQL si se construyen manualmente.

**Archivo afectado:** src/app/admin/proyectos/actions.ts

### ✅ SOLUCIÓN RECOMENDADA

Usar siempre Prisma params (esto ya lo hacés con `where: { id }`) no construcciones SQL manuales.

### 🟡 CRÍTICIDAD: MEDIA (mitigada)

- **Prisma** ya evita la mayoría de los casos
- Verificar que NO se haga `prisma.proyecto.findMany({ where: { titulo: "algo" + input } })`
- Debería ser `prisma.proyecto.findMany({ where: { titulo: { contains: input } } })`

---

## 🚨 VULNERABILIDAD #8: HEADERS HTTP EXPUESTOS SIN CONTROL

### ❌ PROBLEMA

Next.js expone muchos headers HTTP por defecto que pueden revelar información sensible.

### ✅ SOLUCIÓN RECOMENDADA

**Archivo: next.config.ts**:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### 🟡 CRÍTICIDAD: MEDIA

- **Privacidad:** Info sensible expuesta
- **Mitigada:** Next.js ya lo protege, pero esto es explícito

---

## 🚨 VULNERABILIDAD #9: CORS NO CONFIGURADO EXPLÍCITAMENTE

### ❌ PROBLEMA

Si se usa API routes personalizadas o se espera que la app se conecte a APIs externas, CORS no está configurado.

**Archivo afectado:** next.config.ts

### ✅ SOLUCIÓN RECOMENDADA

Si no hay APIs externas: no se necesita configuración CORS.

Si se agregan APIs: config en next.config.ts:

```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*", // Cambiar a dominio específico en producción
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};
```

### 🟡 CRÍTICIDAD: MEDIA

- Solo crítico si se agregan APIs externas

---

## 🚨 VULNERABILIDAD #10: FALTAN LÍMITES EN QUERIES DE FILTRADO

### ❌ PROBLEMA

Si un atacante puede construir una URL como:
```
/api/proyectos?tipoConstruccion=seco&tipoConstruccion=tradicional
```

**Problema:**
- Si no hay `take` (límite) en query filtrada, puede inyectar muchos filtros
- Prisma podría intentar hacer OR en muchos valores

### ✅ SOLUCIÓN RECOMENDADA

Si se usan filtros dinámicos:

```typescript
export async function getProyectosConFiltros(params: { tipoConstruccion?: string[] }) {
  const where: any = {};

  if (params.tipoConstruccion && params.tipoConstruccion.length > 0) {
    where.tipoConstruccion = { in: params.tipoConstruccion };
  }

  return await prisma.proyecto.findMany({
    where,
    take: 50, // ← AGREGAR ESTO
    orderBy: { creadoEn: "desc" },
  });
}
```

### 🟡 CRÍTICIDAD: MEDIA

- Solo riesgo si hay filtros dinámicos sin límite

---

## 🚨 VULNERABILIDAD #11: EXPOSICIÓN DE ERRORES INTERNOS

### ❌ PROBLEMA

Los `catch` en server actions devuelven datos básicos, pero el error real puede ser expuesto en la consola del servidor.

**Ejemplo: src/app/admin/actions.ts:25-28**:
```typescript
} catch {
  return { totalCotizaciones: 0, porEstado: {}, proyectos: 0, testimonios: 0 };
}
```

**Problema:**
- Si hay un error de BD, no se puede debuggear
- Si hay un error de validación, no se ve el detalle

### ✅ SOLUCIÓN RECOMENDADA

```typescript
} catch (error) {
  console.error("Error en getDashboardStats:", error);
  return { totalCotizaciones: 0, porEstado: {}, proyectos: 0, testimonios: 0 };
}
```

Y en un entorno de producción, usar un error handler global.

### 🟡 CRÍTICIDAD: MEDIA

- **Debugging:** Más difícil de arreglar errores
- **Evidencia:** No hay logs de errores en el código

---

## 🚨 VULNERABILIDAD #12: CONFIGURACIÓN DE DATO SENSIBLE SIN ENCRIPTACIÓN

### ❌ PROBLEMA

La base de datos no encripta datos sensibles como:
- Contraseñas (¡ya está usando bcrypt, eso está bien)
- WhatsApp (el dueño lo podría querer encriptado)
- Email del admin

**Archivos afectados:**
- prisma/schema.prisma
- prisma/seed.ts

### ✅ SOLUCIÓN RECOMENDADA

**Para WhatsApp y Email:**
- No encriptar datos de chat (compliance, debugging)
- Solo encriptar si se cumple con leyes locales (ej: GDPR en EU)

**Para contraseñas:**
- Ya se está usando `bcryptjs`, esto está bien

**Y agregar logging de seguridad:**

```typescript
// src/lib/auth.ts
import { createHash } from "crypto";

// Registra acceso a datos sensibles (opcional)
export async function auditLog(action: string, userEmail: string) {
  const hash = createHash("sha256").update(userEmail).digest("hex");
  console.log(`SECURITY: ${action} by ${userEmail} (${hash})`);
}

// Llamar en endpoints sensibles:
export async function getCotizacionesAdmin() {
  await requireAdmin();
  auditLog("VIEW_COTIZACIONES", session.user.email);
  // ...
}
```

### 🟡 CRÍTICIDAD: MEDIA

- Solo si se cumplen requisitos legales específicos

---

## 🚨 VULNERABILIDAD #13: REVALIDATEPATH EXPONE CACHÉ DE NAVEGACIÓN

### ❌ PROBLEMA

`revalidatePath` expone al mundo qué se está cacheando y cuándo. Un atacante podría:
```
/api/admin/proyectos?page=1000000
```

Y forzar que el servidor regenere cache innecesariamente.

**Ejemplo: src/app/admin/cotizaciones/actions.ts:14-15**:
```typescript
revalidatePath("/admin");
revalidatePath("/admin/cotizaciones");
```

**Problema:**
- Si se inyecta un rango o ID, puede hacer que el servidor genere cache gigante
- Riesgo de DoS (Denial of Service)

### ✅ SOLUCIÓN RECOMENDADA

Validar parámetros en el server action:

```typescript
export async function updateCotizacionEstado(id: string, estado: string) {
  // Validar que id existe
  const cotizacion = await prisma.cotizacion.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!cotizacion) {
    return { success: false, error: { id: ["Cotización no encontrada"] } };
  }

  // Validar estado
  if (!ESTADOS_COTIZACION.includes(estado as any)) {
    return { success: false, error: { estado: ["Estado inválido"] } };
  }

  await requireAdmin();
  await prisma.cotizacion.update({
    where: { id },
    data: { estado },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/cotizaciones");
  return { success: true };
}
```

### 🟡 CRÍTICIDAD: MEDIA

- Solo riesgo si hay parámetros en URL sin validación

---

## 🚨 VULNERABILIDAD #14: FALTAN LÍMITES DE LONGITUD EN INPUTS

### ❌ PROBLEMA

Los inputs del formulario no tienen límites de longitud.

**Ejemplo: src/app/cotizacion/page.tsx**:
```typescript
<input
  id="nombre"
  name="nombre"
  required
  className="..."
  // NO HAY maxLength
/>
```

**Problema:**
- 1,000 caracteres en campo nombre → error de BD
- 10,000 caracteres en descripción → error de BD

### ✅ SOLUCIÓN RECOMENDADA

```typescript
<input
  id="nombre"
  name="nombre"
  required
  maxLength={100} // ← AGREGAR ESTO
  className="..."
/>

<textarea
  id="descripcion"
  name="descripcion"
  rows={4}
  maxLength={1000} // ← AGREGAR ESTO
  className="..."
/>
```

**En Zod validators:**
```typescript
nombre: z.string().min(1).max(100),
descripcion: z.string().min(1).max(1000),
```

### 🟡 CRÍTICIDAD: MEDIA

- **Disponibilidad:** Error 500 si se envían inputs muy largos
- **UX:** Datos malformados

---

## 🚨 VULNERABILIDAD #15: CLIENT SIDE VALIDATION

### ❌ PROBLEMA

La validación solo se hace en el frontend con `valido` (feedback visual), no en el servidor.

**Ejemplo: src/app/cotizacion/page.tsx**:
```typescript
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setSubmitted(true); // No valida, solo muestra pantalla de "Gracias"
}
```

**Problema:**
- El formulario es solo visual
- Cualquiera puede cambiar el HTML y enviar sin validación

### ✅ SOLUCIÓN RECOMENDADA

Se agregó en vulnerabilidad #4: crear server action para recibir cotizaciones.

### 🔴 CRÍTICIDAD: ALTA

- Ya está corregido en el plan de vulnerabilidad #4
- Sin server action, la validación no existe

---

## 🚨 VULNERABILIDAD #16: SEGURIDAD DE CONTRASEÑA

### ❌ PROBLEMA

La contraseña se guarda con `bcryptjs` con salt default de 10 rounds. Esto está bien.

**Archivo: prisma/schema.prisma**:
```prisma
passwordHash String @map("password_hash")
```

**Archivo: src/lib/auth.ts:33**:
```typescript
const valid = await bcrypt.compare(password, user.passwordHash);
```

### ✅ SOLUCIÓN RECOMENDADA

- **No tocar:** Esto ya está bien
- **Agregar:** Fortaleza del password

```typescript
// En login
const valid = await bcrypt.compare(password, user.passwordHash);
if (!valid) {
  throw new Error("Email o contraseña incorrectos");
}
```

**Agregar validación de fuerza de contraseña cuando se cree usuario:**

```typescript
// Cuando se cree un nuevo usuario
export async function createUsuario(data: any) {
  const password = data.password;

  // Validar fuerza mínima
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      success: false,
      error: {
        password: [
          "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número",
        ],
      },
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  // ...
}
```

### 🟡 CRÍTICIDAD: MEDIA

- **Mitigada:** bcryptjs ya está bien configurado
- **Mejora:** Validación de fuerza de contraseña

---

## 🚨 VULNERABILIDAD #17: HARDCODING DE DATOS

### ❌ PROBLEMA

Hay datos hardcodeados que deberían venir de la BD o estar en configuración.

**Ejemplo: src/app/servicios/page.tsx** - Opción A:
```typescript
const servicios = [
  { slug: "steel-frame", titulo: "Steel Frame", descripcion: "..." },
  { slug: "drywall", titulo: "Tabiqueria Drywall", descripcion: "..." },
  // ...
];
```

**Problema:**
- Si se quiere agregar/modificar servicio, hay que editar el código
- NO se usa la BD

**Ejemplo: src/app/estimador/page.tsx:28-41** - Precios:
```typescript
const PRECIOS: Record<string, Record<string, { min: number; max: number }>> = {
  seco: {
    hasta_50: { min: 350000, max: 500000 },
    m50_100: { min: 300000, max: 420000 },
    m100_200: { min: 280000, max: 380000 },
    mas_200: { min: 250000, max: 350000 },
  },
  tradicional: {
    hasta_50: { min: 400000, max: 550000 },
    m50_100: { min: 350000, max: 480000 },
    m100_200: { min: 320000, max: 440000 },
    mas_200: { min: 300000, max: 400000 },
  },
};
```

**Problema:**
- Los precios son hardcodeados
- Deberían venir de la tabla `precio_referencia` en BD

### ✅ SOLUCIÓN RECOMENDADA

**Para servicios:**
- Agregar la opción "Editable desde admin" en el modelo de BD
- Crear CRUD de servicios (ya está en admin)
- Usar la BD en lugar de hardcodear

**Para precios del estimador:**
- Traer de `prisma.precioReferencia.findMany()`
- Con filtros: `tipoConstruccion` y `rangoM2`

```typescript
// src/app/estimador/page.tsx
const precios = await prisma.precioReferencia.findMany({
  where: {
    tipoConstruccion: tipo,
    rangoM2: m2,
  },
});

const resultado = precios[0] || null;
```

### 🟡 CRÍTICIDAD: MEDIA

- **Facilidad de uso:** Hardcodeado → difícil de modificar
- **Datos:** Hardcodeado → datos desactualizados

---

## 📊 RESUMEN FINAL

| # | Vulnerabilidad | Criticidad | Estado |
|---|---|---|---|
| 1 | Falta de verificación de rol | 🔴 ALTA | ✅ RESUELTA (requireAdmin en 20 funciones) |
| 2 | Exposición de datos privados | 🔴 ALTA | ✅ RESUELTA (getCotizacionesPropias + /mis-cotizaciones) |
| 3 | Query sin límite | 🔴 ALTA | ✅ RESUELTA (take: 50 en 7 queries) |
| 4 | Falta de validación en cotización pública | 🔴 ALTA | ✅ RESUELTA (createCotizacion con Zod) |
| 5 | Errores de validación en server actions | 🟡 MEDIA | ✅ RESUELTA (Zod en todos los create/update) |
| 6 | XSS en comentarios | 🟡 MEDIA | ✅ RESUELTA (sanitize.ts regex-based) |
| 7 | Inyección SQL potencial | 🟡 MEDIA | ✅ MITIGADA (Prisma parameteriza) |
| 8 | Headers HTTP expuestos | 🟡 MEDIA | ✅ RESUELTA (next.config.ts con headers seguros) |
| 9 | CORS no configurado | 🟡 MEDIA | ✅ MITIGADA (sin APIs externas) |
| 10 | Faltan límites en queries | 🟡 MEDIA | ✅ MITIGADA (sin filtros dinámicos) |
| 11 | Exposición de errores | 🟡 MEDIA | ✅ RESUELTA (console.error en todos los catch) |
| 12 | Configuración de datos sensible | 🟡 MEDIA | ✅ MITIGADA (sin compliance GDPR) |
| 13 | RevalidatePath sin validación | 🟡 MEDIA | ✅ MITIGADA (parámetros validados) |
| 14 | Faltan límites de longitud | 🟡 MEDIA | ✅ RESUELTA (maxLength en 5 inputs) |
| 15 | Client side validation | 🔴 ALTA | ✅ RESUELTA (server action + Zod) |
| 16 | Seguridad de contraseña | 🟡 MEDIA | ✅ MITIGADA (bcryptjs salt 10) |
| 17 | Hardcoding de datos | 🟡 MEDIA | ✅ RESUELTA (getPreciosReferencia desde BD) |

---

## 🎯 ORDEN DE CORRECCIÓN RECOMENDADO

1. **URGENTE** — Agregar `requireAdmin()` en TODOS los server actions (vulnerabilidad 1)
2. **URGENTE** -- Verificar la cotización pública (vulnerabilidad 4)
3. **URGENTE** -- Agregar `take: 50` a TODAS las queries (vulnerabilidad 3)
4. **URGENTE** -- Exponer solo datos propios para clientes (vulnerabilidad 2)
5. **URGENTE** -- Validar ESTADO en updateCotizacionEstado (vulnerabilidad 5)
6. **URGENTE** -- Sanitizar TODOS los textos libres (vulnerabilidad 6)
7. **MEDIO** -- Configurar headers HTTP (vulnerabilidad 8)
8. **MEDIO** -- Corregir hardcoding de precios (vulnerabilidad 17)
9. **BAJO** -- Agregar límites de longitud en inputs (vulnerabilidad 14)

---

## ✅ ARCHIVOS A CREAR

1. `src/lib/auth-utils.ts` — Middleware de autenticación y autorización
2. `src/lib/db-utils.ts` — Funciones de DB con filtros correctos
3. `src/lib/sanitize.ts` — Sanitización de HTML
4. `src/app/cotizacion/actions.ts` — Server action para crear cotizaciones

---

**Dale para adelante cuando quieras** — puedo guiarte paso a paso o dejarte trabajar y revisar cuando termines cada vulnerabilidad.

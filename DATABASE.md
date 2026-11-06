# Base de Datos — Contr-art Demo

> Esquema Prisma actual (PostgreSQL / Neon) — 22 tablas

---

## Resumen por módulos

| Módulo | Tablas |
|--------|--------|
| 1. Acceso y clientes | `usuarios`, `clientes`, `invitaciones_usuario` |
| 2. Proceso de venta | `cotizaciones`, `contratos`, `precio_referencia` |
| 3. Sitio web (portafolio) | `proyectos`, `testimonios`, `servicios`, `faqs`, `certificaciones` |
| 4. Obras en ejecución | `obras_activas`, `hitos_obra`, `pagos_obra` |
| 5. Empleados | `empleados`, `asignaciones_obra` |
| 6. Materiales | `materiales`, `materiales_obra` |
| 7. Herramientas | `herramientas`, `prestamos_herramienta` |
| 8. Chat | `chat_sesiones`, `chat_mensajes` |

---

## Módulo 1 — Acceso y clientes

### 1. `usuarios` (Usuario)

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | `String` | `@id @default(cuid())` | PK |
| `nombre` | `String` | | Nombre(s) |
| `apellidos` | `String` | | Apellidos |
| `email` | `String` | `@unique` | Login único |
| `password_hash` | `String` | `@map("password_hash")` | Hash bcrypt |
| `rol` | `Rol` | `@default(cliente)` | `admin` / `cliente` (nunca default admin) |
| `cliente_id` | `String?` | `@unique @map("cliente_id")` | FK → `clientes.id` (1:1 opcional) |
| `activo` | `Boolean` | `@default(true)` | Habilitar/deshabilitar cuenta |
| `creado_en` | `DateTime` | `@default(now()) @map("creado_en")` | Timestamp |

**Relaciones:** `cliente` → `Cliente` (1:1 opcional, por `cliente_id`)

---

### 2. `clientes` (Cliente)

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | `String` | `@id @default(cuid())` | PK |
| `nombre` | `String` | | Nombre(s) |
| `apellidos` | `String` | | Apellidos |
| `telefono` | `String` | | Contacto principal |
| `email` | `String?` | `@unique` | Opcional; llave natural de deduplicación |
| `ciudad` | `String?` | | Opcional |
| `creado_en` | `DateTime` | `@default(now()) @map("creado_en")` | Timestamp |

**Relaciones:** `usuario` (1:1 inversa), `cotizaciones[]`, `contratos[]`, `proyectos[]`, `obras[]`, `invitaciones[]`, `chat_sesiones[]`

> **Cliente vs Usuario:** `clientes` es la **ficha comercial** (puede existir sin cuenta). `usuarios` es la **cuenta de acceso**. Como máximo una cuenta por ficha. No tratarlas como si fueran la misma tabla.

---

### 3. `invitaciones_usuario` (InvitacionUsuario)

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | `String` | `@id @default(cuid())` | PK |
| `cliente_id` | `String` | `@map("cliente_id")` | FK → `clientes.id` (`onDelete: Cascade`) |
| `token` | `String` | `@unique` | Hex de 32 bytes (`crypto.randomBytes`) |
| `usado` | `Boolean` | `@default(false)` | `true` al completar la cuenta en `/completar-cuenta` |
| `expira_en` | `DateTime` | `@map("expira_en")` | Expiración (hoy 48 h) |
| `creado_en` | `DateTime` | `@default(now()) @map("creado_en")` | Timestamp |
| `creado_por` | `String?` | `@map("creado_por")` | Quién generó la invitación |

**Índice:** `cliente_id`

---

## Módulo 2 — Proceso de venta

### 4. `cotizaciones` (Cotizacion)

Una cotización es una **estimación**, no un monto cerrado.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | `String` | `@id @default(cuid())` | PK |
| `cliente_id` | `String` | `@map("cliente_id")` | FK → `clientes.id` |
| `tipo_obra` | `TipoObra` | `@map("tipo_obra")` | Enum |
| `tipo_construccion` | `TipoConstruccion` | `@map("tipo_construccion")` | Enum |
| `rango_m2` | `RangoM2` | `@map("rango_m2")` | Enum |
| `ubicacion_obra` | `String?` | `@map("ubicacion_obra")` | Dirección/ciudad |
| `foto_lote_url` | `String?` | `@map("foto_lote_url")` | URL de la foto del terreno (CDN externo). Opcional |
| `plazo_inicio` | `PlazoInicio` | `@map("plazo_inicio")` | Enum |
| `estado` | `String` | `@default("nuevo")` | VARCHAR + Zod (evolutivo) |
| `monto_estimado` | `Decimal?` | `@db.Decimal(12,2) @map("monto_estimado")` | Estimación. **Solo la edita el admin** |
| `requerimiento` | `String?` | | Mensaje del cliente en el form público |
| `notas_internas` | `String?` | `@map("notas_internas")` | Solo admin |
| `creado_en` | `DateTime` | `@default(now()) @map("creado_en")` | |
| `actualizado_en` | `DateTime` | `@updatedAt @map("actualizado_en")` | |

**Eliminado:** `monto_cerrado`. El monto definitivo vive en `contratos.monto_total`.

**Índices:** `cliente_id`, `estado`
**Relaciones:** `cliente` (N:1), `contratos[]` (1:N), `chat_sesiones[]`

**Flujo del dinero:**
```
Cotizacion.montoEstimado (opcional, lo fija el admin)
   → aprobación
   → Contrato.montoTotal (obligatorio, editable al crear el contrato, dato definitivo)
```

#### Estados de cotización (`estado`)

`String`, no enum nativo, porque es evolutivo.

- **Especificación aprobada** (`ESPECIFICACION_PANEL_ADMIN_CONTRART.md` §5.3):
  `nuevo`, `contactado`, `contratado`, `no_concretado`.
- **Código actual** (`src/lib/constants.ts`): `nuevo`, `contactado`, `visita_tecnica`,
  `presupuestado`, `ganado`, `perdido`.
- **Pendiente:** migrar el código a la especificación (`ganado`→`contratado`,
  `perdido`→`no_concretado`, sin `visita_tecnica`/`presupuestado`). Requiere
  autorización y migración de datos; no forma parte del plan v2.

---

### 5. `contratos` (Contrato)

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | `String` | `@id @default(cuid())` | PK |
| `cliente_id` | `String` | `@map("cliente_id")` | FK → `clientes.id` |
| `cotizacion_id` | `String?` | `@map("cotizacion_id")` | FK → `cotizaciones.id` (opcional) |
| `archivo_pdf_url` | `String?` | `@map("archivo_pdf_url")` | Enlace al PDF firmado |
| `fecha_firma` | `DateTime?` | `@map("fecha_firma")` | |
| `monto_total` | `Decimal` | `@db.Decimal(12,2) @map("monto_total")` | **Valor contractual definitivo** |
| `observaciones` | `String?` | | |
| `creado_en` | `DateTime` | `@default(now()) @map("creado_en")` | |

**Índice:** `cliente_id`
**Relaciones:** `cliente` (N:1), `cotizacion` (N:1 opcional), `obras[]` (1:N)

---

### 6. `precio_referencia` (PrecioReferencia)

> Tabla independiente. Se consulta por `tipo_construccion` + `rango_m2`.
> **Decisión pendiente:** candidata a eliminación. Mientras tanto se conserva.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | `String` | `@id @default(cuid())` | PK |
| `tipo_construccion` | `TipoConstruccion` | `@map("tipo_construccion")` | Enum |
| `rango_m2` | `RangoM2` | `@map("rango_m2")` | Enum |
| `precio_min` | `Decimal` | `@db.Decimal(12,2) @map("precio_min")` | Mínimo por m² |
| `precio_max` | `Decimal` | `@db.Decimal(12,2) @map("precio_max")` | Máximo por m² |
| `vigente_desde` | `DateTime` | `@default(now()) @map("vigente_desde")` | Historial de precios |

**Único compuesto:** `(tipo_construccion, rango_m2, vigente_desde)`

---

## Módulo 3 — Sitio web (portafolio)

### 7. `proyectos` (Proyecto)

El portafolio es **un video por proyecto**, no una galería.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | `String` | `@id @default(cuid())` | PK |
| `cliente_id` | `String?` | `@map("cliente_id")` | FK → `clientes.id` |
| `slug` | `String` | `@unique` | URL amigable `/proyectos/[slug]` |
| `titulo` | `String` | | Nombre visible |
| `tipo_construccion` | `TipoConstruccion` | `@map("tipo_construccion")` | Enum |
| `ubicacion` | `String` | | Ciudad/barrio |
| `video_url` | `String?` | `@map("video_url")` | URL del video (hoy TikTok) |
| `portada_url` | `String?` | `@map("portada_url")` | Imagen de portada del placeholder click-to-play |
| `orden` | `Int` | `@default(0)` | Secuencia en el muro |
| `destacado` | `Boolean` | `@default(false)` | Prioridad visual |
| `publicado` | `Boolean` | `@default(false)` | Visible en web |
| `m2_construidos` | `Int?` | `@map("m2_construidos")` | Opcional |
| `dias_ejecucion` | `Int?` | `@map("dias_ejecucion")` | Opcional |
| `problema_cliente` | `String?` | `@map("problema_cliente")` | Opcional |
| `solucion` | `String?` | | Opcional |
| `creado_en` | `DateTime` | `@default(now()) @map("creado_en")` | |
| `actualizado_en` | `DateTime` | `@updatedAt @map("actualizado_en")` | |

**Índices:** `cliente_id`, `(publicado, orden)`
**Relaciones:** `cliente` (N:1 opcional), `testimonios[]` (1:N)
**Eliminado:** relación `fotos` y toda la tabla `fotos_proyecto`.

---

### 8. `testimonios` (Testimonio)

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | `String` | `@id @default(cuid())` | PK |
| `proyecto_id` | `String?` | `@map("proyecto_id")` | FK → `proyectos.id` (opcional) |
| `cliente_nombre` | `String` | `@map("cliente_nombre")` | Nombre visible |
| `texto` | `String` | | Testimonio |
| `foto_url` | `String?` | `@map("foto_url")` | Foto cliente/obra |
| `puntaje` | `Int?` | | 1-5 |
| `publicado` | `Boolean` | `@default(false)` | Único flag que controla la visibilidad |
| `creado_en` | `DateTime` | `@default(now()) @map("creado_en")` | |
| `actualizado_en` | `DateTime` | `@updatedAt @map("actualizado_en")` | |

**Eliminado:** `autoriza_publicar`. El flujo es interno (carga el admin).

**Índice:** `proyecto_id`

---

### 9. `servicios` (Servicio)

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | `String` | `@id @default(cuid())` | PK |
| `slug` | `String` | `@unique` | URL estable `/servicios/[slug]` |
| `titulo` | `String` | | Nombre |
| `descripcion` | `String` | | Detalle |
| `orden` | `Int` | `@default(0)` | Orden en grid |
| `activo` | `Boolean` | `@default(true)` | Visible en web |

---

### 10. `faqs` (Faq)

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | `String` | `@id @default(cuid())` | PK |
| `pregunta` | `String` | | |
| `respuesta` | `String` | | |
| `orden` | `Int` | `@default(0)` | |
| `activo` | `Boolean` | `@default(true)` | |

---

### 11. `certificaciones` (Certificacion)

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | `String` | `@id @default(cuid())` | PK |
| `titulo` | `String` | | Nombre del certificado |
| `descripcion` | `String` | | Detalle |
| `image_url` | `String?` | `@map("image_url")` | Imagen del certificado (CDN externo). Solo la URL |
| `activo` | `Boolean` | `@default(true)` | Visible en web |

---

## Módulo 4 — Obras en ejecución

### 12. `obras_activas` (ObraActiva)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `String` | PK |
| `cliente_id` | `String` | FK → `clientes` |
| `contrato_id` | `String?` | FK → `contratos` |
| `direccion_obra` | `String` | |
| `fecha_inicio` | `DateTime` | |
| `fecha_fin_estimada` | `DateTime?` | |
| `estado` | `EstadoObra` | `en_curso` / `pausada` / `finalizada` / `entregada` |
| `progreso` | `Int` | 0-100 |

**Índices:** `cliente_id`, `contrato_id`
**Relaciones:** `cliente`, `contrato`, `hitos[]`, `pagos[]`, `asignaciones[]`, `materiales[]`, `prestamos[]`

---

### 13. `hitos_obra` (HitosObra)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `String` | PK |
| `obra_id` | `String` | FK → `obras_activas` |
| `titulo` | `String` | Nombre del hito |
| `descripcion` | `String` | |
| `fecha` | `DateTime` | |
| `foto_url` | `String?` | Evidencia |
| `visible_cliente` | `Boolean` | `@default(false)` |

**Índice:** `obra_id`

---

### 14. `pagos_obra` (PagoObra)

Es un **libro de caja digital** (QR / transferencia con comprobante), no una pasarela automática. Alimenta el portal del cliente.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `String` | PK |
| `obra_id` | `String` | FK → `obras_activas` |
| `monto` | `Decimal` | `@db.Decimal(12,2)` |
| `fecha` | `DateTime` | |
| `concepto` | `String` | |
| `comprobante_url` | `String?` | PDF/imagen |
| `estado` | `EstadoPago` | `registrado` / `confirmado` |

**Índice:** `obra_id`

---

## Módulo 5 — Empleados

### 15. `empleados` (Empleado)

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | `String` | `@id @default(cuid())` | PK |
| `nombre` | `String` | | |
| `apellidos` | `String` | | |
| `ci` | `String` | `@unique` | Carnet de identidad |
| `telefono` | `String` | | |
| `cargo` | `CargoEmpleado` | | `ingeniero` / `arquitecto` / `maestro_obra` / `albanil` / `electricista` / `plomero` / `ayudante` / `administrativo` |
| `fecha_ingreso` | `DateTime` | `@map("fecha_ingreso")` | Antigüedad laboral |
| `salario` | `Decimal?` | `@db.Decimal(12,2)` | Opcional |
| `activo` | `Boolean` | `@default(true)` | |
| `creado_en` | `DateTime` | `@default(now()) @map("creado_en")` | **Auditoría** del registro |

**Relaciones:** `asignaciones[]` (1:N).

---

### 16. `asignaciones_obra` (AsignacionObra)

Qué empleado trabaja en qué obra (N:M con atributos).

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | `String` | `@id @default(cuid())` | PK |
| `empleado_id` | `String` | `@map("empleado_id")` | FK → `empleados.id` |
| `obra_id` | `String` | `@map("obra_id")` | FK → `obras_activas.id` |
| `rol_en_obra` | `String` | `@map("rol_en_obra")` | Ej.: "Encargado de losa" |
| `fecha_inicio` | `DateTime` | `@map("fecha_inicio")` | |
| `fecha_fin` | `DateTime?` | `@map("fecha_fin")` | `null` = sigue asignado |

**Índices:** `empleado_id`, `obra_id`

---

## Módulo 6 — Materiales

### 17. `materiales` (Material)

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | `String` | `@id @default(cuid())` | PK |
| `nombre` | `String` | | Ej.: "Cemento portland" |
| `unidad` | `String` | | Unidad de medida (`bolsa`, `m2`, `kg`…). Sin ella `stock_actual` no significa nada |
| `stock_actual` | `Decimal` | `@db.Decimal(12,2) @map("stock_actual")` | |
| `stock_minimo` | `Decimal` | `@db.Decimal(12,2) @map("stock_minimo")` | Umbral de alerta de reposición |
| `precio_unitario` | `Decimal` | `@db.Decimal(12,2) @map("precio_unitario")` | Precio de catálogo actual |
| `activo` | `Boolean` | `@default(true)` | |

### 18. `materiales_obra` (MaterialObra)

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | `String` | `@id @default(cuid())` | PK |
| `obra_id` | `String` | `@map("obra_id")` | FK → `obras_activas.id` |
| `material_id` | `String` | `@map("material_id")` | FK → `materiales.id` |
| `cantidad` | `Decimal` | `@db.Decimal(12,2)` | |
| `precio_unitario` | `Decimal` | `@db.Decimal(12,2) @map("precio_unitario")` | **Congela** el costo de ese retiro en esa fecha |
| `fecha` | `DateTime` | | |

**Índices:** `obra_id`, `material_id`

---

## Módulo 7 — Herramientas

### 19. `herramientas` (Herramienta)

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | `String` | `@id @default(cuid())` | PK |
| `nombre` | `String` | | Ej.: "Taladro percutor" |
| `codigo` | `String?` | `@unique` | Código de inventario. Opcional (varios `NULL` conviven) |
| `estado` | `EstadoHerramienta` | `@default(disponible)` | `disponible` / `en_uso` / `mantenimiento` / `baja` |
| `activo` | `Boolean` | `@default(true)` | |

### 20. `prestamos_herramienta` (PrestamoHerramienta)

Registra **qué herramienta salió, para qué obra, cuándo y si volvió**. Ya no registra qué empleado la tiene.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | `String` | `@id @default(cuid())` | PK |
| `herramienta_id` | `String` | `@map("herramienta_id")` | FK → `herramientas.id` |
| `obra_id` | `String` | `@map("obra_id")` | FK → `obras_activas.id` |
| `fecha_salida` | `DateTime` | `@map("fecha_salida")` | |
| `fecha_devolucion` | `DateTime?` | `@map("fecha_devolucion")` | `null` = aún no volvió |
| `observaciones` | `String?` | | Ej.: "Devuelta con la broca rota" |

**Eliminado:** `empleado_id` y su índice.
**Índices:** `herramienta_id`, `obra_id`

> Quién estuvo en la obra sigue siendo consultable vía `asignaciones_obra`.
> Regla de negocio (en código, no en el schema): al crear un préstamo,
> `herramientas.estado` pasa a `en_uso`; al registrar devolución, vuelve a `disponible`;
> ambas operaciones en una **transacción** (`prisma.$transaction`).

---

## Módulo 8 — Chat

### 21. `chat_sesiones` (ChatSesion)

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | `String` | `@id @default(cuid())` | PK |
| `session_id` | `String` | `@unique` | Identificador de sesión usado por el frontend |
| `cliente_id` | `String` | FK → `clientes.id` | Cliente propietario de la sesión |
| `cotizacion_id` | `String?` | FK → `cotizaciones.id` | Cotización asociada (opcional) |
| `mensaje_count` | `Int` | `@default(0)` | Contador para rate limiting |
| `creado_en` | `DateTime` | `@default(now())` | Timestamp de creación |

**Índices:** `cliente_id`, `cotizacion_id`
**Relaciones:** `cliente` (N:1), `cotizacion` (N:1 opcional), `mensajes[]`

---

### 22. `chat_mensajes` (ChatMensaje)

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | `String` | `@id @default(cuid())` | PK |
| `sesion_id` | `String` | FK → `chat_sesiones.id` | Sesión a la que pertenece |
| `rol` | `String` | | `"user"` o `"assistant"` |
| `contenido` | `String` | `@db.Text` | Texto del mensaje |
| `creado_en` | `DateTime` | `@default(now())` | Timestamp de creación |

**Índices:** `(sesion_id, creado_en)`
**Relaciones:** `sesion` (N:1)

---

## Enums

| Enum | Valores |
|------|---------|
| `Rol` | `admin`, `cliente` |
| `TipoObra` | `vivienda_nueva`, `ampliacion`, `otro` |
| `TipoConstruccion` | `tradicional`, `seco`, `no_sabe`, `integral` |
| `RangoM2` | `hasta_50`, `m50_100`, `m100_200`, `mas_200` |
| `PlazoInicio` | `lo_antes_posible`, `en_1_mes`, `en_3_meses`, `en_6_meses`, `no_sabe` |
| `EstadoObra` | `en_curso`, `pausada`, `finalizada`, `entregada` |
| `EstadoPago` | `registrado`, `confirmado` |
| `CargoEmpleado` | `ingeniero`, `arquitecto`, `maestro_obra`, `albanil`, `electricista`, `plomero`, `ayudante`, `administrativo` |
| `EstadoHerramienta` | `disponible`, `en_uso`, `mantenimiento`, `baja` |

**Eliminado:** `FaseFoto` (`antes` / `durante` / `despues`).

---

## Diagrama de relaciones (Mermaid)

`SERVICIO`, `FAQ`, `CERTIFICACION` y `PRECIO_REFERENCIA` no tienen relaciones con otras tablas.

```mermaid
erDiagram
    USUARIO ||--o| CLIENTE : "cliente_id (1:1 opcional)"
    CLIENTE ||--o{ COTIZACION : "cliente_id"
    CLIENTE ||--o{ CONTRATO : "cliente_id"
    CLIENTE ||--o{ PROYECTO : "cliente_id (opcional)"
    CLIENTE ||--o{ OBRA_ACTIVA : "cliente_id"
    CLIENTE ||--o{ INVITACION_USUARIO : "cliente_id (cascade)"
    COTIZACION ||--o{ CONTRATO : "cotizacion_id (opcional)"
    CONTRATO ||--o{ OBRA_ACTIVA : "contrato_id (opcional)"
    PROYECTO ||--o{ TESTIMONIO : "proyecto_id (opcional)"
    OBRA_ACTIVA ||--o{ HITOS_OBRA : "obra_id"
    OBRA_ACTIVA ||--o{ PAGOS_OBRA : "obra_id"
    EMPLEADO ||--o{ ASIGNACION_OBRA : "empleado_id"
    OBRA_ACTIVA ||--o{ ASIGNACION_OBRA : "obra_id"
    MATERIAL ||--o{ MATERIAL_OBRA : "material_id"
    OBRA_ACTIVA ||--o{ MATERIAL_OBRA : "obra_id"
    HERRAMIENTA ||--o{ PRESTAMO_HERRAMIENTA : "herramienta_id"
    OBRA_ACTIVA ||--o{ PRESTAMO_HERRAMIENTA : "obra_id"
    CLIENTE ||--o{ CHAT_SESION : "cliente_id"
    COTIZACION ||--o{ CHAT_SESION : "cotizacion_id (opcional)"
    CHAT_SESION ||--o{ CHAT_MENSAJE : "sesion_id"

    SERVICIO {
        string id PK
        string slug
        string titulo
    }
    FAQ {
        string id PK
        string pregunta
        string respuesta
    }
    CERTIFICACION {
        string id PK
        string titulo
        string image_url
    }
    PRECIO_REFERENCIA {
        string id PK
        string tipo_construccion
        string rango_m2
    }
    CHAT_SESION {
        string id PK
        string session_id unique
        string cliente_id FK
        string cotizacion_id FK opcional
        int mensaje_count
        datetime creado_en
    }
    CHAT_MENSAJE {
        string id PK
        string sesion_id FK
        string rol
        text contenido
        datetime creado_en
    }
```

---

## Reglas de validación (Zod) ligadas a la BD

Zod es la **única** barrera de integridad de los campos que son `String` libre en la BD.

| Campo | Regla |
|-------|-------|
| `Cotizacion.fotoLoteUrl`, `Certificacion.imageUrl`, `Proyecto.portadaUrl` | `https`, host `res.cloudinary.com` y ruta que empiece por `/<cloud_name>/image/upload/`. Evita que se guarden URLs arbitrarias |
| `Proyecto.videoUrl` | Debe coincidir con `https://(www.)tiktok.com/@usuario/video/<id numérico>`. Se rechazan enlaces cortos (`vm.`/`vt.tiktok.com`) |
| Cualquier campo opcional de texto/URL | Cadena vacía `""` → `undefined`/`null` antes de guardar (importante si el campo es `@unique`) |
| `Cotizacion.montoEstimado` | Solo existe en el schema Zod del **admin**; el schema del formulario público no lo incluye |
| `Cotizacion.estado` / `origen` | Enum de Zod con los valores permitidos (ver `src/lib/constants.ts`) |

---

## Notas de implementación

- **Nomenclatura:** `snake_case` en BD (`@map`), `camelCase` en Prisma.
- **IDs:** `cuid()`.
- **Timestamps:** `creado_en` (`now()`), `actualizado_en` (`@updatedAt`).
- **Borrado:** lógico con `activo` / `publicado`; sin borrado físico salvo los casos con `Cascade`.
- **Dinero:** `@db.Decimal(12,2)`, en **bolivianos (Bs)**.
- **Tablas intermedias:** `asignaciones_obra` (empleado↔obra), `materiales_obra` (material↔obra) y `prestamos_herramienta` (herramienta↔obra).
- **Conexión Neon:** `DATABASE_URL` = conexión **pooled** (la app); `DIRECT_URL` = conexión **directa** (solo `prisma migrate`). El `datasource` debe declarar `directUrl = env("DIRECT_URL")`.
- **Migraciones versionadas** (`prisma/migrations/`):
  `20260918031323_init`, `20260920120000_bd_hardening`,
  `20261019000000_fix_drift_and_modules_5_7`, más las 12 migraciones del plan v2
  (hasta `20261029173000_herramienta_codigo_opcional`),
  `20261030164016_add_chat_sesiones_y_mensajes`.
- **Seed:** `prisma/seed.ts` es **destructivo** (`deleteMany()` por tabla). **Nunca ejecutarlo contra la BD de producción.** Las credenciales de demo viven solo en el seed; no se documentan aquí. Tras el Paso 4 el seed ya no crea fotos de proyecto.
- **NextAuth:** sesiones JWT con Credentials sobre `usuarios`. `@auth/prisma-adapter` está configurado pero las tablas del adapter (`account`, `session`, `verification_token`, `authenticator`) no existen en el schema; con JWT + Credentials no se usan. **Decisión pendiente:** quitar el adapter.

---

## Decisiones pendientes (no aplicadas)

| Tema | Estado actual | Opciones | Recomendación |
|------|---------------|----------|---------------|
| `Cotizacion.origen` | `String` obligatorio, con índice | enum opcional (`facebook`, `instagram`, `referido`, `web`, `otro`) o eliminar | Mantener `String` hasta revisar quién lo escribe/lee; si se pasa a enum, migrar valores existentes antes |
| `PrecioReferencia` | tabla sin relaciones | eliminar o conservar | Conservar hasta confirmar con `grep` que ningún cálculo/estimador la consume |
| Estados de `Cotizacion` | código ≠ especificación | migrar | Fuera del alcance de v2 |
| Adapter de NextAuth | configurado sin tablas | quitarlo | Quitar cuando haya tiempo; sin impacto en la BD |
| Campos opcionales de `Proyecto` (`m2`, `días`, `problema`, `solución`) | opcionales | eliminarlos del todo | Revisar tras 1-2 meses de uso real |

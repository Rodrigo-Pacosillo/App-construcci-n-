# Modelo de datos — schema Prisma, migraciones y seed

Cuándo leer: antes de tocar el schema, crear queries o modificar el seed.
Visión de negocio: `docs/proyecto.md`. Arquitectura: `docs/arquitectura.md`.

## Fuente de verdad

El `prisma/schema.prisma` es la fuente de verdad. Este documento explica
las decisiones detrás de ese schema, no lo duplica.

## Convención de enums

| Tipo | Ejemplo | Cambia con... |
|---|---|---|
| **ENUM nativo de BD** | `TipoConstruccion`, `FaseFoto`, `Rol` | Migración de BD |
| **VARCHAR + Zod** | `estado` cotización, `origen` cotización | `src/lib/constants.ts` |

**Regla:** si el valor es estable y no va a cambiar (fases de una foto,
tipos de construcción), usa ENUM nativo. Si es evolutivo (agregar un
nuevo estado del embudo, un nuevo canal de origen), usa VARCHAR + Zod.

## Entidades — Fase 1 (demo)

### usuarios

Cuentas de acceso: admin y clientes con portal. No es la entidad de
negocio — los leads viven en `clientes` y pueden NO tener cuenta.

```prisma
model Usuario {
  id            String    @id @default(cuid())
  nombre        String
  email         String    @unique
  passwordHash  String    @map("password_hash")
  rol           Rol       @default(cliente)
  clienteId     String?   @unique @map("cliente_id")
  cliente       Cliente?  @relation(fields: [clienteId], references: [id])
  activo        Boolean   @default(true)
  creadoEn      DateTime  @default(now()) @map("creado_en")

  @@map("usuarios")
}
```

- `clienteId` NULL para admin, 1:0..1 real con clientes
- El default del rol es `cliente`: un alta sin rol explícito jamás debe
  nacer admin (el admin se crea explícitamente con `rol: admin`)
- El id de `usuarios` NUNCA se guarda como FK en otra tabla de negocio;
  siempre se resuelve `usuario → cliente` (ver `usuario.clienteId`)
- `passwordHash` usa bcrypt (bcryptjs)
- Nunca borrar usuarios — usar `activo = false`

### clientes

Personas que piden cotización. El histórico del embudo es sagrado.

```prisma
model Cliente {
  id        String       @id @default(cuid())
  nombre    String
  whatsapp  String
  email     String?      @unique
  ciudad    String?
  creadoEn  DateTime     @default(now()) @map("creado_en")

  cotizaciones Cotizacion[]
  contratos    Contrato[]
  proyectos    Proyecto[]

  @@map("clientes")
}
```

- `email` es la llave natural para deduplicar leads: el mismo email no
  puede crear dos `clientes`. El registro público reusa el lead existente
  en vez de duplicarlo.

**NUNCA borrado físico** — soft delete con `activo` si es necesario (aún
no se modela, pero la convención es clara).

### cotizaciones

El corazón del embudo. Cada consulta entra como cotización.

```prisma
model Cotizacion {
  id                String            @id @default(cuid())
  clienteId         String            @map("cliente_id")
  cliente           Cliente           @relation(fields: [clienteId], references: [id])
  tipoObra          TipoObra          @map("tipo_obra")
  tipoConstruccion  TipoConstruccion  @map("tipo_construccion")
  rangoM2           RangoM2           @map("rango_m2")
  ubicacionObra     String?           @map("ubicacion_obra")
  plazoInicio       PlazoInicio       @map("plazo_inicio")
  origen            String            // VARCHAR + Zod (evolutivo)
  estado            String            @default("nuevo") // VARCHAR + Zod
  montoEstimado     Decimal?          @map("monto_estimado") @db.Decimal(12, 2)
  montoCerrado      Decimal?          @map("monto_cerrado") @db.Decimal(12, 2)
  requerimiento     String?           @map("requerimiento") // mensaje del cliente del form público
  notasInternas     String?           @map("notas_internas") // apuntes del admin
  creadoEn          DateTime          @default(now()) @map("creado_en")
  actualizadoEn     DateTime          @updatedAt @map("actualizado_en")

  contratos Contrato[]

  @@index([clienteId])
  @@index([origen])
  @@index([estado])
  @@map("cotizaciones")
}
```

- `clienteId` OBLIGATORIO: el formulario público siempre resuelve o crea
  el lead antes de guardar la cotización. Nunca guardar `usuarios.id` ahí.
- `requerimiento` = lo que escribió el cliente al pedir. `notas_internas`
  es solo para el admin; NO mezclarlos.

**Estados del embudo** (VARCHAR + Zod en `src/lib/constants.ts`):
`nuevo` → `contactado` → `visita_tecnica` → `presupuestado` →
`ganado` / `perdido`

**Orígenes** (VARCHAR + Zod en `src/lib/constants.ts`):
`web`, `whatsapp`, `tiktok`, `facebook`, `referido`, `estimador`

### contratos

Traza qué lead se convirtió en contrato. Solo para análisis, no para
generación de documentos (eso sería fase 2+).

```prisma
model Contrato {
  id              String      @id @default(cuid())
  clienteId       String      @map("cliente_id")
  cliente         Cliente     @relation(fields: [clienteId], references: [id])
  cotizacionId    String?     @map("cotizacion_id")
  cotizacion      Cotizacion? @relation(fields: [cotizacionId], references: [id])
  archivoPdfUrl   String?     @map("archivo_pdf_url")
  fechaFirma      DateTime?   @map("fecha_firma")
  montoTotal      Decimal     @map("monto_total") @db.Decimal(12, 2)
  observaciones   String?
  creadoEn        DateTime    @default(now()) @map("creado_en")

  @@index([clienteId])
  @@map("contratos")
}
```

- `fechaFirma` es la fecha de negocio (firma); `creadoEn` es cuándo se
  cargó el registro en el sistema.

### proyectos

Portafolio público. `slug` es la URL: `/proyectos/[slug]`.

```prisma
model Proyecto {
  id                 String            @id @default(cuid())
  clienteId          String?           @map("cliente_id")
  slug               String            @unique
  titulo             String
  tipoConstruccion   TipoConstruccion  @map("tipo_construccion")
  m2Construidos      Int               @map("m2_construidos")
  diasEjecucion      Int               @map("dias_ejecucion")
  ubicacion          String
  problemaCliente    String            @map("problema_cliente")
  solucion           String
  destacado          Boolean           @default(false)
  publicado          Boolean           @default(false)
  creadoEn           DateTime          @default(now()) @map("creado_en")
  actualizadoEn      DateTime          @updatedAt @map("actualizado_en")

  cliente        Cliente?         @relation(fields: [clienteId], references: [id])
  fotos          FotoProyecto[]
  testimonios    Testimonio[]

  @@map("proyectos")
}
```

- `clienteId` NULLABLE: permite mostrar proyectos sin vínculo al lead
  (proyectos viejos, stock). Cuando hay vínculo, cierra el círculo
  analítico: lead → proyecto publicado.

### fotos_proyecto

Borrado CASCADE desde proyectos — una foto sin proyecto no significa nada.

```prisma
model FotoProyecto {
  id          String    @id @default(cuid())
  proyectoId  String    @map("proyecto_id")
  proyecto    Proyecto  @relation(fields: [proyectoId], references: [id], onDelete: Cascade)
  url         String
  fase        FaseFoto
  orden       Int

  @@index([proyectoId])
  @@map("fotos_proyecto")
}
```

### testimonios

```prisma
model Testimonio {
  id                  String    @id @default(cuid())
  proyectoId          String?   @map("proyecto_id")
  proyecto            Proyecto? @relation(fields: [proyectoId], references: [id])
  clienteNombre       String    @map("cliente_nombre")
  texto               String
  fotoUrl             String?   @map("foto_url")
  puntaje             Int?      // 1-5, para estrellas
  autorizaPublicar    Boolean   @default(false) @map("autoriza_publicar")
  publicado           Boolean   @default(false)
  creadoEn            DateTime  @default(now()) @map("creado_en")
  actualizadoEn       DateTime  @updatedAt @map("actualizado_en")

  @@index([proyectoId])
  @@map("testimonios")
}
```

### servicios

Una página por servicio: `/servicios/[slug]`.

```prisma
model Servicio {
  id          String   @id @default(cuid())
  slug        String   @unique
  titulo      String
  descripcion String
  orden       Int      @default(0)
  activo      Boolean  @default(true)

  @@map("servicios")
}
```

### faqs

```prisma
model Faq {
  id         String  @id @default(cuid())
  pregunta   String
  respuesta  String
  orden      Int     @default(0)
  activo     Boolean @default(true)

  @@map("faqs")
}
```

### certificaciones

Credenciales del contratista. Sin relaciones.

```prisma
model Certificacion {
  id          String  @id @default(cuid())
  titulo      String
  descripcion String
  activo      Boolean @default(true)

  @@map("certificaciones")
}
```

### precio_referencia

Alimenta el estimador público.

```prisma
model PrecioReferencia {
  id                 String           @id @default(cuid())
  tipoConstruccion   TipoConstruccion @map("tipo_construccion")
  rangoM2            RangoM2          @map("rango_m2")
  precioMin          Decimal          @map("precio_min") @db.Decimal(12, 2)
  precioMax          Decimal          @map("precio_max") @db.Decimal(12, 2)
  vigenteDesde       DateTime         @default(now()) @map("vigente_desde")

  @@unique([tipoConstruccion, rangoM2, vigenteDesde])
  @@map("precio_referencia")
}
```

## Entidades — Fase 2 (implementadas)

```prisma
model ObraActiva {
  id                 String       @id @default(cuid())
  clienteId          String       @map("cliente_id")
  contratoId         String?      @map("contrato_id")
  direccionObra      String       @map("direccion_obra")
  fechaInicio        DateTime     @map("fecha_inicio")
  fechaFinEstimada   DateTime?    @map("fecha_fin_estimada")
  estado             EstadoObra   @default(en_curso)
  progreso           Int          @default(0)

  cliente   Cliente   @relation(fields: [clienteId], references: [id])
  contrato  Contrato? @relation(fields: [contratoId], references: [id])
  hitos     HitosObra[]
  pagos     PagoObra[]

  @@map("obras_activas")
}

model HitosObra {
  id                String   @id @default(cuid())
  obraId            String   @map("obra_id")
  titulo            String
  descripcion       String
  fecha             DateTime
  fotoUrl           String?  @map("foto_url")
  visibleCliente    Boolean  @default(false) @map("visible_cliente")

  obra ObraActiva @relation(fields: [obraId], references: [id])

  @@map("hitos_obra")
}

model PagoObra {
  id              String       @id @default(cuid())
  obraId          String       @map("obra_id")
  monto           Decimal      @db.Decimal(12, 2)
  fecha           DateTime
  concepto        String
  comprobanteUrl  String?      @map("comprobante_url")
  estado          EstadoPago   @default(registrado)

  obra ObraActiva @relation(fields: [obraId], references: [id])

  @@map("pagos_obra")
}
```

## Índices de FK

PostgreSQL **no** indexa automáticamente las columnas FK (a diferencia de
MySQL). Todas las FKs en tablas con datos deben llevar `@@index`:

`cotizaciones.clienteId` ✅ · `fotos_proyecto.proyectoId` ✅ ·
`contratos.clienteId` ✅ · `proyectos.clienteId` ✅ ·
`testimonios.proyectoId` ✅ · `obras_activas.clienteId/contratoId` ✅ ·
`hitos_obra.obraId` ✅ · `pagos_obra.obraId` ✅

## Migraciones

### Orden de creación

1. `usuarios` (sin dependencias)
2. `clientes` (sin dependencias)
3. `cotizaciones` (depende de `clientes`)
4. `contratos` (depende de `clientes`, `cotizaciones`)
5. `proyectos` (depende de `clientes`)
6. `fotos_proyecto` (depende de `proyectos`)
7. `testimonios` (depende de `proyectos`)
8. `servicios`, `faqs`, `certificaciones` (sin dependencias)
9. `precio_referencia` (sin dependencias)
10. Fase 2: `obras_activas`, `hitos_obra`, `pagos_obra`

### Endurecimiento BD (`20260920120000_bd_hardening`)

Migración pendiente de aplicar contra Neon. Cambios:

- `usuarios.rol` default `admin` → `cliente`
- `clientes.email` pasa a `@unique` (dedupe de leads)
- `cotizaciones.cliente_id` pasa a NOT NULL + nueva columna `requerimiento`
- `contratos.creado_en` y `testimonios.creado_en`
- Índices de FK en `contratos`, `proyectos`, `testimonios`,
  `obras_activas`, `hitos_obra`, `pagos_obra`

**Precondiciones antes de aplicar** (fallan si no se limpian):

1. `clientes`: sin emails duplicados (`SELECT email, count(*) FROM clientes GROUP BY email HAVING count(*) > 1`)
2. `cotizaciones`: sin `cliente_id` NULL (`SELECT count(*) FROM cotizaciones WHERE cliente_id IS NULL`)

Aplicar con `pnpm db:migrate` (o `prisma migrate deploy`).

### Comandos

```bash
pnpm db:migrate    # Crear + aplicar migración
pnpm db:seed       # DESTRUCTIVO: borra y recarga los datos semilla
```

## Seed (`prisma/seed.ts`)

El seed carga datos verosímiles (NO reales) para la demo:

- 1 admin (email: `admin@demo.com`, password: `admin123`)
- 1 usuario cliente (email: `cliente@demo.com`, password: `cliente123`)
- ~8-10 clientes de ejemplo
- ~12-15 cotizaciones en diferentes estados del embudo
- 1 contrato de ejemplo
- 1 obra activa con hitos y pagos de ejemplo
- ~6 proyectos publicados (portafolio)
- ~12 fotos de proyectos (antes/durante/después)
- ~5 testimonios
- 4-6 servicios (steel frame, drywall, cielorrasos, etc.)
- ~8 FAQs
- 3-4 certificaciones
- ~8 registros de precio_referencia

# Modelo de datos — schema Prisma, migraciones y seed

Cuándo leer: antes de tocar el schema, crear queries o modificar el seed.
Visión de negocio: `docs/proyecto.md`. Arquitectura: `docs/arquitectura.md`.

## Fuente de verdad

El `prisma/schema.prisma` es la fuente de verdad. Este documento explica
las decisiones detrás de ese schema, no lo duplica.

## Convención de enums

| Tipo | Ejemplo | Cambia con... |
|---|---|---|
| **ENUM nativo de BD** | `TipoConstruccion`, `Rol` | Migración de BD |
| **VARCHAR + Zod** | `estado` cotización, `origen` cotización | `src/lib/constants.ts` |

**Regla:** si el valor es estable y no va a cambiar (fases de una foto,
tipos de construcción), usa ENUM nativo. Si es evolutivo (agregar un
nuevo estado del embudo, un nuevo canal de origen), usa VARCHAR + Zod.

## Entidades — Fase 1 (demo)

### usuarios

**Cuenta de acceso** (credenciales, rol, estado): admin y clientes con portal.
No es la entidad de negocio — los leads viven en `clientes` y pueden NO tener
cuenta. `Usuario.clienteId` vincula la cuenta con la ficha `Cliente` existente.

```prisma
model Usuario {
  id            String    @id @default(cuid())
  nombre        String
  apellidos     String
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

Personas que piden cotización (ficha de persona/contacto, **no** es la cuenta
de acceso). El histórico del embudo es sagrado.

```prisma
model Cliente {
  id        String       @id @default(cuid())
  nombre    String
  apellidos String
  telefono  String
  email     String?      @unique
  ciudad    String?
  creadoEn  DateTime     @default(now()) @map("creado_en")

  usuario      Usuario?
  cotizaciones Cotizacion[]
  contratos    Contrato[]
  proyectos    Proyecto[]
  obras        ObraActiva[]

  @@map("clientes")
}
```

- `telefono` es el campo de contacto (antes se llamaba `whatsapp`).
- `email` es la llave natural para deduplicar leads: el mismo email no
  puede crear dos `clientes`. El formulario público reusa el lead existente
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
  estado            String            @default("nuevo") // VARCHAR + Zod
  montoEstimado     Decimal?          @map("monto_estimado") @db.Decimal(12, 2)
  fotoLoteUrl       String?           @map("foto_lote_url") // URL de foto del lote (CDN externo)
  requerimiento     String?           @map("requerimiento") // mensaje del cliente del form público
  notasInternas     String?           @map("notas_internas") // apuntes del admin
  creadoEn          DateTime          @default(now()) @map("creado_en")
  actualizadoEn     DateTime          @updatedAt @map("actualizado_en")

  contratos Contrato[]

  @@index([clienteId])
  @@index([estado])
  @@map("cotizaciones")
}
```

- `clienteId` OBLIGATORIO: el formulario público siempre resuelve o crea
  el lead antes de guardar la cotización. Nunca guardar `usuarios.id` ahí.
- `requerimiento` = lo que escribió el cliente al pedir. `notas_internas`
  es solo para el admin; NO mezclarlos.

**Estados del embudo** (VARCHAR + Zod en `src/lib/constants.ts`):

- **Definidos por la especificación aprobada** (autoridad funcional):
  `nuevo` → `contactado` → `contratado` / `no_concretado`.
  Etiquetas UI: "Por revisar", "Pendiente"/"Contactada", "Contratada",
  "No concretada".
- **Estado actual del código** (todavía sin migrar): `nuevo`, `contactado`,
  `visita_tecnica`, `presupuestado`, `ganado`, `perdido`.
- **Pendiente:** alinear el código a los valores de la especificación
  (`ganado`→`contratado`, `perdido`→`no_concretado`), con autorización.
  Ver `DATABASE.md` § "Estados de cotización".

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
  ubicacion          String
  videoUrl           String?         @map("video_url") // URL del video (hoy TikTok)
  portadaUrl         String?         @map("portada_url") // portada del proyecto (click-to-play)
  orden              Int             @default(0) // secuencia en el muro
  m2Construidos      Int?            @map("m2_construidos")
  diasEjecucion      Int?            @map("dias_ejecucion")
  problemaCliente    String?         @map("problema_cliente")
  solucion           String?
  destacado          Boolean         @default(false)
  publicado          Boolean         @default(false)
  creadoEn           DateTime        @default(now()) @map("creado_en")
  actualizadoEn      DateTime        @updatedAt @map("actualizado_en")

  cliente        Cliente?         @relation(fields: [clienteId], references: [id])
  testimonios    Testimonio[]

  @@map("proyectos")
}
```

- `clienteId` NULLABLE: permite mostrar proyectos sin vínculo al lead
  (proyectos viejos, stock). Cuando hay vínculo, cierra el círculo
  analítico: lead → proyecto publicado.

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
  imageUrl    String? @map("image_url") // imagen del certificado (CDN externo). Solo la URL
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

`cotizaciones.clienteId` ✅ · `contratos.clienteId` ✅ · `proyectos.clienteId` ✅ ·
`testimonios.proyectoId` ✅ · `obras_activas.clienteId/contratoId` ✅ ·
`hitos_obra.obraId` ✅ · `pagos_obra.obraId` ✅

## Migraciones

### Orden de creación

1. `usuarios` (sin dependencias)
2. `clientes` (sin dependencias)
3. `cotizaciones` (depende de `clientes`)
4. `contratos` (depende de `clientes`, `cotizaciones`)
5. `proyectos` (depende de `clientes`)
6. `testimonios` (depende de `proyectos`)
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

Aplicar con `npm run db:migrate` (o `prisma migrate deploy`).

### Migraciones existentes

En `prisma/migrations/`:

1. `20260918031323_init`
2. `20260920120000_bd_hardening`
3. `20261019000000_fix_drift_and_modules_5_7` — corrige drift y agrega los
   módulos 5-7 (empleados, materiales, herramientas). El `schema.prisma` ya
   refleja las tres.
4. Migraciones del plan v2 (12 migraciones, desde `20261029154229_certificacion_add_image_url`
   hasta `20261029173000_herramienta_codigo_opcional`).

### Comandos

```bash
npm run db:migrate    # Crear + aplicar migración
npm run db:seed       # DESTRUCTIVO: borra y recarga los datos semilla
```

## Seed (`prisma/seed.ts`)

El seed carga datos verosímiles (NO reales) para la demo. Es **destructivo**:
ejecuta `deleteMany()` por tabla antes de sembrar.

Inventario real que carga hoy:

- 1 usuario admin (`admin@gmail.com` / `admin123`)
- 1 usuario cliente (`cliente@gmail.com` / `cliente123`) vinculado a la ficha
  de cliente
- 1 cliente demo (Juan Pérez)
- **0 cotizaciones** (documentación antigua afirmaba ~12-15: incorrecto)
- 1 contrato y 1 obra activa (con 4 hitos y 3 pagos)
- 6 proyectos publicados (portafolio)
- 5 testimonios, 6 servicios, 10 FAQs, 4 certificaciones
- 8 registros de `precio_referencia`

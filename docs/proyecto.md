# Contexto del proyecto — sentido, negocio y modelo de datos

Qué es esta app, para quién, cómo funciona el negocio que soporta y qué
decisiones de diseño quedaron acordadas. Stack y reglas de desarrollo:
ver `AGENTS.md`.

## Sentido de uso

**Para el dueño (contratista):** hoy capta clientes por WhatsApp y boca a
boca, y las consultas se le pierden. El panel le da un embudo de ventas:
cada consulta entra como cotización con su origen, avanza por estados, y
queda el histórico — qué canal trae leads, cuáles se ganan, por cuánto.

**Para el visitante:** alguien que quiere construir, ampliar o reformar y
está evaluando a quién contratar. El sitio lo convence (portafolio con
antes/después, testimonios, m² y días reales) y lo captura (formulario de
cotización y estimador orientativo).

Cada página pública tiene uno de dos propósitos: **convertir** o
**posicionar (SEO local)**. Nada más.

## El flujo del negocio

```text
visitante → cotización (con origen)
   → embudo: nuevo → contactado → visita_tecnica → presupuestado
                                     → ganado / perdido
   → ganado: contrato
   → obra activa (portal cliente + admin de obras)
   → proyecto publicado en portafolio (antes/durante/después)
   → testimonio publicado
   → genera el próximo lead              ← el círculo se cierra
```

Reglas del flujo:

- El **origen** se captura siempre (web, whatsapp, tiktok, facebook,
  referido, estimador): es la métrica de qué canal funciona.
- El **estado** lo mueve el admin a mano desde el panel.
- `monto_estimado` se completa al presupuestar; `monto_cerrado` al ganar.
- `proyectos.cliente_id` cierra el círculo: qué lead se volvió caso
  publicado.

## Modelo de datos (diseño acordado)

Convención clave: **ENUM nativo de BD** para valores estables (fases, tipos
de construcción); **VARCHAR + validación Zod** (`src/lib/constants.ts`) para
valores evolutivos (estado, origen) — cambiar una etapa o sumar un canal no
debe requerir migración de BD.

```text
usuarios          — cuentas de acceso (hoy solo admin)
- id, nombre, email UQ, password_hash (bcrypt), rol ENUM(admin, cliente),
  cliente_id FK→clientes NULL UQ (garantiza 1:0..1 real), activo, creado_en

clientes          — personas que piden cotización. NUNCA borrado físico
- id, nombre, whatsapp, email NULL, ciudad, creado_en

cotizaciones      — el corazón: el embudo de ventas
- id, cliente_id FK [INDEX]
- tipo_obra ENUM(vivienda_nueva, ampliacion, otro)
- tipo_construccion ENUM(tradicional, seco, no_sabe)
- rango_m2 ENUM(hasta_50, m50_100, m100_200, mas_200)
- ubicacion_obra, plazo_inicio ENUM(lo_antes_posible, en_3_meses, no_sabe)
- origen VARCHAR (evolutivo → Zod) [INDEX]
- estado VARCHAR (evolutivo → Zod) [INDEX]
- monto_estimado DECIMAL(12,2) NULL  — se completa al presupuestar
- monto_cerrado   DECIMAL(12,2) NULL  — se completa al ganar
- notas_internas TEXT NULL, creado_en, actualizado_en

contratos
- id, cliente_id FK, cotizacion_id FK→cotizaciones NULL (traza el
  lead que se convirtió en contrato), archivo_pdf_url, fecha_firma,
  monto_total, observaciones

proyectos         — portafolio público
- id, cliente_id FK NULL (círculo analítico)
- slug UQ                 — URL pública: /proyectos/[slug]
- titulo, tipo_construccion ENUM(tradicional, seco, integral),
  m2_construidos, dias_ejecucion, ubicacion
- problema_cliente TEXT, solucion TEXT   — narrativa de caso, no bullet
- destacado, publicado, creado_en, actualizado_en

fotos_proyecto    — borrado CASCADE desde proyectos
- id, proyecto_id FK [INDEX], url, fase ENUM(antes, durante, despues), orden

testimonios
- id, proyecto_id FK NULL, cliente_nombre, texto, foto_url NULL,
  puntaje NULL (1-5, para estrellas), autoriza_publicar, publicado,
  actualizado_en

servicios         — una página por servicio: /servicios/[slug]
- id, slug UQ, titulo, descripcion, orden, activo
  (campos ampliables al codear; editable desde admin)

faqs              - id, pregunta, respuesta, orden, activo

certificaciones  — credenciales del contratista (editable, sin relaciones)

precio_referencia — alimenta el estimador público
- id, tipo_construccion, rango_m2, precio_min, precio_max, vigente_desde
- UQ(tipo_construccion, rango_m2, vigente_desde) — historial sin duplicados
```

### Fase 2 — implementada (portal de cliente + admin de obras)

Entidades en uso por `/cliente` y `/admin/obras` (hitos y pagos):

```text
obras_activas  — cliente_id FK, contrato_id FK NULL, direccion_obra,
  fecha_inicio, fecha_fin_estimada, estado ENUM(en_curso, pausada,
  finalizada, entregada), progreso
hitos_obra     — obra_id FK, titulo, descripcion, fecha, foto_url,
  visible_cliente
pagos_obra     — obra_id FK, monto, fecha, concepto, comprobante_url,
  estado ENUM(registrado, confirmado)
```

## Decisiones acordadas (y su porqué)

| Decisión | Por qué |
|---|---|
| estado/origen como VARCHAR + Zod | Cambian sin migración de BD |
| Datos de negocio en `clientes`; `usuarios` solo login | Nunca duplicar; un lead se vuelve usuario sin migrar datos |
| `clientes` sin borrado físico | El histórico del embudo es sagrado; `fotos_proyecto` sí CASCADE (una foto sin proyecto no significa nada) |
| Imágenes jamás en la BD | Siempre rutas; en demo: `/public/img/` |
| Estimador público INCLUIDO | Lead magnet + contenido SEO; usa `precio_referencia` y crea la cotización con `origen="estimador"` |
| Storage externo postergado | Recién cuando el dueño apruebe y haya fotos reales |
| Inventario y estimación de materiales FUERA de alcance | El contratista compra por obra, sin stock — documentado como trabajo futuro |
| Historial de cambios de estado del embudo | Trabajo futuro — no se modela ahora |

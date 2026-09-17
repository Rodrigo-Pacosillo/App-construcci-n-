# Diseño UI — dirección visual, tema y animaciones

Cuándo leer: antes de tocar cualquier cosa visual (pasos 3 a 6 del orden
de construcción). Negocio y modelo de datos: `docs/proyecto.md`.

## Concepto

Estética "spec sheet / plano técnico": el sitio se viste como un plano de
obra. Brutalismo SUAVE (tipografía enorme, composición dura, sin sombras)
sin sacrificar jerarquía ni confianza. Doble sentido del tema: claro =
plano impreso; oscuro = blueprint en pantalla.

## Tokens (viven en globals.css con @theme de Tailwind v4)

```text
Rotan con el tema:
  claro:  fondo #FAFAF8 · ink #17181A · superficie #FFFFFF · bordes #E5E3DE
  oscuro: fondo #0F1013 · ink #F2F1EC · superficie #15171B · bordes #23262B

Fijos (no rotan):
  bloques oscuros: #0C0D10 + radial-gradient ámbar 3-4% opacidad
  acento: ámbar #FFB300 — texto NEGRO encima SIEMPRE (ancla visual,
  idéntico en ambos temas; contraste AA garantizado)
```

## Tipografía

- **Titulares:** Archivo (variante Expanded, pesos fuertes) — gigantes,
  fluidos con `clamp()`, sin miedo al tamaño
- **Cuerpo:** Geist
- **Etiquetas/datos:** Geist Mono — uppercase, tracking amplio
- Cargar con `next/font` (sin FOUT)

## Lenguaje visual

- Bordes de 1px en vez de sombras blandas
- Numeración de secciones: `01 / SERVICIOS` — un solo componente
  `section-heading` para todo el sitio
- Etiquetas mono decorativas: `TABIQUE DVH — 45 MM`, `RITMO: 40 CM`
- Cotas en fotos: `≈ 2.60 m`
- Grilla de fondo sutil (ritmo de parantes) en bloques oscuros
- Portafolio: grilla asimétrica 60/40
- Fotos de obras: borde 1px + label mono de fase (ANTES / DURANTE /
  DESPUÉS)

## Copy (regla de micro-atención)

Una idea por sección: titular que se entiende solo → máximo 2 líneas de
apoyo → detalle técnico chiquito en mono. Voseo siempre ("Pedí tu
presupuesto").

## Tema claro/oscuro

- **next-themes**: `defaultTheme="system"`, toggle manual (sol/luna,
  lucide), sin flash (script pre-hidratación)
- Tailwind v4: `dark:` por clase
- Bloques SIEMPRE oscuros (hero, footer, portafolio) — no rotan

## Home — spec sección por sección

| Sección | Contenido | Animación | Librería |
|---|---|---|---|
| Hero (dark) | Titular + blueprint animado en loop | Timeline + spotlight | GSAP |
| Marquee | Especialidades en loop infinito | Ticker | Motion |
| 01 Servicios | Cards numeradas, borde 1px | Reveal stagger + spotlight hover | Motion |
| 02 Cómo construimos ⭐ | Muro por capas | **Pinned:** capas se apilan con labels | GSAP |
| 03 Proyectos (dark) | Grilla asimétrica, fotos protagonistas | Reveal + hover zoom | Motion |
| 04 Antes/Después ⭐ | Comparador drag (o secuencia scrub) | Drag + clip-path | Motion / GSAP |
| 05 Números | m², obras, días | Contadores on-view | Motion |
| 06 Testimonios | Quote grande + avatar | Scroll horizontal o carrusel | GSAP / Motion |
| 07 Estimador | 3 pasos: tipo → m² → resultado | Transición de pasos | Motion |
| 08 FAQ | Acordeones | Altura animada | Motion |
| CTA final (dark) | "Pedí tu presupuesto" | Fondo grilla sutil | Motion |

⭐ = joyas de la demo. `/proyectos` (portafolio completo) también en
oscuro: estilo sala de proyección, las fotos resaltan.

## Hero — el blueprint que se construye solo

Storyboard del loop (~10-12s, GSAP timeline `repeat: -1`):

1. Rieles inferior/superior se dibujan → parantes verticales uno a uno
2. Estructura: dintel de abertura, esquinas, techo
3. Aislación: paños crecen entre parantes
4. Placas: paneles cubren el esqueleto
5. Ventana se enciende ámbar → pausa 1.5s → fade out → reinicia

**Técnica:** el muro se genera CON CÓDIGO (líneas/rects desde arrays,
parantes con `map()`) — no un SVG ilustrativo dibujado a mano. Solo
transform/opacity. Interacción: spotlight que sigue el cursor ilumina
las líneas cercanas (fusión con la grilla reactiva: el fondo del hero es
UN solo concepto). Mobile: dibujo detrás del titular con overlay.
`prefers-reduced-motion`: estado final estático.
El mismo componente de muro se reutiliza en la sección 02 (pinned) con
animación distinta: hero = teaser, sección 02 = explicación.

## Menú de efectos (todos con el stack actual)

Reveals laterales alternados (whileInView) · spotlight en cards ·
botón magnético (useSpring) · text reveal por palabras (stagger) ·
marquee · contadores · parallax sutil en fotos · scroll horizontal
(testimonios) · secuencia scroll-scrub (opcional, antes/durante/después)

Referencias para copiar componentes (código, no paquetes):
React Bits (reactbits.dev, versión Motion o GSAP) · Magic UI ·
Aceternity UI.

## Reglas de animación

- **Motion** para UI; **GSAP** para scroll (pinning, scrub, horizontal)
- **Lenis** smooth scroll global, integrado con ScrollTrigger
- Solo animar `transform` y `opacity` — nunca props de layout
- Duraciones UI: 0.3–0.5s, easings snappy
- `prefers-reduced-motion` SIEMPRE — respetarlo no es opcional

## Responsive y accesibilidad

- Mobile: grilla → columna, menú hamburguesa full-screen, hero con
  dibujo de fondo + overlay
- Focus visible SIEMPRE: anillo ámbar; nunca eliminar outlines
- Contraste AA en ambos temas
- Errores de formulario: inline bajo el campo, texto mono, en el
  momento (no al enviar todo)

## El admin va POR APARTE

El panel usa los mismos tokens pero es FUNCIONAL, no narrativo:
- Sin GSAP, sin Lenis, sin storytelling, sin joyas
- Animaciones solo funcionales mínimas (feedback de acciones)
- Tablas legibles, acciones claras, densidad de datos

## Qué NO hacer (lista negra)

- Brutalismo extremo: elementos "rotos", jerarquía caótica
- Partículas/efectos tech genéricos (dots, blobs, waves de librería)
- Video de fondo
- View Transitions API (experimental — no)
- Sombras blandas grandes / glassmorphism
- UI kits (shadcn, MUI...) — primitivos propios
- Storytelling animado en el admin


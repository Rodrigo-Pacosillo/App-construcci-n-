# Mejoras de UI del chat del asistente de CONSTR-ART (solo visual)

> Stack: Next.js + Tailwind CSS + TypeScript. Trabajar en rama (`git checkout -b feat/chat-ui`) y hacer un commit por paso.

## 0. Alcance: SOLO UI

El bot **ya funciona**. Esta tarea cambia únicamente cómo se **ve** el chat. Está prohibido:

- Tocar la lógica del bot: llamadas a la API, estados, manejo de mensajes, prompts, errores, historial, streaming.
- Cambiar textos existentes ("Asistente CONSTR-ART", "Te ayuda con tu cotización…", "Escribe tu pregunta…", "Respondo en segundos · Basado en tu cotización", mensajes de error).
- Agregar funcionalidades nuevas (sugerencias rápidas, botón de WhatsApp, feedback, regenerar, etc.).
- Cambiar tamaños, posiciones, espaciados o la estructura del chat, salvo lo estrictamente necesario para los 4 cambios de abajo.

### Los 4 cambios

1. **Avatar de la IA**: reemplazar el ícono actual (un globo de chat sobre degradado naranja) por el nuevo avatar de marca.
2. **Ícono de enviar**: reemplazar el avión de papel por la flecha-techo.
3. **Loader de ladrillos**: una burbuja con un muro que se arma en bucle mientras se espera la respuesta.
4. **Colores de las burbujas** (mensaje del usuario y respuesta del asistente), en tema claro y oscuro.

### Evaluación de factibilidad (el agente decide)

Todo lo de esta guía es una **propuesta de diseño**. Antes de escribir código, el agente debe evaluar cada uno de los 4 cambios y reportar: **viable / viable con ajustes / no viable (con motivo)**. Si algo choca con la estructura real del chat (por ejemplo, el estado de "esperando respuesta" no se puede detectar desde la capa de UI sin tocar la lógica), debe **proponer la alternativa mínima y no implementarla sin avisar**.

## 1. Archivos que acompañan esta guía

| Archivo | Para qué sirve | Destino sugerido |
|---|---|---|
| `AiAvatar.tsx` | Avatar de la IA: la casita del logo (techo, chevrón ámbar, ventana y tres barras) reducida dentro de un círculo. Usa variables CSS, así cambia solo entre tema claro y oscuro. | `components/chat/AiAvatar.tsx` |
| `SendIcon.tsx` | Ícono de enviar (flecha cuya punta es el techo del logo). Usa `currentColor`. | `components/chat/SendIcon.tsx` |
| `BrickLoader.tsx` | Loader de ladrillos (solo marcado SVG). | `components/chat/BrickLoader.tsx` |
| `chat-ui.css` | Variables de color de burbujas, del avatar y del loader, más las animaciones del loader. | CSS global (importar una sola vez) |
| `ai-avatar-light.svg`, `ai-avatar-dark.svg` | Copias descargables del avatar (referencia visual o uso fuera de React). **No** se usan en el código del chat. | `public/brand/` (opcional) |
| `send-icon.svg` | Copia descargable del ícono de enviar (referencia). | `public/brand/` (opcional) |
| `brick-loader.svg` | Copia animada del loader (referencia/vista previa; sigue el tema del sistema operativo, no el del sitio). **No** se usa en el chat. | `public/brand/` (opcional) |

**Los `.tsx` + `chat-ui.css` son la fuente de verdad.** Los `.svg` son solo para descargar o previsualizar.
**Los trazados de los íconos no se modifican.** Se pueden ajustar tamaños (props `size`) y, en el CSS, los **colores de respaldo** para que apunten a los tokens del sitio.

## 2. Diseño de cada pieza

### 2.1 Avatar de la IA (`AiAvatar`)

- **Qué es:** la **casita del logo de CONSTR-ART reducida** dentro de un círculo: techo blanco, chevrón ámbar con su base, ventana de 4 cuadros y las tres barras (ámbar, blanca, ámbar). Es el mismo ícono del logo, con las separaciones entre piezas un poco más amplias para que se lea a tamaño pequeño. No lleva elementos añadidos.
- **Dónde va:** en el **encabezado del chat** (hoy hay un cuadrado/círculo naranja con un globo de chat) y, **si las respuestas del asistente muestran un avatar al lado**, también ahí.
- **Cómo implementarlo:** reemplazar el contenedor + ícono actuales por `<AiAvatar size={N} />`, donde `N` es el **mismo tamaño** que ocupa hoy el avatar (típicamente 40–44 px en el encabezado, 32 px en mensajes). **Mantener márgenes y alineación existentes.** Quitar el degradado naranja del avatar.
- **Temas:** el modo claro usa una base carbón sin borde; el modo oscuro usa una base oscura con **aro ámbar**. Esto lo resuelven las variables `--ai-badge-bg`, `--ai-badge-ring`, `--ai-fg`, `--ai-amber`.
- **Tamaño mínimo:** 32 px. Por debajo, la ventana y las separaciones entre las barras pierden detalle. **No usar el avatar por debajo de ese tamaño.**

### 2.2 Ícono de enviar (`SendIcon`)

- **Qué es:** flecha hacia arriba, con la punta con la forma del techo del logo.
- **Dónde va:** **solo reemplaza el glifo** dentro del botón de enviar actual. **No cambiar el botón**: tamaño, forma, posición, comportamiento, estados deshabilitado/habilitado, atributos `aria`.
- **Tamaño del ícono:** 20–22 px dentro del botón.
- **Color:** hereda `currentColor` del botón. Propuesta por estado (el agente verifica contraste):

| Estado del botón | Fondo | Color del ícono |
|---|---|---|
| Con texto (habilitado) | ámbar del sitio (`--chat-user-bg`) | `--chat-user-fg` (oscuro) |
| Sin texto / deshabilitado | superficie neutra del tema | `--chat-muted` |

- **Nota:** hoy el botón parece apagado (marrón). Si el botón conserva su degradado naranja actual, el ícono debe seguir viéndose con contraste ≥ 3:1. **Alinear el fondo del botón al ámbar del sitio es una recomendación**: si el agente lo considera consistente con el diseño actual, hacerlo y reportarlo; si tiene dudas, dejar el fondo como está y reportarlo.

### 2.3 Loader de ladrillos (`BrickLoader`)

- **Qué es:** un muro de 3 hileras (11 ladrillos) que se va armando ladrillo por ladrillo y luego se desarma, en bucle (2.2 s por vuelta; el muro completo queda visible ~0.6 s antes de deshacerse). Comunica "se está construyendo la respuesta".
- **Dónde va:** dentro de una **burbuja con el estilo de las burbujas del asistente** (mismo fondo, borde, radio y alineación izquierda), en el lugar donde luego aparece la respuesta. Altura de la burbuja: ~48 px (el loader mide 36 px).
- **Cuándo se muestra:** **solo mientras se espera la respuesta**, a partir de que se envía el mensaje. Cuando llega la respuesta, la burbuja de carga se **reemplaza** por la respuesta con un fade corto (≈ 200–300 ms, solo `opacity`).
- **Si el chat ya muestra algún indicador de "escribiendo" o "cargando"**, reemplazarlo por este. No mostrar los dos.
- **Tiempo mínimo visible (recomendación, evaluar factibilidad):** que el loader permanezca **al menos ~700 ms** aunque la respuesta llegue antes, para que no sea un destello y se alcance a ver el muro. Esto debe resolverse **solo en la capa de presentación** (por ejemplo, al renderizar el mensaje pendiente) **sin modificar la lógica del bot**. Si no se puede sin tocar esa lógica, **omitirlo y reportarlo**.
- **No agregar** textos de estado ("Pensando…", "Revisando tu cotización…"). El loader va solo.
- **Accesibilidad:** el componente ya incluye `role="status"` y un texto `sr-only` ("El asistente está respondiendo…"). Verificar que la clase `sr-only` exista (Tailwind la trae).
- **Rendimiento:** solo anima `opacity` y `transform` (CSS), sin JavaScript por cuadro, sin librerías, ~1 KB. Debe **desmontarse** cuando llega la respuesta (no dejarlo oculto animando).
- **`prefers-reduced-motion: reduce`:** el CSS ya lo convierte en un muro quieto con un pulso suave de opacidad.

### 2.4 Colores de las burbujas

Principio: **no inventar colores**. Primero mapear a los **tokens que el sitio ya tiene** (ámbar, fondo, superficie de tarjetas, borde, texto). Si algún token no existe, usar el valor de respaldo de la tabla.

| Variable | Qué colorea | Tema claro (respaldo) | Tema oscuro (respaldo) |
|---|---|---|---|
| `--chat-user-bg` | Fondo de la burbuja del **usuario** | `#FFB300` (ámbar del sitio) | `#FFB300` |
| `--chat-user-fg` | Texto de la burbuja del usuario | `#16130A` (oscuro, **no blanco**) | `#16130A` |
| `--chat-bot-bg` | Fondo de la burbuja del **asistente** y de la burbuja de carga | `#FFFFFF` | `#1F2023` |
| `--chat-bot-border` | Borde fino de la burbuja del asistente | `#E3DED1` | `#2C2E33` |
| `--chat-bot-fg` | Texto de la burbuja del asistente | `#1F2328` | `#E8E8E6` |
| `--chat-muted` | Texto secundario del chat ("Respondo en segundos…", subtítulo, íconos de acciones bajo la respuesta) | `#5C616A` | `#9A9DA4` |

Contrastes calculados de esta paleta (WCAG, mínimo 4.5:1 para texto):

| Par | Claro | Oscuro |
|---|---|---|
| Texto del usuario sobre ámbar | 10.3 | 10.3 |
| Texto del asistente sobre su burbuja | 15.8 | 13.3 |
| Texto secundario sobre burbuja del asistente | 6.2 | 6.0 |
| Ladrillos del loader sobre la burbuja (mínimo 3:1) | 4.0 y 3.3 | 9.1 y 10.6 |

Reglas:
- **Usuario:** ámbar **sólido** (sin degradado) con texto **oscuro**. Quitar el degradado naranja a rojizo actual.
- **Asistente:** superficie del tema + **borde fino**; radio, padding y sombra actuales se conservan.
- Los **íconos bajo la respuesta** (copiar, reproducir, engranaje) **no se cambian**; solo verificar que su color tenga contraste ≥ 3:1 sobre la nueva burbuja (si hoy usan un gris, mapearlo a `--chat-muted`).
- Mapeo de la variable del avatar y del loader: ver `chat-ui.css`.

### 2.5 Tema claro / oscuro

`chat-ui.css` define las variables para el **tema claro en `:root`** y las del **oscuro en un selector** `:is(.dark, [data-theme="dark"])`. **Adaptar ese selector al mecanismo real del sitio** (clase `dark`, `data-theme`, `next-themes`, etc.). No cambiar cómo funciona el cambio de tema; solo engancharse a él.

## 3. Pasos de ejecución

### Paso 0: Diagnóstico y evaluación (sin escribir código de producción)

1. Rama limpia. Detectar: App/Pages Router, versión de Tailwind, cómo se aplica el tema, dónde están los componentes del chat.
2. Ubicar en el código: (a) el encabezado del chat y su avatar, (b) las burbujas de usuario y de asistente, (c) el botón de enviar y su ícono, (d) cómo se representa hoy el estado "esperando respuesta" (si existe).
3. Anotar los **tokens de color existentes** (ámbar, fondos, bordes, texto) para el mapeo del Paso 2.
4. **Reportar la evaluación de factibilidad** de los 4 cambios (viable / con ajustes / no viable) y los ajustes que propone. Continuar con lo viable.

Commit: `chore: baseline chat ui`.

### Paso 1: Copiar los archivos

- `AiAvatar.tsx`, `SendIcon.tsx`, `BrickLoader.tsx` → `components/chat/` (o la carpeta del chat si ya existe).
- `chat-ui.css` → importarlo **una sola vez** en el CSS global.
- `.svg` descargables → `public/brand/` **solo si se quieren conservar como referencia**; no son necesarios para el funcionamiento.
- **No modificar los trazados** de los íconos ni la geometría del loader. En el avatar, el logo es la fuente: no redibujarlo ni "mejorarlo".

Commit: `feat(chat-ui): add assets`.

### Paso 2: Variables de color

- En `chat-ui.css`, hacer que las variables `--chat-*` apunten a los **tokens del sitio** donde existan (por ejemplo `--chat-user-bg: var(--amber)`) y dejar los valores de respaldo donde no.
- Ajustar el selector del tema oscuro al real.
- Verificar en ambos temas con una captura.

Commit: `feat(chat-ui): color variables`.

### Paso 3: Burbujas

- Aplicar `--chat-user-bg` / `--chat-user-fg` a la burbuja del usuario, y `--chat-bot-bg` / `--chat-bot-border` / `--chat-bot-fg` a la del asistente, **usando las clases/estructura que ya existen** (cambiar colores, no estructura).
- Colorear con `--chat-muted` el texto secundario ("Respondo en segundos…", subtítulo).

Commit: `feat(chat-ui): bubble colors`.

### Paso 4: Avatar

- Reemplazar el avatar del encabezado (y el de mensajes, si existe) por `<AiAvatar size={…} />` con el mismo tamaño que el actual.

Commit: `feat(chat-ui): ai avatar`.

### Paso 5: Ícono de enviar

- Reemplazar solo el glifo por `<SendIcon size={20} />` y asignar los colores por estado de la sección 2.2. Mantener el botón intacto.

Commit: `feat(chat-ui): send icon`.

### Paso 6: Loader

- Mostrar `<BrickLoader />` dentro de una burbuja del asistente mientras se espera la respuesta, según la sección 2.3.
- Aplicar el tiempo mínimo y el fade solo si es factible en la capa de UI.

Commit: `feat(chat-ui): brick loader`.

### Paso 7: Verificación

Probar en **tema claro y oscuro**, en 360, 390, 768 y 1280 px de ancho.

**Visual**
- [ ] El avatar se ve nítido, sin deformarse, en el encabezado (y en mensajes si aplica), en ambos temas.
- [ ] El ícono de enviar se ve con buen contraste en los dos estados (con y sin texto), en ambos temas.
- [ ] La burbuja del usuario es ámbar sólido con texto oscuro; sin degradado naranja en ningún lado del chat que no se haya pedido cambiar.
- [ ] La burbuja del asistente tiene fondo y borde del tema; el texto se lee bien.
- [ ] El loader se ve dentro de una burbuja del asistente, con los ladrillos visibles (más oscuros en tema claro).

**Comportamiento**
- [ ] El loader aparece al enviar y **desaparece al llegar la respuesta**, reemplazado por ella, sin saltos bruscos del chat.
- [ ] Con respuesta rápida, el loader no es un destello (si se implementó el tiempo mínimo).
- [ ] No quedan loaders montados ni animando después de la respuesta.
- [ ] `prefers-reduced-motion: reduce`: muro quieto con pulso suave.
- [ ] El bot funciona exactamente igual que antes: enviar, recibir, errores, historial.

**Técnica**
- [ ] Contrastes ≥ 4.5:1 en texto y ≥ 3:1 en íconos y ladrillos, medidos en ambos temas.
- [ ] Sin warnings de TypeScript/ESLint ni de hidratación; `npm run build` pasa.
- [ ] CLS no empeora.

## 4. Qué NO hacer

- No tocar lógica del bot, API, estados, prompts ni manejo de errores.
- No agregar funcionalidades ni cambiar textos.
- No modificar los trazados de los íconos ni la geometría del loader.
- No usar GIF, video, Lottie, canvas ni librerías de animación para el loader.
- No usar los `.svg` de `public/brand/` dentro del chat: se usan los componentes `.tsx`.
- No dejar el degradado naranja en las burbujas, el avatar o el botón sin informarlo.
- No inventar colores: usar los tokens del sitio y, si faltan, los valores de respaldo de este documento.
- No cambiar el tamaño o el layout del chat más allá de lo necesario.

## 5. Entrega

Responder con:
1. Diagnóstico del Paso 0 y la **evaluación de factibilidad** de los 4 cambios.
2. Archivos creados / modificados.
3. Mapeo final de colores (variable → token del sitio o valor de respaldo) para ambos temas.
4. Capturas o descripción de: encabezado con el avatar, burbujas, botón de enviar (con y sin texto) y loader, en tema claro y oscuro.
5. Resultado de la verificación (en especial: el bot sigue funcionando igual).
6. Decisiones tomadas por ambigüedad y cualquier punto **no implementado** con su motivo (por ejemplo, el tiempo mínimo del loader).

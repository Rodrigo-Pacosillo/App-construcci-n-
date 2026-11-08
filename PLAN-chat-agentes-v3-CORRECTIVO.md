# Plan correctivo v3 — Que los 3 agentes de chat funcionen de verdad

> **Destinatario:** agente de código. **Contexto:** la v2 (`PLAN-chat-agentes-v2.md`) se implementó a medias y `docs/chat-v2-decisiones.md` afirma "Fases 0-9 completadas", pero **el producto no se comporta como se pidió**. Este documento parte de un **diagnóstico verificado leyendo el código** (archivo y línea aproximada en cada hallazgo) y define arreglos con criterios de aceptación comprobables.
> **Regla de oro:** una tarea solo está "hecha" cuando pasa su criterio de aceptación **en el navegador y en la BD**, no cuando compila. `tsc`/`lint` en verde NO demuestran nada aquí: casi todos los bugs de abajo compilan.

---

## 0. Reglas de trabajo

1. Rama nueva desde la actual: `fix/chat-agentes-v3`. Una fase = un commit.
2. **Corrige primero `docs/chat-v2-decisiones.md`**: marcar como "NO implementado / defectuoso" lo que figura aquí en §2. No volver a declarar "completado" sin ejecutar el guion de QA de §7.
3. Antes de cada fase correr: `npx prisma validate`, `npx tsc --noEmit`, `npm run lint`, `npm test`. Después de cada fase ejecutar el tramo correspondiente del guion de QA (§7).
4. Todo texto visible al usuario y todo prompt va en **español con tildes y ñ** ("cotización", "construcción", "mañana", "español"). Hoy hay cadenas en ASCII sin tildes (ver B10); no replicar ese estilo.
5. No introducir dependencias nuevas salvo que se indique. Verificar en `node_modules/ai` las APIs de `ai@7` antes de usarlas (cada tarea trae un plan B).
6. Eliminar código muerto **de la fase** al terminarla (lista en §6, Fase 9).

---

## 1. Cómo confirmar la causa en 5 minutos (hacer ANTES de tocar nada)

Ejecutar en la BD de desarrollo tras pedirle al agente admin "agenda una visita a <cliente> mañana a las 10":

```sql
select herramienta, estado, creado_en from chat_acciones order by creado_en desc limit 10;
select session_id, agente, titulo, mensaje_count, expira_en, creado_en from chat_sesiones order by creado_en desc limit 20;
select titulo, tipo, fecha_inicio, cliente_id, obra_id, creado_por_usuario_id from eventos_calendario order by creado_en desc limit 10;
```

- **Si `chat_acciones` tiene filas `pendiente`** → la herramienta SÍ funcionó y falla la **tarjeta** (B02/B03). Es el caso más probable.
- **Si no hay filas** → el modelo no llamó la herramienta o Zod rechazó los argumentos (B14). En el navegador, DevTools → Network → respuesta de `/api/chat` → buscar eventos `tool-output-error` / `tool-input-error`.
- `chat_sesiones` con muchas filas, `titulo` NULL y `expira_en` NULL → confirma B04, B05, B09.

---

## 2. Hallazgos verificados (causa raíz → síntoma que usted describió)

### Lo que usted reportó

| ID | Síntoma | Causa raíz verificada | Archivo |
|---|---|---|---|
| **B01** | En la página de éxito de cotización aparecen burbujas "Ver avance de mi obra", "Mis próximos eventos"… que no corresponden a un visitante | Las sugerencias están **fijas en el frontend**: `esAdmin ? [admin…] : [cliente…]`. El chat público no es admin, así que recibe las de cliente. El servidor sí calcula `sugerencias` para el público, pero **nunca las envía** (el `__INICIO__` solo emite texto) | `components/chat/ChatPanel.tsx` (~L806) · `api/chat/route.ts` (`__INICIO__`) |
| **B02** | El agente dice "confírmelo" pero **no aparece ningún contenedor** con botones | `extraerAccionCalendario()` en el frontend exige `output.resumen` **dentro del resultado de la tool**, y `resumen.tipo` ∈ {`nota`,`visita`}. Las tools nuevas devuelven `{estado, pendiente, accionId, mensaje}` **sin `resumen`**, y la admin usa `tipo:"evento"`. El parser devuelve `null` siempre → **jamás se pinta tarjeta** | `ChatPanel.tsx` (`extraerAccionCalendario`) · `tools/admin/proponer_evento_calendario.ts` · `tools/cliente/proponer_nota_calendario.ts` |
| **B02b** | Igual para "cambiar estado de cotización" | `proponer_cambio_estado_cotizacion` ni siquiera devuelve `accionId`/`pendiente` con la forma que el parser entiende, y su `resumen` no tiene `tipo` | `tools/admin/proponer_cambio_estado_cotizacion.ts` |
| **B03** | Aunque la tarjeta apareciera, el **cliente no podría confirmar** | `TarjetaAccionCalendario` llama siempre a `/api/admin/chat-acciones/…` (solo admin → 403 para cliente). Existe `/api/chat-acciones/[id]/confirmar` pero la tarjeta no lo usa | `components/chat/TarjetaAccionCalendario.tsx` (~L74) |
| **B04** | En cuenta de usuario, "Nuevo chat" no genera el saludo; el chat queda vacío | `ChatShell.nuevoChat()` hace `POST /api/chat/sesiones`, recibe `saludo` y `sugerencias` y **los descarta**; solo guarda `sessionId`. Luego `ChatPanel` carga el historial de esa sesión (vacío: el POST no persiste el saludo). Además, cuando el propio `ChatPanel` inicia una sesión (`iniciarChat`) crea un UUID que `ChatShell` nunca conoce, y la lista **no se refresca** | `ChatShell.tsx` · `api/chat/sesiones/route.ts` · `ChatPanel.tsx` (`iniciarChat`) |
| **B05** | Todos los chats se llaman "Sin título" | **Nada asigna `titulo`** (solo existe el renombrar manual). Se acordó "primer mensaje recortado a 60" y no se implementó | `api/chat/route.ts`, `lib/ai/sesiones.ts` |
| **B06** | En admin no hay barra lateral de sesiones | `AdminSidebar` monta `<ChatPanel esAdmin />` directamente, no `ChatShell`. (Solo el cliente usa `ChatShell`) | `components/admin/AdminSidebar.tsx` (~L305) |
| **B07** | (Latente, grave) en `/admin/chat` el modal de supervisión abre `ChatShell` con la sesión de OTRO usuario | Muestra la lista de sesiones del admin, y permite **escribir** en la sesión ajena (la ruta autoriza a cualquier admin). Las propuestas quedan atribuidas al dueño de la sesión, no a quien escribe | `components/admin/AdminChatModal.tsx` · `api/chat/route.ts` (rama `else if (sesion.usuarioId)`) |
| **B15** | Cliente "no puede crear nota" o la crea invisible | `proponer_nota_calendario` llama `resolverObra("")`; si el cliente no tiene obra devuelve `ninguno` y la tool se rinde. Con `sinObra` fuerza `visibleCliente=false` → **el cliente no vería su propia nota**. Además deja al modelo decidir `visibleCliente` | `tools/cliente/proponer_nota_calendario.ts` |
| **B16** | "No hay nada en la UI del calendario" (aun con evento creado) | La página del cliente solo lista eventos a través de `obras.eventosCalendario`: **las notas con `clienteId` y sin obra nunca se muestran**. El calendario admin deriva el nombre del cliente solo de `e.obra` | `app/cliente/calendario/page.tsx` · `app/admin/(panel)/calendario/actions.ts` |

### Otros bugs que usted no vio

| ID | Problema | Archivo |
|---|---|---|
| **B08** | `sessionStorageKey` usa `chat_admin_${id}` **también para clientes**; el admin sin sesión comparte una clave global `chat_admin` | `ChatPanel.tsx` (~L224) |
| **B09** | `route.ts` (713 líneas) **ignora los módulos nuevos**: `obtenerOCrearSesionPublica`, `construirHistorial`, `RATE_LIMIT_POR_HORA` y `expiraEn` no se usan (código muerto). Consecuencias: el chat público **no expira a las 24 h**, cada recarga puede crear sesión y saludo nuevos, no hay límite por hora, el historial sigue con el hack `⟦tool⟧…` truncado a 600 chars, `onFinish` solo ve el último paso, no hay `abortSignal` ni `onError`, y `GET /api/chat` no devuelve acciones ni sugerencias (las tarjetas se pierden al recargar) | `api/chat/route.ts` |
| **B10** | **Mojibake**: `route.ts` contiene texto doblemente codificado ("SesiÃ³n de chat no encontrada", "lÃ­mite", "tÃ©cnico"…, 30 ocurrencias). Esos mensajes de error llegan así al usuario. Además saludos, prompts, resolvers y tools están en **ASCII sin tildes** ("Construccion", "manana", "espanol") | `api/chat/route.ts` y `lib/ai/**` |
| **B11** | **Saludos con datos falsos/vacíos.** Admin: `construirSaludoAdmin({nombre})` sin datos → siempre "0 cotizaciones nuevas (la más antigua, hace 0 días)…" (afirma algo falso) y el nombre sale "Admin". Cliente: `obras take 1` sin `orderBy`, estado crudo (`en_curso`), sin próximo evento. Público: sugerencias genéricas, no las reglas por dato | `route.ts` (`__INICIO__`) · `api/chat/sesiones/route.ts` · `lib/ai/saludos/*` |
| **B12** | **`agents.ts` sigue usando sus constructores de prompt antiguos** (L451/520/583); los nuevos `prompts/*.ts` se importan y **no se llaman**. Resultado: enums crudos (`m50_100`) y la fila completa de cotización (con `notasInternas`, `montoEstimado`) llegan al modelo. `agents.ts` conserva ~370 líneas de tools legacy muertas | `lib/ai/agents.ts` |
| **B13** | El saludo se guarda como mensaje `assistant` y entra al historial del modelo como **primer mensaje** (no se pliega al system prompt como se acordó) → riesgo de rechazo por plantilla de chat y de re-saludo | `route.ts` |
| **B14** | `fechaInicio: z.string().datetime()` sigue exigido (H04 sin resolver): el modelo debe emitir ISO UTC con `Z`; cualquier otro formato falla la validación **en silencio**. No existe parámetro `tipo`: el ejecutor usa `args.tipo ?? "nota"`, así que **toda "visita" se guarda como nota** | tools de calendario · `acciones/ejecutar.ts` |
| **B17** | `proponer_cambio_estado_cotizacion` guarda `precondiciones.estadoActual`; el ejecutor lee `precondiciones.estadoAnterior` → **la verificación de cambio concurrente nunca corre** | tool + `acciones/ejecutar.ts` |
| **B18** | El ejecutor no hace `revalidatePath` ni la tarjeta `router.refresh()`: el calendario no se actualiza solo | `acciones/ejecutar.ts` |
| **B19** | `chatInicioSchema` y el body de `__INICIO__` aún mandan `clienteId/cotizacionId/clienteNombre/cotizacionData` que el servidor ignora (la página de éxito también los pasa) | `ChatPanel.tsx`, `validators/chat.ts`, `cotizacion/exito/page.tsx` |
| **B20** | `compactarParaModelo` borra claves con regex `/^id$|Id$|accionId|ui$/i`: con `/i`, `ui$` elimina **cualquier** clave que termine en "ui" y `Id$` las que terminen en "id" | `tools/index.ts` |
| **B21** | `resolverObra`: coincidencia laxa (`norm.split(" ").some(...)`) → falsos positivos; etiqueta con estado crudo `(en_curso)`; con varias obras y texto vacío devuelve `ambiguo` incluso para operaciones de nivel cliente | `datos/resolvers/obra.ts` |
| **B22** | El parser de stream **ignora** `tool-output-error`/`tool-input-error`: si una tool falla, el usuario ve "no hace nada" | `ChatPanel.tsx` (`leerStreamUI`) |
| **B23** | `__INICIO__` responde con un stream falso (`text-delta` sin `text-start`/`text-end`) solo para devolver un texto fijo | `route.ts` |

> **No revisado a fondo:** el cuerpo de cada tool de lectura (`mi_obra`, `ficha_cliente`, etc.), `prompts/cliente.ts` y `prompts/admin.ts`, evals y Playwright. La Fase 8 obliga a probarlos.

---

## 3. Diseño objetivo (lo que debe quedar funcionando)

### 3.1 Comportamiento por agente

| | **Público** (página de éxito) | **Cliente** (con login) | **Admin** |
|---|---|---|---|
| Objetivo | Resolver dudas y mantener el interés | Ayuda práctica y acciones propias | Lectura potente y acciones con confirmación |
| Saludo (sin LLM) | Resumen de **su cotización** con tildes y valores en `` `backticks` `` | Saludo + **snapshot real** (obra, avance, próximo evento) + qué puede hacer | Saludo con su nombre + **pendientes reales** + qué puede hacer |
| Burbujas (chips) | **Del servidor**: 2–3 según los datos de la cotización | **Del servidor**: según tenga o no obra | **Del servidor** |
| Sesiones | **1 sola, vigencia 24 h**, sin lista | Varias, barra lateral | Varias, barra lateral |
| Acciones | Ninguna | Nota en su calendario (tarjeta) | Evento/visita y cambio de estado (tarjeta) |

### 3.2 Contratos compartidos (crear `src/lib/ai/chat/tipos.ts` y usarlos en servidor Y cliente)

```ts
export type EstadoAccion = "pendiente" | "ejecutando" | "ejecutada" | "rechazada" | "fallida" | "expirada";

export type ResumenAccion =
  | {
      tipo: "evento";
      subtipo: "nota" | "visita_tecnica" | "recordatorio" | "reunion";
      titulo: string;
      descripcion?: string | null;
      cliente: string;            // "Nombre Apellidos"
      obra: string | null;        // etiqueta legible o null
      cuando: string;             // ya formateado en TZ del negocio: "jue 12 nov 2026, 10:00"
      fecha: string;              // "YYYY-MM-DD" (editable)
      hora: string | null;        // "HH:mm" (editable) | null si todo el día
      visibleCliente: boolean;    // editable
    }
  | { tipo: "cambio_estado"; cliente: string; cotizacion: string; estadoActual: string; estadoNuevo: string };

export type AccionUI = {
  accionId: string;               // solo viaja por el canal de UI, nunca al modelo
  herramienta: "proponer_evento_calendario" | "proponer_nota_calendario" | "proponer_cambio_estado_cotizacion";
  estado: EstadoAccion;
  expiraEn: string | null;
  resumen: ResumenAccion;
  error?: string | null;
};

export type MensajeDTO = {
  id: string;
  rol: "user" | "assistant";
  contenido: string;
  creadoEn: string;
  sugerencias?: string[];         // solo en el saludo
  accionIds?: string[];
};

export type AgenteUI = { id: "publico" | "cliente" | "admin"; etiqueta: string; descripcion: string };

export type InicioResponse = {
  sessionId: string;
  agente: AgenteUI;
  mensajes: MensajeDTO[];
  acciones: AccionUI[];
  sugerencias: string[];          // vacío si ya hubo mensajes del usuario
  expiraEn: string | null;        // solo público
  soloLectura?: boolean;          // supervisión admin
};
```

**Salida de las tools de escritura (única forma válida):**
```ts
{ estado: "ok", pendiente: true, ui: { tipo: "accion", accion: AccionUI }, mensaje: "Se mostró una tarjeta de confirmación al usuario." }
```
`toModelOutput` entrega al modelo solo `{ estado, pendiente, mensaje }` (sin `ui`, sin IDs). **El frontend lee `output.ui.accion`.** Para desambiguación: `{ estado: "ambiguo", ui: { tipo: "opciones", titulo, opciones: [{ etiqueta }] }, sugerencia }`.

---

## 4. Fases

### Fase 1 — Codificación y textos (mecánica, riesgo bajo, hacer primero)

- **T1.1** Reparar el mojibake de `api/chat/route.ts` y cualquier otro archivo afectado: detectar con `grep -rnE "Ã|Â|â€|âŸ|â†" src`. Corregir re-decodificando (p. ej. `s.encode('latin-1').decode('utf-8')` por segmento) y revisar el diff a mano. Guardar en UTF-8 sin BOM.
- **T1.2** Restaurar tildes y ñ en **todas** las cadenas de `lib/ai/**` (saludos, prompts, resolvers, tools, mensajes de error): "cotización", "construcción", "mañana", "español", "días", "próximo", "técnico", "límite", "Sesión"…
- **T1.3** Añadir un test (Vitest/`node:test`) que falle si algún `.ts/.tsx` de `src` coincide con el regex de mojibake, y otro que falle si en `lib/ai/prompts|saludos` aparecen las palabras `manana|espanol|cotizacion|construccion|dias` sin tilde.
- **Aceptación:** provocar un 404 de sesión y un límite de mensajes muestra "Sesión de chat no encontrada" / "límite" bien escritos; los tests anteriores pasan.

### Fase 2 — Contratos y datos compartidos

- **T2.1** Crear `lib/ai/chat/tipos.ts` (§3.2).
- **T2.2** Extraer consultas reutilizables (una sola fuente para tool y saludo):
  - `lib/ai/datos/pendientes.ts` → `obtenerPendientes()`: cotizaciones `nuevo` (conteo + antigüedad en días de la más antigua), eventos de hoy (TZ negocio), obras `en_curso`, materiales bajo `stockMinimo`, herramientas con préstamo sin devolver. Úsela `pendientesTool` **y** `construirSaludoAdmin`.
  - `lib/ai/datos/resumenCliente.ts` → `obtenerResumenCliente(clienteId)`: obra principal (`en_curso` primero, luego `fechaInicio desc`), `progreso`, estado **con etiqueta**, próximo evento visible (por `clienteId` **o** `obra.clienteId`), cotizaciones abiertas. Úsela `mi_resumen` **y** `construirSaludoCliente`.
  - `lib/ai/datos/cotizacionPublica.ts` → `vistaCotizacionPublica(id)`: DTO con etiquetas (`TIPO_OBRA_LABELS`, etc.), `ubicacionObra`, `requerimiento` recortado (≤200, sin saltos de línea, backticks reemplazados). **Nunca** `montoEstimado`, `notasInternas`, teléfono ni correo.
- **T2.3** Función `instanteNegocio(fecha: "YYYY-MM-DD", hora?: "HH:mm")` en `datos/formato.ts`: devuelve `Date` UTC interpretando la entrada en `TZ_NEGOCIO` (La Paz = UTC−4 fijo; implementar con `Intl` para no hardcodear el offset). Para evento de **todo el día** guardar a las **12:00 UTC** del día (así lo normaliza el calendario admin existente: `setUTCHours(12,0,0,0)`). Validar fecha real (rechazar 2026-02-31).
- **T2.4** Afinar `compactarParaModelo` (B20): regex `^(id|accionId|ui)$` y `/Id$/` **sin** `i`.
- **Aceptación:** tests unitarios de `instanteNegocio` (10:00 La Paz ⇒ 14:00Z; todo el día ⇒ 12:00Z), `obtenerPendientes` y `obtenerResumenCliente` contra seed.

### Fase 3 — Backend: sesiones, saludo, ruta de chat

**3.1 Saludos con datos reales** (`lib/ai/saludos/*`) — plantillas en §5. Funciones **puras** que reciben un DTO ya armado (sin consultas) y devuelven `{ texto, sugerencias }`. Omitir líneas sin dato (nada de "0 días" ni "No especificada" inventado).

**3.2 Sugerencias del público por regla** (en `saludos/publico.ts`, según los datos de la cotización):
1. `tipoConstruccion = no_sabe` → "¿Qué sistema me conviene: construcción en seco o tradicional?"
2. `plazoInicio = lo_antes_posible` → "¿Cuánto tarda una obra como la mía?"
3. `tipoObra = ampliacion` → "¿Cómo se hace una ampliación en seco?"
4. `rangoM2 = mas_200` → "¿Cómo se organizan los proyectos grandes?"
5. sin `ubicacionObra` → "¿En qué zona puede construir Constr-art?"
6. relleno → "¿Qué pasa después de enviar mi cotización?"
Máximo 3. **Nunca** sugerencias de cliente/admin en el público.

**3.3 Sesiones** (`lib/ai/sesiones.ts` — usar de verdad lo que ya existe):
- **Público:** `__INICIO__` con token → `obtenerOCrearSesionPublica(cotizacionId)`; si la sesión existe y no expiró **no** crea otra ni re-saluda; devuelve su historial. Si `expiraEn < ahora` → marcar `cerrada` y responder **410 `SESION_EXPIRADA`**. Aplicar la misma comprobación en `POST` y `GET`.
- **Cliente/admin: creación perezosa** (acordado en el riesgo 4): "Nuevo chat" **no** crea fila. Se muestra un **borrador** con el saludo; la sesión se crea al **primer mensaje del usuario** (§3.5). Evita sesiones vacías y el "Sin título".
- **Título automático** en el servidor al crear la sesión: primer mensaje del usuario, colapsado a una línea y recortado a 60 caracteres. Sin LLM.
- Limpieza: sesiones cliente/admin con 0 mensajes de usuario y > 24 h → borrar al listar (perezoso).

**3.4 Endpoints**

| Ruta | Comportamiento |
|---|---|
| `POST /api/chat` `{ mensaje:"__INICIO__", t }` | **Solo público.** Responde **JSON `InicioResponse`** (no stream). Elimina el stream falso (B23). |
| `GET /api/chat/saludo?agente=cliente\|admin` | Saludo + sugerencias + `AgenteUI` **sin persistir** (para el borrador). |
| `POST /api/chat` `{ mensaje, sessionId \| null, agente? }` | Si `sessionId` es `null` (solo cliente/admin autenticados): crea sesión, **persiste el saludo regenerado** como primer mensaje `assistant` (`metadatos: { tipo:"saludo", sugerencias }`), asigna `titulo`, procesa el mensaje y responde en stream con el header **`X-Chat-Session-Id`**. |
| `GET /api/chat?sessionId=&cursor=` | Devuelve `InicioResponse`: mensajes (con `sugerencias` del saludo y `accionIds`), **`acciones[]` con su estado actual**, `agente`, `soloLectura`. |
| `GET /api/chat/sesiones?agente=` | Lista propia (id, título, `ultimoMensajeEn`, vista previa 1 línea). |
| `PATCH/DELETE /api/chat/sesiones/[sessionId]` | Renombrar / archivar (valida propiedad). El archivo actual usa `[id]`: **unificar el nombre del parámetro** y que su valor sea `sessionId` (hoy `ChatShell` envía `sessionId`). |
| `POST /api/chat/sesiones` | **Eliminar** (reemplazado por la creación perezosa). |

**3.5 Reglas de escritura/lectura**
- `POST /api/chat`: solo el **dueño** puede escribir (`sesion.usuarioId === session.user.id`); un admin **no** escribe en sesiones ajenas (B07). `ToolContext.usuarioId` = **quien escribe** (el de la sesión autenticada).
- `GET /api/chat`: el admin puede **leer** sesiones ajenas con `soloLectura: true`.
- Rate limit cliente/admin: contar mensajes `user` de la última hora del usuario (`chatMensaje.count({ where:{ rol:"user", creadoEn:{ gte }, sesion:{ usuarioId } } })`) contra `RATE_LIMIT_POR_HORA` → `429 SESION_LIMITE`. Usar el límite por sesión existente solo para público.

**3.6 Historial y persistencia (simplificar, no complicar)**
- Historial del modelo = **texto plano** de los últimos `VENTANA_HISTORIAL` mensajes (`contenido`), roles `user`/`assistant`. **No reinyectar resultados de tools** (se elimina el hack `⟦tool⟧`; el modelo vuelve a consultar si lo necesita; además ahorra tokens). Documentar la decisión.
- **Excluir el saludo del historial** y **plegarlo al system prompt** (bloque dinámico final): `Mensaje inicial ya enviado al usuario: "…". No vuelva a saludar.` (B13). El historial empieza siempre en el primer `user`.
- Colapsar mensajes consecutivos del mismo rol (ya existe en `historial.ts`; úselo en vez de la copia inline de `route.ts`, y simplifique `historial.ts` para no depender de `convertToModelMessages`).
- Persistir la respuesta en `onFinish({ steps, usage })` (verificar tipos en `ai@7`): `contenido` = texto de **todos** los pasos concatenado y sin `<think>`; `metadatos` = `{ accionIds, usage }`, donde `accionIds` sale de los `toolResults` de todos los pasos con `output.ui?.tipo === "accion"`. Plan B si `steps` no existe: recolectar en un `onStepFinish`.
- Añadir `abortSignal: req.signal`, `onError` (log + mensaje controlado) y, si el stream falla, guardar un `assistant` de error corto para no dejar dos `user` seguidos.
- Eliminar de `route.ts`: funciones `aiTool`, `crearChatAccion`, `nombreDeCliente`, `mensajeObraNoResuelta`, `persistirRespuestaAsistente` antigua, `limpiarRespuestaIA` duplicada (queda una sola). Objetivo: `route.ts` ≤ ~250 líneas.

- **Aceptación F3:** (a) abrir 5 veces la página de éxito ⇒ 1 sola fila `chat_sesiones` pública con `expira_en` = creada+24 h y 1 solo saludo; a las 24 h responde 410. (b) Cliente: clic en "Nuevo chat" ⇒ **0 filas nuevas** hasta escribir; al escribir se crea 1 fila con `titulo` = primer mensaje. (c) El historial enviado al modelo nunca empieza con `assistant`. (d) 31 mensajes cliente en una hora ⇒ 429.

### Fase 4 — Herramientas de calendario/estado y ejecutor

**4.1 `proponer_evento_calendario` (admin)** — nuevo `inputSchema`:
```ts
z.object({
  cliente: z.string().min(2).describe("Nombre, apellido, teléfono o correo del cliente"),
  obra: z.string().optional().describe("Nombre o dirección de la obra, solo si el admin la mencionó"),
  tipo: z.enum(["nota", "visita_tecnica", "recordatorio", "reunion"]).default("nota"),
  titulo: z.string().min(1).max(120),
  descripcion: z.string().max(2000).optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("YYYY-MM-DD en hora de Bolivia"),
  hora: z.string().regex(/^\d{2}:\d{2}$/).optional().describe("HH:mm 24 h; omitir si es todo el día"),
  visibleCliente: z.boolean().optional(),
})
```
- Resolver cliente (`resolverCliente`) y, **solo si `obra` viene con texto**, `resolverObra`. Si `obra` está vacía y el cliente tiene **exactamente 1** obra activa, usarla y **mostrarla en la tarjeta** (se puede rechazar); si tiene varias → devolver `ambiguo` con tarjeta de opciones; si ninguna → evento sin obra.
- `visibleCliente` por defecto: `true` para `visita_tecnica` y `reunion`; `false` para `nota` y `recordatorio`; sin obra ⇒ `false`. **Editable en la tarjeta** (4.4), por lo que el modelo ya no necesita preguntar.
- Calcular `fechaInicio` con `instanteNegocio`. Si la fecha es pasada → devolver `{ estado: "fecha_pasada", mensaje }` para que el modelo pregunte.
- Crear `ChatAccion` con: `argumentos` = `{ clienteId, obraId, tipo, titulo, descripcion, fecha, hora, visibleCliente }`, `resumen: ResumenAccion` (§3.2), `precondiciones: { clienteExiste: true }`, `expiraEn` = ahora + `ACCION_EXPIRACION_MIN`.
- **Devolver la forma única de §3.2** (`ui.accion`).

**4.2 `proponer_nota_calendario` (cliente)** — schema sin `cliente`, sin `visibleCliente`, sin `sinObra`: `titulo`, `descripcion?`, `fecha`, `hora?`, `obra?` (solo si la mencionó). `clienteId` siempre de `ctx`. `obra` vacía ⇒ **sin obra, sin preguntar** (B15); con texto ⇒ `resolverObra(texto, { clienteId })`. La nota del cliente es **siempre `visibleCliente: true`** y `tipo: "nota"`.

**4.3 `proponer_cambio_estado_cotizacion`** — recibe texto (`cliente` + `referencia?`), usa `resolverCotizacion`. `precondiciones: { estadoAnterior: cot.estado }` (**mismo nombre que lee el ejecutor**, B17). `resumen: { tipo:"cambio_estado", cliente, cotizacion, estadoActual: <etiqueta>, estadoNuevo: <etiqueta> }`. Validar transición aquí (no volver de `contratado` a `nuevo`; `contratado` exige contrato no anulado, con mensaje legible).

**4.4 Ejecutor** (`acciones/ejecutar.ts`):
- Aceptar `cambios?: { titulo?, fecha?, hora?, visibleCliente? }` (validados con Zod; rechazar claves extra) y fusionarlos en `argumentos` **antes** de ejecutar. Para `cambio_estado` no hay `cambios`.
- Crear el evento con `tipo` real (`args.tipo`), `clienteId` (del `actor` si es cliente), `fechaInicio = instanteNegocio(fecha, hora)`, `todoElDia = !hora`, `visibleCliente` (cliente ⇒ `true`; admin sin obra ⇒ `false`), `creadoPorUsuarioId: actor.usuarioId`.
- Hacer el `create` del evento y el `update` de estado a `ejecutada` en **una `$transaction`**.
- Tras ejecutar: `revalidatePath("/cliente/calendario")`, `revalidatePath("/admin/calendario")`, `revalidatePath("/admin/cotizaciones")` (B18).
- Verificar que el enum `TipoEventoCalendario` tenga `visita_tecnica`; si no, añadir migración aditiva.
- `rechazarChatAccion`: igualar la validación de propiedad (cliente solo las suyas).
- **Endpoint único** `POST /api/chat-acciones/[id]/(confirmar|rechazar)` que deduce el actor (admin o cliente) de la sesión; mantener las rutas `/api/admin/chat-acciones/...` como alias que delegan.

**4.5 Páginas de calendario (B16):**
- `cliente/calendario/page.tsx`: consultar **eventos** con `where: { visibleCliente: true, OR: [{ clienteId }, { obra: { clienteId } }] }`, independientes de la obra seleccionada; la obra pasa a ser un **filtro opcional**. Leer `CalendarioGrid.tsx` y adaptarlo para recibir `eventos` planos.
- `admin/(panel)/calendario/actions.ts`: incluir `cliente` directo en el `include` y resolver `clienteNombre = e.cliente ?? e.obra?.cliente`; marcar visualmente notas con `creadoPor.rol === "cliente"` como "Nota del cliente".
- Escribir **un único** helper `crearEventoCalendario(input)` (valida `visibleCliente` explícito) y que lo usen el ejecutor, el admin del calendario y el seed.

- **Aceptación F4:** "agenda una visita a `<cliente>` mañana a las 10" ⇒ fila `chat_acciones.pendiente` con `resumen.tipo="evento"`, `subtipo="visita_tecnica"`, `hora="10:00"`; tras confirmar, fila en `eventos_calendario` con `tipo=visita_tecnica`, `fecha_inicio` = mañana 14:00Z, `cliente_id` correcto; aparece en `/admin/calendario` **sin recargar manualmente** y, si es visible, en `/cliente/calendario`. Nota del cliente sin obra aparece en **su** calendario. Doble clic ⇒ un solo evento.

### Fase 5 — Frontend del chat

**5.1 `ChatPanel` (refactor, mantener TTS/audio y estilos):**
- Props nuevas: `agente`, `sessionId?: string | null`, `onSesionCreada?(id)`, `onActividad?()`. Quitar `clienteId`, `cotizacionId`, `clienteNombre`, `cotizacionData`, `whatsappNumero` **de la lógica de inicio** (B19; el servidor los ignora). La página de éxito solo pasa `chatToken`.
- **Eliminar el arreglo fijo de chips.** Las sugerencias vienen de `InicioResponse.sugerencias` / `MensajeDTO.sugerencias`; se muestran **solo** bajo el saludo mientras no haya mensajes del usuario.
- Cabecera con insignia `AgenteUI.etiqueta` + `descripcion` (P11) y aviso discreto "Respuestas generadas por IA".
- Modo **borrador** (cliente/admin con `sessionId === null`): `GET /api/chat/saludo`, muestra saludo local; en el primer envío `POST /api/chat` con `sessionId: null`; leer **`X-Chat-Session-Id`** del header, llamar `onSesionCreada(id)` y seguir leyendo el stream **sin remontar** el componente.
- Público: `__INICIO__` ⇒ parsear **JSON**; manejar `410` mostrando una **tarjeta de cierre** ("Esta conversación finalizó. Escríbanos por WhatsApp o envíe otra cotización") sin campo de texto.
- Claves de storage: `chat_publico_${cotizacionId}` solo público; cliente/admin guardan el último `sessionId` activo en `localStorage` como `chat_ultimo_${agente}_${usuarioId}` (B08). Eliminar `chat_admin_*`/`chat_admin`.
- **Parser del stream:** en `tool-output-available` leer `output.ui` (`accion` | `opciones`); en `tool-output-error` / `tool-input-error` mostrar "No pude preparar la acción: <mensaje legible>" (B22). Mantener la tolerancia a `text-start/delta/end`.
- Al recargar, las tarjetas salen de `acciones[]` de `GET /api/chat`, **con su estado real** (pendiente/ejecutada/rechazada/expirada).

**5.2 Tarjeta unificada** (renombrar `TarjetaAccionCalendario` → `TarjetaAccion`):
- Muestra los campos de `ResumenAccion`:
  - **evento:** icono + tipo (Nota / Visita técnica / Recordatorio / Reunión), Título, Cliente, Obra, Fecha y hora, Visible para el cliente.
  - **cambio_estado:** Cliente, Cotización, `estadoActual → estadoNuevo`.
- **Campos editables antes de confirmar** (evento): título, fecha, hora y el interruptor "Visible para el cliente"; el envío manda `{ cambios }`. (Mínimo viable: solo el interruptor y título; fecha/hora recomendados.)
- Botones **Confirmar** / **Rechazar**; estados visibles: pendiente → "Confirmando…" → "✅ Creado" / "Rechazado" / "Expirada (30 min), pídalo de nuevo"; deshabilitada tras actuar; si falló, mostrar `error` y botón "Reintentar" solo si el estado sigue `pendiente`.
- Llama a `/api/chat-acciones/[id]/(confirmar|rechazar)` (endpoint único), y tras éxito `router.refresh()`.
- Accesible: `role="group"` con `aria-label`, foco al aparecer, botones con texto.
- Tarjeta `TarjetaOpciones` para `ui.tipo === "opciones"`: botones con cada `etiqueta`; clic ⇒ envía "Elijo: {etiqueta}" como mensaje normal.

**5.3 `ChatShell` (cliente y admin) — sincronizado:**
- Estado `panelKey` independiente de `activeId`: cambia **solo** cuando el usuario elige otra sesión o pulsa "Nuevo chat" (así el paso `null → id` por creación perezosa **no** remonta el panel).
- `onSesionCreada(id)` ⇒ `activeId = id` y refresco de la lista; `onActividad()` ⇒ refresco de la lista.
- Lista agrupada **Hoy / Ayer / Anteriores**, título o "Nueva conversación" si falta, renombrar **en línea** (no `prompt()`), archivar con confirmación, "Nuevo chat" deshabilitado si el borrador actual está vacío. En móvil la barra es un panel deslizable.
- Al montar: abrir la **última** sesión (`localStorage`) o el borrador si no hay.
- **Admin:** `AdminSidebar` debe montar `<ChatShell esAdmin />` (B06).
- **`AdminChatModal` (supervisión):** sustituir `ChatShell` por un visor **solo lectura** (`ChatSoloLectura`): carga `GET /api/chat?sessionId=`, muestra mensajes y tarjetas (sin botones), **sin** barra de sesiones **ni** campo de texto (B07).

- **Aceptación F5:** ver §7 (guion de QA, agentes Público y Cliente/Admin).

### Fase 6 — Prompts y agentes (quitar lo viejo)

- **T6.1** `agents.ts` queda **solo** con `AGENTES` (config) y `obtenerAgente`. Cada `sistemaPromptBuilder` delega en `prompts/{publico,cliente,admin}.ts`. Borrar los constructores inline y todos los `TOOL_*` legacy (B12).
- **T6.2** Los builders reciben **DTOs** (no filas de Prisma): público usa `vistaCotizacionPublica`; cliente `obtenerResumenCliente`; ninguno recibe `notasInternas`/`montoEstimado`. Etiquetas, no enums.
- **T6.3** Estructura de cada prompt: identidad → reglas comunes → política de tools del rol → ejemplos → **bloque dinámico final** (`bloqueFecha()` + datos + "mensaje inicial ya enviado"). `bloqueFecha` ya existe: usarlo.
- **T6.4** **Ejemplos obligatorios** (few-shot cortos) para que el modelo llame a las tools de calendario:
  - Admin: *"Agenda una visita a Juan Pérez mañana a las 10"* → `proponer_evento_calendario({ cliente:"Juan Pérez", tipo:"visita_tecnica", titulo:"Visita técnica", fecha:<mañana>, hora:"10:00" })`; luego una frase breve sin repetir datos.
  - Cliente: *"Anota que el viernes llega el material"* → `proponer_nota_calendario({ titulo:"Llega el material", fecha:<viernes> })`.
  - Regla: "Si tiene título y fecha, **llame a la herramienta de inmediato**; si falta uno de los dos, pregunte solo eso."
- **T6.5** Eliminar el desfase de estilo: sin voseo, sin "5. NO menciones WhatsApp…" duplicado; el público no ofrece funciones de cliente (nada de "ver mi obra").
- **Aceptación F6:** test que renderiza los 3 prompts con datos de seed y comprueba: sin enums crudos (`m50_100`, `lo_antes_posible`), sin `notasInternas`, con fecha de hoy, con tildes.

### Fase 7 — Seguridad y robustez (rápida)

- `__INICIO__` público: no aceptar campos de identidad en el body; borrar `chatInicioSchema` obsoleto.
- Token público: aceptar por header `x-chat-token` además de `?t=`/body; comparar con `Cotizacion.chatTokenIssuedEn` (revocar tokens anteriores a esa fecha).
- Mensaje de error genérico en el cliente ante 5xx, detalle solo en logs.
- Límite de longitud de mensaje (ya existe 1000) y de `descripcion` de tools.

### Fase 8 — Pruebas

- **Unit:** `instanteNegocio`; `obtenerPendientes`/`obtenerResumenCliente`; saludos (con tildes y sin líneas vacías); sugerencias públicas por regla; `ejecutarChatAccion` (claim atómico, expiración, rol, `cambios`, `estadoAnterior`); parser del stream con muestras reales de SSE (acción, opciones, error); detector de mojibake.
- **Contrato de tools:** para cada tool de escritura, ejecutar contra BD de prueba y comprobar `output.ui.accion` válida según `AccionUI`; para todas, `assertSinProhibidos(output)`.
- **Evals reales** (`tests/ai-evals/run-evals.ts`): ejecutar el agente y evaluar **tool calls** (formato en el Apéndice E del plan v2). Casos mínimos: visita mañana 10:00 (admin), nota el viernes (cliente), ambigüedad "Juan", pregunta fuera de alcance (público), intento de fuga de datos de otro cliente.
- **Playwright:** los 3 flujos del guion §7.

### Fase 9 — Limpieza final

Borrar: `lib/ai/resolver-obra.ts` y `lib/ai/ejecutar-accion.ts` (si ya nadie los importa; `grep` antes), `lib/chat/nvidia.ts`, `lib/chat/system-prompt.ts`, `POST /api/chat/sesiones`, `obtenerUsuarioIdDeSesion`, claves `chat_admin*`, props obsoletas. Actualizar `docs/arquitectura.md`, `docs/modelo-datos.md`, `AGENTS.md`, `logica_del_chat.md` y `docs/chat-v2-decisiones.md` con la verdad.

---

## 5. Plantillas de saludo (datos reales; omitir líneas vacías; valores en `` `backticks` ``)

**Público** (`vistaCotizacionPublica`):
```
¡Hola, `{nombre}`! Gracias por solicitar su cotización en Constr-art.
Esto es lo que recibimos:
• Obra: `{tipoObra}` · Construcción: `{tipoConstruccion}` · Superficie: `{rangoM2}`
• Inicio: `{plazo}` · Ubicación: `{ubicacion}`                 ← solo si existe
• Su requerimiento: `{requerimiento}`                          ← solo si existe
Nuestro equipo la revisará y le contactará en 24-48 horas hábiles. Mientras tanto, puedo resolver sus dudas.
```
(La foto del lote y el correo son opcionales: no se mencionan ni se piden.)

**Cliente** (`obtenerResumenCliente`):
```
¡Hola, `{nombre}`! Soy el asistente de su cuenta en Constr-art.
Su obra `{obra}` está `{estadoLabel}` al `{progreso}%`.        ← solo si hay obra
Su próximo evento: `{titulo}` el `{fecha}`.                      ← solo si hay evento
Puedo ayudarle a ver el avance de su obra, revisar cotizaciones, pagos y documentos, consultar su calendario, agregar notas a su calendario y resolver dudas sobre su construcción.
```
Chips: con obra → "Ver avance de mi obra", "Mis próximos eventos", "Agregar una nota a mi calendario", "Tengo una duda técnica". Sin obra → "Ver mis cotizaciones", "Mis próximos eventos", "Agregar una nota a mi calendario", "Tengo una duda sobre construcción".

**Admin** (`obtenerPendientes`; solo líneas con dato > 0; si todo es 0: "No hay pendientes ahora."):
```
Hola, `{nombre}`. Soy el asistente del panel.
Pendientes: `{n}` cotizaciones nuevas (la más antigua, hace `{dias}` días) · `{n}` eventos hoy · `{n}` obras en curso · `{n}` materiales bajo stock · `{n}` herramientas sin devolver.
Puedo consultar clientes (por nombre, teléfono o correo), cotizaciones, obras, pagos, agenda e inventario; y, con su confirmación, cambiar el estado de una cotización o agendar visitas, notas y recordatorios.
```
Chips: "Cotizaciones nuevas", "Agenda de hoy", "Estado de una obra", "Buscar un cliente".

---

## 6. Orden de ejecución recomendado

`F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8 → F9`. Hitos de valor temprano: tras **F4+F5.2** el usuario ya ve la tarjeta y los eventos se crean; tras **F3+F5.1** desaparecen las burbujas equivocadas y se arreglan sesiones/títulos.

---

## 7. Guion de QA manual (obligatorio; adjuntar resultados al PR)

**A. Público (página de éxito)**
1. Enviar una cotización completa → éxito. ✔ Saludo con tildes y datos reales, valores resaltados. ✔ Burbujas **solo** públicas (2–3, según datos). ✘ No aparece "Ver avance de mi obra".
2. Recargar 3 veces. ✔ Mismo chat e historial, **1** fila pública en `chat_sesiones`, `expira_en` ≈ +24 h.
3. Preguntar "¿cuánto cuesta?". ✔ No da precio; explica que el equipo cotiza.
4. Simular expiración (`update chat_sesiones set expira_en = now() - interval '1 min'`). ✔ Tarjeta de cierre, sin campo de texto.

**B. Cliente**
1. Entrar → abrir chat. ✔ Barra de sesiones; borrador con saludo y snapshot real.
2. "Nuevo chat" 3 veces sin escribir. ✔ **0** sesiones nuevas en BD.
3. Escribir "Anota que el viernes llega el material". ✔ Aparece **tarjeta** con título, fecha, "Visible para usted" y botones. ✔ La sesión aparece en la barra con **título = su mensaje**.
4. Confirmar. ✔ Tarjeta pasa a "✅ Creado"; fila en `eventos_calendario` con `cliente_id` propio, `visible_cliente = true`; aparece en `/cliente/calendario` aunque **no tenga obra**. Recargar el chat: la tarjeta sigue en estado "ejecutada".
5. Rechazar otra propuesta ⇒ estado `rechazada`. Esperar 30 min o forzar `expira_en` ⇒ "Expirada".
6. Pedir datos de otra persona ⇒ el agente se niega y no ejecuta tools con datos ajenos.

**C. Admin**
1. Abrir el chat del panel. ✔ **Barra de sesiones** visible. ✔ Saludo con pendientes **reales** (comparar con el panel) y nombre real.
2. "Agenda una visita a `<cliente>` mañana a las 10". ✔ Tarjeta: Visita técnica, cliente, obra (si la hay), fecha y hora correctas, interruptor de visibilidad. Confirmar ⇒ evento con `tipo = visita_tecnica` a las 14:00Z; aparece en `/admin/calendario` sin recargar manualmente.
3. Doble clic rápido en Confirmar ⇒ **1** evento.
4. "Busca a Juan" (con 2 Juan) ⇒ tarjeta/lista de opciones; clic en una ⇒ continúa.
5. "Pasa la cotización de `<cliente>` a contactado" ⇒ tarjeta de cambio de estado; confirmar actualiza la cotización.
6. En `/admin/chat`, abrir la sesión de un cliente ⇒ visor **solo lectura**, sin input, sin lista de sesiones.

**D. Transversal**
- Provocar errores (sesión inexistente, límite) ⇒ mensajes legibles con tildes.
- `grep -rnE "Ã|Â|â€" src` ⇒ sin resultados.
- Network: `__INICIO__` público devuelve JSON; cliente/admin no llaman a `__INICIO__`.
- BD: ninguna tool devuelve IDs en el texto del asistente (revisar 10 respuestas).

---

## 8. Criterios globales de "terminado"

- [ ] Todas las casillas de §7 en verde, con evidencia (capturas o salida SQL) en el PR.
- [ ] B01–B23 cerrados (cada uno con test o paso del guion que lo cubra).
- [ ] Sin código muerto de §Fase 9; `route.ts` ≤ ~250 líneas; `agents.ts` solo configuración.
- [ ] `docs/chat-v2-decisiones.md` refleja el estado real.
- [ ] `tsc`, `lint`, `prisma validate`, unit tests, evals y Playwright en verde.

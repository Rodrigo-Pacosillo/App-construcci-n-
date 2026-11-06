# ESPECIFICACIÓN — Sistema de Asistentes/Agente IA para Constr-art

> **Documento blueprint para agente implementador (coding agent).**
> Versión: 1.0 · Fecha: 2026-11-05 · Proyecto: App-construcci-n--main (Constr-art)
> Este documento define QUÉ construir. El agente debe seguir las fases en orden (§12) y validar cada fase con sus criterios de aceptación antes de avanzar.

---

## 1. Decisiones ya tomadas (NO re-discutir, NO cambiar)

| # | Decisión | Detalle |
|---|----------|---------|
| D1 | **Una sola API key de NVIDIA** para los 3 agentes | El aislamiento es por configuración/permisos, no por keys |
| D2 | **Un solo runtime de chat** (`/api/chat`) | 3 configuraciones de agente/persona resueltas en el servidor. NO son 3 sistemas ni "multi-agente" |
| D3 | **RAG con vectores: postergado** | Ahora se implementa "RAG sin vectores": tabla `Conocimiento` + inyección por categoría. La estructura queda lista para pgvector después |
| D4 | **Vercel AI SDK** para el harness | Sustituye el `fetch` crudo de `nvidia.ts`. Streaming, tool-calling, salidas estructuradas |
| D5 | **Identidad derivada del servidor** | Nada de IDs enviados por el navegador. Sesión NextAuth para clientes/admin; token firmado HMAC para el chat público |
| D6 | **Escrituras del admin con confirmación humana + auditoría** | El agente propone → admin confirma → el código ejecuta. Tabla `ChatAccion` |
| D7 | **Terminología correcta**: chat público y chat de cliente son *asistentes* (workflows con contexto); el chat de admin es el único *agente* (loop con herramientas) | Evita sobrecargar de autonomía a los asistentes |

---

## 2. Contexto del proyecto actual (leer antes de tocar nada)

### 2.1 Stack
- **Next.js 16.3.5** (App Router) + React 19 + TypeScript
- **Prisma 6.19.3** sobre **PostgreSQL** (datasource `postgresql`, `DATABASE_URL`)
- **NextAuth v5** (`next-auth@5.0.0-beta.32`), providers: credentials. La sesión expone `session.user.id` y `session.user.role` (ver `src/lib/auth.ts`, callbacks jwt/session)
- **Zod 4** para validación, **Tailwind 4**, `next-themes` (dark mode con clase `.dark`)
- Modelo LLM actual: `nvidia/nemotron-3.5-super-vl-120b-a12b` vía `https://integrate.api.nvidia.com/v1` (API OpenAI-compatible). La key va en `NVIDIA_API_KEY`. **No existe `.env` en el repo** — la key está solo en el entorno de despliegue.

### 2.2 Modelo de usuarios
- `Usuario`: `id`, `email`, `rol` (enum Prisma `Rol`: `admin` | `cliente`), `clienteId?` → `Cliente` (relación 1:1 opcional). `activo: Boolean`.
- El guard de `/admin` lo hace `src/proxy.ts` (matcher `/admin/:path*`). El layout `/cliente` valida `session.user.role === "cliente"`.

### 2.3 Mapa de archivos del chat ACTUAL (lo que se va a modificar)
| Archivo | Rol hoy |
|---|---|
| `src/app/api/chat/route.ts` | Único endpoint (POST). Caso `__INICIO__` (crea sesión + primer mensaje IA) y caso mensaje normal. Llama a NVIDIA con fetch, guarda en BD |
| `src/lib/chat/nvidia.ts` | Wrapper fetch crudo a NVIDIA. Modelo `nvidia/nemotron-3.5-super-vl-120b-a12b`, `stream: false`, sin `max_tokens`, sin `chat_template_kwargs` |
| `src/lib/chat/system-prompt.ts` | `buildSystemPrompt()`: prompt único con datos de cotización + conocimiento hardcodeado (steel frame, proceso, reglas) |
| `src/lib/validators/chat.ts` | `chatInicioSchema` (acepta `clienteId`, `cotizacionId`, `clienteNombre` desde el navegador) y `chatMensajeSchema` |
| `src/components/chat/ChatPanel.tsx` | UI completa del chat: estado manual de mensajes, `sessionStorage` para sessionId, TTS (Web Speech), loader |
| `src/components/chat/{AiAvatar,AudioMensaje,BrickLoader,SendIcon}.tsx` | Componentes auxiliares (avatar, botones TTS, loader, icono enviar) |
| `src/app/chat-ui.css` | Variables CSS del chat (importada desde `globals.css`). **Conservar** |
| `src/app/(public)/cotizacion/exito/page.tsx` | Página pública post-cotización. Renderiza `<ChatPanel>` directamente (server component → SSR) |
| `src/app/(public)/cotizacion/page.tsx` | Formulario de cotización; redirige a `/cotizacion/exito?clienteId=...&cotizacionId=...` (línea ~30) |
| `src/components/cliente/ClienteSidebar.tsx` | Modal "Asistente CONSTR-ART" para clientes logueados (línea ~160) |
| `src/app/cliente/layout.tsx` | Pasa `clienteId`, `cotizacionId` (la MÁS RECIENTE, `take: 1`) y `cotizacionData` al sidebar |
| `prisma/schema.prisma` | `ChatSesion` (línea ~528), `ChatMensaje` (línea ~545) |

### 2.4 Cómo funciona el flujo HOY (para referencia)
1. Cliente público envía formulario de cotización → se guarda → redirect a `/cotizacion/exito?clienteId=X&cotizacionId=Y`.
2. `ChatPanel` se monta y hace POST con `mensaje: "__INICIO__"` + IDs del navegador.
3. La API valida Zod, verifica que la cotización pertenezca al clienteId **provisto por el navegador**, crea `ChatSesion`, construye system prompt, llama a NVIDIA, guarda y devuelve el primer mensaje.
4. Mensajes siguientes: POST con `{ mensaje, sessionId }`; la API recarga los últimos 20 mensajes como contexto.
5. El portal del cliente abre el mismo `ChatPanel` en un modal, con la cotización más reciente del usuario.

---

## 3. FASE 0 — Bugs críticos conocidos (arreglar PRIMERO)

> Estos bugs están diagnosticados. Corregirlos es prerequisito de todo lo demás. NO reescribir de más: cambios mínimos y verificados.

### B1. Crash de SSR por `sessionStorage` (CRÍTICO)
- **Dónde:** `src/components/chat/ChatPanel.tsx`, líneas ~49-51.
- **Problema:** `useState(() => sessionStorage.getItem(sessionStorageKey))` se ejecuta también en el servidor al renderizar `/cotizacion/exito` (client component SSR). `sessionStorage` no existe en Node → `ReferenceError` → la página entera falla (no hay `error.tsx` en el proyecto).
- **Evidencia interna:** los otros dos inicializadores del mismo archivo (ttsRate ~57, ttsVoiceName ~66) SÍ tienen guard `typeof window === "undefined"`.
- **Fix:** inicializar `sessionId` en `null` y leer `sessionStorage` dentro de un `useEffect` (patrón cliente-only). Verificar que `/cotizacion/exito` renderiza sin errores en SSR.

### B2. Historial nunca se recarga → chat vacío tras recargar/reabrir
- **Dónde:** `ChatPanel.tsx` (efecto de inicio, líneas ~166-192) y `route.ts` (no existe GET).
- **Problema:** si `sessionStorage` ya tiene `sessionId`, no se inicia chat, pero `mensajes` queda `[]`. El usuario ve un chat vacío; al escribir, el bot responde con contexto invisible.
- **Fix:** agregar endpoint GET de historial (§8.2) y cargarlo en el montaje si existe `sessionId`.

### B3. Errores del backend enmascarados + usuario bloqueado
- **Dónde:** `ChatPanel.tsx` `enviarMensaje()` líneas ~221-223 (hace `throw` sin leer el body del error).
- **Problema:** la API devuelve 404 "Sesión no encontrada. Inicia una nueva conversación." y 429 "Has alcanzado el límite de mensajes" con mensajes específicos; el frontend muestra siempre el genérico "tuve un problema técnico". No existe botón de nueva conversación → usuario trabado hasta cerrar pestaña.
- **Fix:** contrato de errores tipado (§8.3) + el frontend los interpreta (mostrar mensaje real, ofrecer botón "Iniciar nueva conversación" que limpia sessionStorage y arranca sesión nueva).

### B4. Modelo de razonamiento sin configurar
- **Dónde:** `src/lib/chat/nvidia.ts`.
- **Problema:** `nemotron-3.5-super-vl-120b-a12b` es un modelo de razonamiento; sin `chat_template_kwargs: { enable_thinking: false }` puede devolver razonamiento visible o vacío; tampoco se fija `max_tokens`.
- **Fix:** en el payload: `chat_template_kwargs` vía `providerOptions` del AI SDK, `max_tokens` por agente (§7.3), y strip defensivo de `` si apareciera en `content`.

### B5. Sin error boundary global
- **Fix:** agregar `src/app/error.tsx` (client component) con UI en español y botón de reintento. Opcional `src/app/global-error.tsx`.

### B6. Seguridad de identidad (se resuelve en Fase 1, no parchear a medias)
- Hoy `/api/chat` confía en `clienteId`/`cotizacionId` del navegador y no consulta la sesión. Se resuelve con el modelo de identidad §5 — NO con parches parciales.

---

## 4. Arquitectura objetivo

```
                        ┌──────────────────────────────────────┐
  Navegador ──────────► │  /api/chat (único runtime, streaming)│
                        │  1. auth() → rol (admin/cliente)     │
                        │     o token público firmado          │
                        │  2. Resuelve AGENTE (config)         │
                        │  3. Ensambla contexto (BD + RAG-cat) │
                        │  4. Ejecuta herramientas (AI SDK)    │
                        │  5. Persiste + audita                │
                        └──────────┬───────────────────────────┘
                                   │
      ┌────────────────┬───────────┴──────────┬────────────────────┐
      ▼                ▼                      ▼                    ▼
 AGENTE_PUBLICO   AGENTE_CLIENTE        AGENTE_ADMIN          Conocimiento
 (token firmado,  (sesión cliente,      (sesión admin,        (tabla Conocimiento,
  cotización       herramientas de       lectura total +       inyección por
  actual)          lectura propias)      escrituras con        categoría+audiencia;
                                        confirmación)         pgvector = futuro)
```

Principios:
- **Un solo lugar** donde se decide el agente, se valida identidad, se aplican límites y se registra. Los agentes son objetos de configuración (prompt, herramientas, modelo, límites), nunca rutas ni keys distintas.
- **Contexto server-side**: el backend consulta Prisma según la identidad y arma el contexto. El navegador solo habla con sessionId/token.
- **Escrituras solo por el agente admin, siempre vía `ChatAccion` con confirmación**.

---

## 5. Modelo de identidad y seguridad

### 5.1 Cliente logueado (AGENTE_CLIENTE)
- `auth()` dentro del route handler. Si `session.user.role !== "cliente"` → 403.
- El `usuarioId` de la sesión es LA única identidad. Todo query de contexto se filtra por `usuarioId` (o por su `Cliente` relacionado vía `Usuario.clienteId`).
- Los IDs que lleguen en el body del fetch **se ignoran**.

### 5.2 Admin (AGENTE_ADMIN)
- `auth()` + `session.user.role === "admin"`, sino 403.
- Escrituras: solo vía flujo `ChatAccion` (§9.3). Lectura total permitida.

### 5.3 Público (AGENTE_PUBLICO)
- No hay sesión. Acceso mediante **token firmado de corta vida**:
  - Al crear la cotización, el backend genera `chatToken = HMAC_SHA256(secret, cotizacionId + exp)` con `CHAT_TOKEN_SECRET` (nueva env var) y `exp` de ~14 días, renovable.
  - La URL de éxito pasa a ser `/cotizacion/exito?cotizacionId=...&t=<token>` (mantener compatibilidad: si llega solo `clienteId+cotizacionId` sin token, redirigir a una versión con token o mostrar el flujo degradado actual, según lo que permita el endpoint de creación existente).
  - La API verifica firma + expiración antes de crear la sesión; el `sessionId` resultante queda asociado a la cotización. El navegador nunca vuelve a enviar IDs: solo `sessionId`.
- **Tarea previa del implementador:** localizar el endpoint/server action que crea la cotización (es la fuente del redirect a `/cotizacion/exito` construido en `src/app/(public)/cotizacion/page.tsx` ~línea 30) y ahí emitir el token.

### 5.4 Rate limits por agente (aplicar server-side, por `ChatSesion` y por usuario/día)
| Agente | Mensajes por sesión | Sesiones |
|---|---|---|
| PÚBLICO | 20 (como hoy) | 1 por cotización activa |
| CLIENTE | 60 | reiniciable por el usuario |
| ADMIN | sin límite duro (auditado) | ilimitadas |

---

## 6. Modelo de datos (Prisma — migraciones exactas)

> Usar `prisma migrate dev` con nombres descriptivos. NO reescribir tablas existentes de negocio. Backfill incluido.

### 6.1 `ChatSesion` (modificar)
Nuevos campos:
- `agente String` — valores: `"publico" | "cliente" | "admin"`. Backfill: `"publico"`.
- `usuarioId String?` → FK a `Usuario`. Nulo en público. Backfill: derivable del `clienteId` existente cuando exista usuario vinculado.
- `estado String @default("activa")` — `"activa" | "cerrada" | "limite"`.
- `titulo String?` — primeras palabras del primer mensaje del usuario.
- `resumen String? @db.Text` — resumen rodante para conversaciones largas (opcional, puede quedar nulo en Fase 1).
- `ultimoMensajeEn DateTime @default(now())`.
- Mantener `sessionId @unique`, `clienteId?`, `cotizacionId?`, `mensajeCount`.

### 6.2 `ChatMensaje` (modificar)
- `metadatos Json?` — tokens entrada/salida, latencia ms, modelo usado, ids de herramientas ejecutadas.

### 6.3 `ChatAccion` (nueva) — auditoría + cola de confirmación
- `id`, `sesionId` FK, `usuarioId` FK, `herramienta String`, `argumentos Json`, `resultado Json?`, `estado String @default("pendiente")` — `"pendiente" | "confirmada" | "ejecutada" | "rechazada" | "fallida"`, `error String?`, `confirmadaPorUsuarioId String?`, `creadoEn`, `ejecutadoEn DateTime?`.
- Índice por `sesionId` y por `estado`.

### 6.4 `Conocimiento` (nueva) — conocimiento sin vectores (D3)
- `id`, `titulo String`, `categoria String` — `"sitio_web" | "servicios" | "faq" | "tecnico" | "proceso" | "politica" | "otro"`, `audiencia String` — `"publico" | "cliente" | "admin"` (admin puede leer todo), `contenido String @db.Text`, `activo Boolean @default(true)`, `version Int @default(1)`, `creadoEn`, `actualizadoEn`.
- **FUTURO (no implementar ahora, solo dejar anotado):** tabla `ConocimientoFragmento` con `embedding Unsupported("vector")` + índice HNSW cuando se active pgvector.

### 6.5 `Cotizacion` (modificar)
- `chatTokenIssuedEn DateTime?` (para rotación/telemetría del token; el token en sí se calcula con HMAC, no se almacena).

### 6.6 Seed de conocimiento (contenido: EXTRAERLO del repo, NO inventarlo)
El implementador generará los documentos semilla a partir del contenido EXISTENTE:
| Doc semilla | Fuente en el repo |
|---|---|
| Cómo funciona el sitio / flujo del cliente (cotización → contacto 24-48h → visita técnica → presupuesto → contrato → portal) | `src/lib/chat/system-prompt.ts` §C (proceso 1-7) |
| Servicios de la empresa | `src/content/servicios-contenido.ts` |
| FAQ | página `src/app/(public)/faq/page.tsx` (extraer preguntas/respuestas reales) |
| Steel Frame vs. construcción tradicional (ventajas, materiales, cuándo conviene) | `system-prompt.ts` §2A/2B |
| Qué ve el cliente en el portal (avance, pagos, documentos, contratos, calendario) | estructura real de `src/app/cliente/**` |
| Política comercial (qué NO se comunica: precios exactos, plazos garantizados, estado real de cotización) | `system-prompt.ts` §3 (límites del bot) |

Reglas del seed: español neutro con tratamiento de usted, máximo ~500 palabras por doc, `audiencia` correcta por doc, `categoria` correcta.

---

## 7. Definición de los 3 agentes

### 7.1 Config común
Cada agente = objeto de configuración en un registro (p. ej. `src/lib/ai/agents.ts`): `{ id, systemPromptBuilder, tools[], model, maxTokens, temperature, limites, audienciaConocimiento }`. El system prompt se construye server-side con: rol del asistente, datos de contexto, reglas de comportamiento (heredar las actuales de `system-prompt.ts`: sin precios exactos, sin promesas de fechas, sin temas ajenos, español neutro con usted, máx 3-4 oraciones, formato con listas simples), y se le SUMA el conocimiento relevante de la tabla `Conocimiento` filtrado por `audiencia` + `categoria` pertinente (§10).

### 7.2 AGENTE_PUBLICO (`publico`)
- **Autenticación:** token firmado (§5.3). Sesión ligada a 1 cotización.
- **Contexto:** snapshot de la cotización (tipoObra, tipoConstruccion, rangoM2, plazoInicio, ubicacionObra), nombre del cliente, y conocimiento `audiencia=publico`. Migrar TODO el contenido actual de `system-prompt.ts` a docs de `Conocimiento` + un prompt-base corto.
- **Herramientas:** ninguna.
- **Modelo:** el mismo de hoy (D1). Temperature ~0.7. `max_tokens` ~700.

### 7.3 AGENTE_CLIENTE (`cliente`)
- **Autenticación:** sesión con rol `cliente` (§5.1).
- **Contexto:** resumen de SUS datos al iniciar sesión de chat: cotizaciones, contrato activo, estado de pagos (montos pagados/pendientes calculados EN CÓDIGO), avance de obra (% e hitos), últimos documentos. Además conocimiento `audiencia in (publico, cliente)`.
- **Herramientas (solo lectura, filtradas por su usuarioId):**
  - `obtener_mis_cotizaciones`
  - `obtener_mis_pagos` (el cálculo de totales lo hace el código, no el LLM)
  - `obtener_avance_obra`
  - `obtener_mis_documentos`
  - `obtener_proximos_eventos` (calendario)
- **Modelo:** mismo. `max_tokens` ~900.

### 7.4 AGENTE_ADMIN (`admin`)
- **Autenticación:** sesión con rol `admin` (§5.2).
- **Contexto:** contexto operativo mínimo al inicio + confianza en herramientas para el resto (evitar prompts kilométricos).
- **Herramientas de LECTURA:**
  - `buscar_clientes(termino)`
  - `resumen_cotizacion(cotizacionId)`
  - `estado_financiero_cliente(clienteId)` (cálculos en código)
  - `resumen_avance_obra(proyectoId)`
  - `inventario_herramientas_y_materiales(filtros)`
- **Herramientas de ESCRITURA (siempre vía `ChatAccion`):**
  - `proponer_cambio_estado_cotizacion(cotizacionId, nuevoEstado)` — estados válidos de `ESTADOS_COTIZACION` en `src/lib/constants.ts`
  - `proponer_agendar_visita(clienteId, fecha, notas)`
- **Flujo de escritura (D6):** el modelo llama a `proponer_*` → el backend crea fila `ChatAccion(estado="pendiente")` con argumentos validados por Zod → el asistente muestra un resumen legible ("Voy a cambiar el estado de la cotización X a 'contactado'. ¿Confirmas?") → el admin confirma en la UI → endpoint ejecuta la acción real, marca `ejecutada` y registra `confirmadaPorUsuarioId`. Rechazo → `rechazada`. **El LLM nunca escribe directo.**
- **Modelo:** mismo (D1), `max_tokens` ~1200. Temperature 0.4 (más determinista para herramientas).

---

## 8. Contratos de API

### 8.1 `POST /api/chat` (unificado, streaming)
- Resuelve agente por identidad (§5). Acepta `{ sessionId?, mensaje }`.
- Con `mensaje === "__INICIO__"` y sin `sessionId`: crea sesión (con `agente`, `usuarioId`/`cotizacionId` según identidad), genera primer mensaje.
- Respuesta: stream SSE con el protocolo del Vercel AI SDK (`streamText` + `toUIMessageStreamResponse()` o equivalente de la versión instalada).
- Persistencia: guardar mensaje usuario y respuesta (con `metadatos`) al terminar el stream; incrementar `mensajeCount` (+2); actualizar `ultimoMensajeEn`, `titulo` si es el primero.
- Herramientas: definidas con AI SDK (`tool` + Zod). Escrituras según §7.4.

### 8.2 `GET /api/chat?sessionId=...` — historial de la sesión
- Devuelve `{ agente, mensajes[], estado, resumen? }`. Valida propiedad (usuarioId o sesión pública asociada al token). Corrige B2.

### 8.3 `POST /api/chat/reiniciar` — nueva conversación
- Cierra la sesión actual (`estado="limite"` o `"cerrada"`) y crea otra del mismo agente. Corrige B3.

### 8.4 Errores tipados (JSON, corregir B3)
- `{ error: { code, message } }` con `code ∈ { SESION_NO_ENCONTRADA, SESION_LIMITE, NO_AUTORIZADO, TOKEN_INVALIDO, VALIDACION, PROVEEDOR_IA, DESCONOCIDO }`. El frontend mapea cada código (§11).

### 8.5 Acciones admin
- `GET /api/admin/chat-acciones?estado=pendiente` y `POST /api/admin/chat-acciones/[id]/confirmar | /rechazar`.
- La confirmación ejecuta la lógica de negocio real (misma validación que las mutaciones existentes del panel admin).

---

## 9. Módulo de conocimiento (RAG sin vectores — D3)

1. **Repositorio:** `src/lib/ai/conocimiento.ts` con `obtenerConocimiento({ audiencia, categorias? })` → docs activos.
2. **Inyección:** al armar el system prompt, se agregan los docs cuyo `audiencia` sea accesible para el agente y cuya `categoria` sea pertinente al tema activo (el agente público/cliente inyecta los docs base; si la pregunta toca otra categoría, la herramienta `buscar_conocimiento(termino, categoria?)` permite recuperar más — sí, el asistente puede tener ESTA herramienta de lectura, es segura).
3. **Gestión:** CRUD mínimo en el panel admin (lista + formulario título/categoría/audiencia/contenido/activo). Sin editor complejo.
4. **Futuro (NO ahora):** pgvector + fragmentos + embeddings (modelos `nemotron-embed` del mismo proveedor). La tabla actual no se descarta, se extiende.

---

## 10. Adopción de Vercel AI SDK (D4)

- Instalar `ai` + `@ai-sdk/openai-compatible`. Proveedor NVIDIA: `createOpenAICompatible({ name: "nvidia", baseURL: "https://integrate.api.nvidia.com/v1", apiKey: process.env.NVIDIA_API_KEY })`.
- `nvidia.ts` se reemplaza por este proveedor; las llamadas pasan a `streamText({ model, messages, tools, temperature, maxOutputTokens, providerOptions: { nvidia: { chat_template_kwargs: { enable_thinking: false } } } })`.
- Frontend: hook `useChat` (transporte por defecto) para los 3 puntos de chat. `ChatPanel` se refactoriza: se elimina el estado manual de mensajes y los fetch a mano (B1/B2/B3 quedan resueltos por el patrón). Conservar: TTS (`AudioMensaje`), `AiAvatar`, `BrickLoader` (mostrarlo mientras llega el primer token), `chat-ui.css` y clases actuales.
- Defensa contra razonamiento visible: si `content` llegara con ``…`` (B4), hacer strip defensivo server-side antes de persistir.
- NO cambiar de proveedor ni agregar fallbacks en esta iteración (Non-goal).

---

## 11. Frontend — cambios de superficie (sin rediseño visual)

| Superficie | Cambios |
|---|---|
| `ChatPanel.tsx` | Refactor a `useChat`; carga de historial existente (GET); botón "Nueva conversación" (reiniciar); manejo de errores por `code` (§8.4): mostrar el mensaje real, y en `SESION_NO_ENCONTRADA`/`SESION_LIMITE` ofrecer reinicio; soporte streaming (texto incremental) |
| `/cotizacion/exito` | Fix SSR (B1); recibir `t` (token) en la URL; pasar token al ChatPanel |
| `ClienteSidebar` (modal) | Mismo componente; contexto ya viene del layout (el layout puede dejar de enviar IDs cuando el backend los derive de la sesión) |
| Nuevo `ChatAdmin` | Panel de chat para el admin (página `src/app/admin/(panel)/chat/page.tsx`), con tarjetas de confirmación de acciones pendientes (aprobar/rechazar) |
| Panel admin | Sección "Conocimiento" (CRUD mínimo, §9.3) y vista "Conversaciones" simple (lista de sesiones con mensajes, solo lectura) para observabilidad |

Accesibilidad/UX: mantener labels y `aria-label` en español; el botón de enviar deshabilitado mientras hace streaming; interrupción de generación (botón detener).

---

## 12. Plan de implementación por fases (orden obligatorio) y criterios de aceptación

### Fase 0 — Estabilización (bugs §3)
- [ ] `/cotizacion/exito` renderiza en SSR sin `ReferenceError` (probar con JS deshabilitado).
- [ ] Recargar la página con sesión existente muestra el historial completo.
- [ ] 404/429 muestran su mensaje específico y ofrecen "Nueva conversación".
- [ ] Payload NVIDIA incluye `enable_thinking: false` y `max_tokens`.
- [ ] `error.tsx` presente.
- **Sin migraciones. Sin cambios de arquitectura.** (Puede hacerse antes o junto con Fase 1; si se hace junto, los fixes igualmente deben quedar resueltos por el refactor.)

### Fase 1 — Runtime único + agentes por configuración (núcleo)
- [ ] AI SDK integrado; `nvidia.ts` retirado; streaming funcionando en los 3 puntos de entrada.
- [ ] Identidad server-side: `/api/chat` no confía en IDs del navegador (cliente/admin); token HMAC público operativo.
- [ ] Registro de agentes con 3 configs; prompts modularizados; límites por agente activos.
- [ ] Migraciones 6.1-6.5 aplicadas con backfill; sesiones antiguas siguen visibles.
- [ ] GET historial + POST reiniciar operativos.
- [ ] Herramientas de lectura del cliente implementadas y probadas con un cliente real de prueba.

### Fase 2 — Conocimiento (RAG sin vectores)
- [ ] Tabla `Conocimiento` poblada con los 6 docs semilla extraídos del repo (§6.6).
- [ ] Inyección por audiencia+categoria funcionando; herramienta `buscar_conocimiento` disponible.
- [ ] CRUD de conocimiento en panel admin operativo.
- [ ] Verificar: el chat público NO accede a docs `audiencia=admin`.

### Fase 3 — Agente admin con escrituras seguras
- [ ] Herramientas de lectura admin operativas.
- [ ] Flujo `proponer_* → ChatAccion(pendiente) → confirmar/rechazar → ejecutar` completo con auditoría.
- [ ] Vista "Conversaciones" y tarjetas de confirmación en el panel.
- [ ] Prueba end-to-end documentada: cambiar estado de una cotización de prueba vía chat.

### Fase 4 — Evals y pulido
- [ ] `tests/ai-evals/` con casos canónicos por agente (mín. 10 por agente) en YAML: pregunta → debe/must-not (ej.: "¿Cuánto cuesta el m²?" → debe NEGAR precios; "¿Cuánto he pagado?" (cliente) → debe invocar `obtener_mis_pagos` con SU usuario; admin pide cambio de estado → debe crear `ChatAccion` pendiente, sin ejecutar).
- [ ] Script manual de evals (llama a los agentes y compara conducta).
- [ ] Resumen rodante (`resumen`) opcional activado si el historial supera N mensajes.
- [ ] Revisar costos/latencia en `metadatos`.

---

## 13. Non-goals (explícitamente FUERA de esta iteración)

1. pgvector/embeddings/búsqueda semántica (D3).
2. Multi-agente orquestado, handoffs, CrewAI/AutoGen/LangGraph (D7).
3. Segunda API key, otro proveedor, fallbacks (D1).
4. MCP u exposición de herramientas a clientes externos.
5. Rediseño visual del chat o del sitio.
6. Voz entrante (ASR); el TTS actual se conserva tal cual.
7. Rediseño de la BD de negocio (pagos, contratos, etc. — solo el chat evoluciona).

---

## 14. Variables de entorno y despliegue

- `NVIDIA_API_KEY` (ya existe en el entorno de despliegue; NO commitear).
- `CHAT_TOKEN_SECRET` (nueva, aleatoria ≥32 bytes).
- `AUTH_SECRET` (ya existente de NextAuth).
- `DATABASE_URL` (sin cambios).
- Documentar en `.env.example` (crear si no existe; SIN valores reales).
- Antes de desplegar: `prisma migrate deploy`. Verificar en logs que no aparezca `[nvidia.ts] NVIDIA_API_KEY no está definida` (el wrapper viejo moría silenciosamente en este caso → con AI SDK, fallar explícito al iniciar si falta la key).

---

## 15. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Regresión del flujo de cotización al tocar el redirect de éxito | Cambio mínimo: SOLO agregar emisión/lectura de token; probar flujo completo con cotización real de prueba |
| Prompt injection vía texto del usuario | Mantener reglas del system prompt (§7.1); herramientas con validación Zod estricta; escrituras con confirmación humana; nunca interpolar contenido del usuario como instrucciones |
| Filtrado de conocimiento por audiencia defectuoso | Test específico en evals (Fase 2) + el filtro se aplica en el servidor, no en el prompt |
| Rate limits del tier gratuito NVIDIA | Limitar por agente (§5.4); si se agota, decidir segunda key en otra iteración |
| Modelo devuelve razonamiento visible | `enable_thinking:false` + strip defensivo (B4) |
| Costos de tokens en admin | Contexto mínimo + herramientas; `metadatos` para medir |

---

## 16. Fuente de verdad y orden de lectura para el agente implementador

1. Este documento completo.
2. `prisma/schema.prisma` (modelos reales) — los nombres de campos de negocio son los que estén, no los de este doc.
3. `src/lib/constants.ts` (estados de cotización válidos, WhatsApp).
4. `src/lib/auth.ts` (forma de la sesión).
5. Fases en orden; NO mezclar fases en un mismo commit; cada fase con su checklist completada y verificada en local antes de la siguiente.
6. Estilo: español neutro con usted en toda la UI; seguir los tokens/clases actuales (`chat-ui.css`, Tailwind).

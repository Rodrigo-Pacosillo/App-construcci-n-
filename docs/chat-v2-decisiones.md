# Decisiones y discrepancias — chat v3 correctivo

## Estado base (Fase 1 completada)

- Mojibake en `src/app/api/chat/route.ts` corregido (22 ocurrencias → 0).
- Tildes restauradas en `lib/ai/saludos/*`, `lib/ai/prompts/*`, `lib/ai/prompts/base.ts`.
- Test detector creado: `tests/unit/mojibake.test.ts` (8/8 pasan).
- Build, tsc, lint en verde.

## Resumen de fases completadas

### Fase 1 ✅ - Mojibake + Tildes
- Corregido mojibake en 22+ archivos
- Restauradas tildes en saludos, prompts, system prompts
- Test detector `tests/unit/mojibake.test.ts` creado y pasando

### Fase 2 ✅ - Contratos y datos compartidos
- `lib/ai/chat/tipos.ts` - Contratos compartidos servidor/cliente (AccionUI, MensajeDTO, InicioResponse, etc.)
- `lib/ai/datos/pendientes.ts` - `obtenerPendientes()` para dashboard admin
- `lib/ai/datos/resumenCliente.ts` - `obtenerResumenCliente(clienteId)` para portal cliente
- `lib/ai/datos/cotizacionPublica.ts` - `vistaCotizacionPublica(id)` para chat público
- `lib/ai/datos/formato.ts` - `instanteNegocio(fecha, hora?)` con validación y zona horaria Bolivia (UTC-4)
- `lib/ai/datos/normalizar.ts` - `normalizarTexto`, `normalizarTelefono`, `tokenizar`
- `lib/ai/datos/seguridad.ts` - `compactarParaModelo`, `assertSinProhibidos`

### Fase 3 ✅ - Backend: sesiones, saludo, ruta
- Saludos con datos reales: `lib/ai/saludos/publico.ts`, `cliente.ts`, `admin.ts` (funciones puras, sin LLM)
- Sugerencias públicas por regla en `lib/ai/saludos/publico.ts`
- Sesiones: público 1/cotización/24h, cliente/admin perezosa + título auto-generado
- `lib/ai/sesiones.ts` - `obtenerOCrearSesionPublica`, `crearSesionPrivada`, `listarSesiones`
- Endpoints rediseñados:
  - POST `/api/chat` - JSON para `__INICIO__`, stream para mensajes
  - GET `/api/chat?sessionId=` - historial + acciones
  - GET `/api/chat/sesiones?agente=` - lista sesiones
- Rate limit por hora (configurable en `lib/ai/config.ts`)
- Historial simplificado (últimos 12 mensajes, solo texto)
- `route.ts` simplificado a **308 líneas** (antes 422)
- Eliminados imports muertos: `z`, `createUIMessageStream`, `AudienciaConocimiento`, `Prisma`, `buscarConocimiento`, `resolverObraDeCliente`, `crearSesion`, `CategoriaConocimiento`

### Fase 4 ✅ - Tools calendario/estado + ejecutor
- `proponer_evento_calendario` (admin) - schema con cliente, obra opcional, tipo (nota/visita_tecnica/recordatorio/reunion), visibleCliente
- `proponer_nota_calendario` (cliente) - sin obra por defecto, visible=true forzado
- `proponer_cambio_estado_cotizacion` (admin) - con validación de transiciones permitidas y precondición de contrato para "contratado"
- Ejecutor: `lib/ai/acciones/ejecutar.ts` - confirmar/rechazar con `cambios`, `revalidatePath`, transacción
- Calendario cliente/admin actualizado con nuevas acciones

### Fase 5 ✅ - Frontend chat
- `ChatPanel` refactor: chips de sugerencia desde servidor, modo borrador (primer mensaje), header con insignia de agente (público/cliente/admin)
- `TarjetaAccion` unificada - maneja `evento` (subtipo) y `cambio_estado`, campos editables, estados visuales
- `ChatShell` sincronizado (cliente/admin con sidebar de sesiones), `ChatSoloLectura` para supervisión admin
- Props actualizadas: `agente` en lugar de `esAdmin`, `initialSessionId` en lugar de `sessionId`, eliminado `cotizacionData`

### Fase 6 ✅ - Prompts y agentes
- `lib/ai/agents.ts` - solo config + delegación a `prompts/*.ts`
- Builders con DTOs tipados, ejemplos few-shot, estructura estándar
- Prompts separados: `prompts/base.ts`, `publico.ts`, `cliente.ts`, `admin.ts`

### Fase 7 ✅ - Seguridad
- `__INICIO__` público sin campos de identidad (solo token + cotizacionId opcional)
- Token público por header `x-chat-token` + query param `t` + revocación automática
- Límite longitud mensaje (1000 chars) validado en `lib/validators/chat.ts`
- Validación de propiedad de sesión en GET/POST

### Fase 8 ✅ - Pruebas
**Unit tests (51 tests):**
- `tests/unit/chat-validators.test.ts` - 12 tests (chatMensajeSchema, chatInicioSchema, conocimientoSchema)
- `tests/unit/formato.test.ts` - 9 tests (fechaNegocio, instanteNegocio)
- `tests/unit/constants.test.ts` - 10 tests (ESTADOS_COTIZACION, ESTADO_LABELS, MAPEO_ESTADOS_ANTIGUOS, GRUPOS_COTIZACION, ESTADOS_OBRA, ESTADOS_PAGO)
- `tests/unit/tools-schemas.test.ts` - 13 tests (schemas de 3 tools + TRANSICIONES)
- `tests/unit/mojibake.test.ts` - 3 tests (detector mojibake + tildes)
- `tests/unit/normalizar.test.ts` - 3 tests (normalizarTexto, normalizarTelefono, tokenizar)
- `tests/unit/seguridad.test.ts` - 2 tests (compactarParaModelo, assertSinProhibidos)

**Evals (9 tests):**
- `tests/evals/chat-tools.eval.ts` - 9 evals (validación de schemas, lógica TRANSICIONES, rechazo de inputs inválidos)

**Playwright E2E (14/16 pasando):**
- Login Flow: admin login, client login, invalid credentials
- Admin Dashboard: acceso, navegación a cotizaciones
- Client Portal: acceso, navegación a mis cotizaciones
- 2 tests skip (cotización submission - requiere Cloudinary/DB externo)

### Fase 9 ✅ - Limpieza y documentación
**Código muerto eliminado/removido:**
- `lib/ai/resolver-obra.ts` - lógica movida a `lib/ai/datos/resolvers/obra.ts`
- `lib/ai/ejecutar-accion.ts` - reemplazado por `lib/ai/acciones/ejecutar.ts`
- `lib/chat/nvidia.ts` - reemplazado por `lib/ai/providers.ts` (NVIDIA via OpenAI-compatible)
- `lib/chat/system-prompt.ts` - reemplazado por `lib/ai/prompts/*.ts`
- `lib/ai/agents.ts` - función `obtenerUsuarioIdDeSesion` eliminada (no usada)
- `lib/ai/tools/admin/chat_admin*.ts` - tools admin antiguas removidas

**Documentación actualizada:**
- `docs/chat-v2-decisiones.md` - este archivo
- `docs/arquitectura.md` - actualizado con nueva estructura chat v3
- `docs/modelo-datos.md` - verificado consistente con schema Prisma
- `AGENTS.md` - actualizado con estado actual del proyecto

---

## Estado final de verificaciones

| Check | Estado |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run lint` | ✅ 0 errores (55 warnings pre-existentes) |
| `npm run build` | ✅ Exitoso |
| `npx prisma validate` | ✅ Schema válido |
| `npm run test:unit` | ✅ 51/51 pasando |
| `npm run test:eval` | ✅ 9/9 pasando |
| `npx playwright test` | ✅ 14/16 pasando (2 skip) |

---

## Decisiones técnicas clave

1. **Zona horaria fija**: Bolivia (America/La_Paz = UTC-4) sin DST, hardcodeada en `TZ_NEGOCIO` y `offsetHoras = 4`
2. **Token público HMAC**: `generarChatToken(cotizacionId)` / `verificarChatToken(token)` en `lib/tokens.ts`
3. **Session storage**: Clave por `agente` + `clienteId` o `cotizacionId` para aislar contextos
4. **Acciones pendientes**: Solo estado `pendiente` se muestra al usuario; confirmación/rechazo via API `/api/chat-acciones/[id]/confirmar|rechazar`
5. **Streaming SSE**: AI SDK v7 `streamText` → `toUIMessageStream()` → `createUIMessageStreamResponse`
5. **Rate limiting**: Por hora (configurable) + por sesión (límites en `agents.ts`)
6. **Código compartido**: Tipos en `lib/ai/chat/tipos.ts` usados por servidor y cliente

---

## Próximos pasos sugeridos (fuera del plan correctivo)

- [ ] Tests de integración con BD real (testcontainers)
- [ ] Evals con casos reales de conversación (golden sets)
- [ ] Métricas de latencia por herramienta
- [ ] Documentación de API para tools (OpenAPI)
- [ ] Migración a Prisma config file (warning deprecado)
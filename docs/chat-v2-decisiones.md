# Decisiones y discrepancias — chat v3 correctivo

## Estado base (Fase 1 completada)

- Mojibake en `src/app/api/chat/route.ts` corregido (22 ocurrencias → 0).
- Tildes restauradas en `lib/ai/saludos/*`, `lib/ai/prompts/*`, `lib/ai/prompts/base.ts`.
- Test detector creado: `tests/unit/mojibake.test.ts` (8/8 pasan).
- Build, tsc, lint en verde.

## Pendientes (según PLAN-chat-agentes-v3-CORRECTIVO.md)

**B01–B23** documentados en el plan correctivo.

### Fase 1 ✅
- Mojibake + tildes + test detector.

### Fase 2 ⏳ (Contratos y datos compartidos)
- `lib/ai/chat/tipos.ts` (contratos compartidos servidor/cliente).
- `lib/ai/datos/pendientes.ts` → `obtenerPendientes()`.
- `lib/ai/datos/resumenCliente.ts` → `obtenerResumenCliente(clienteId)`.
- `lib/ai/datos/cotizacionPublica.ts` → `vistaCotizacionPublica(id)`.
- `instanteNegocio(fecha, hora?)` en `datos/formato.ts`.
- `compactarParaModelo` regex corregido.

### Fase 3 ⏳ (Backend: sesiones, saludo, ruta)
- Saludos con datos reales (funciones puras).
- Sugerencias públicas por regla.
- Sesiones: público 1/cotización/24h, cliente/admin perezosa + título auto.
- Endpoints rediseñados (JSON para `__INICIO__`, GET `/api/chat/saludo`, etc.).
- Rate limit por hora.
- Historial simplificado, saludo plegado al system prompt.
- `route.ts` ≤ 250 líneas.

### Fase 4 ⏳ (Tools calendario/estado + ejecutor)
- `proponer_evento_calendario` con schema nuevo.
- `proponer_nota_calendario` (cliente, sin obra por defecto, visible=true).
- `proponer_cambio_estado_cotizacion` con precondiciones correctas.
- Ejecutor con `cambios`, `revalidatePath`, transacción.
- Calendario cliente/admin actualizado.

### Fase 5 ⏳ (Frontend chat)
- `ChatPanel` refactor: chips desde servidor, modo borrador, header insignia.
- `TarjetaAccion` unificada (evento + cambio_estado), campos editables.
- `ChatShell` sincronizado (cliente/admin), `ChatSoloLectura` para supervisión admin.

### Fase 6 ⏳ (Prompts y agentes)
- `agents.ts` solo config + delegación a `prompts/*.ts`.
- Builders con DTOs, ejemplos few-shot, estructura estándar.

### Fase 7 ⏳ (Seguridad)
- `__INICIO__` público sin campos de identidad.
- Token público por header + revocación.
- Límite longitud.

### Fase 8 ⏳ (Pruebas)
- Unit tests: `instanteNegocio`, `obtenerPendientes`, `obtenerResumenCliente`, saludos, sugerencias, ejecutor, parser SSE.
- Evals reales + Playwright (guion §7).

### Fase 9 ⏳ (Limpieza)
- Borrar código muerto: `resolver-obra.ts`, `ejecutar-accion.ts`, `lib/chat/*`, `obtenerUsuarioIdDeSesion`, `chat_admin*`.
- Actualizar docs: `arquitectura.md`, `modelo-datos.md`, `AGENTS.md`, `chat-v2-decisiones.md`.
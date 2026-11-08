# Decisiones y discrepancias — chat v2

## Estado base (Fase 0, rama feat/chat-agentes-v2)

- `npx prisma validate`: OK.
- `npx tsc --noEmit`: sin errores.
- `npm run lint`: 0 errores, 23 warnings (preexistentes, no bloquean).
- Baseline anotado antes de cambios.

## Riesgos a cerrar (acordados)

1. Búsqueda por apellido/acento: cargar todos los clientes y filtrar en memoria con `normalizarTexto` (no depender de `ILIKE`).
2. Compatibilidad hacia atrás: `ChatMensaje.partes` y `ChatAccion.resumen` pueden ser `null` en filas previas; `historial.ts` y UI de tarjetas con fallback.
3. Saludo persistido como `assistant` se omite del historial del modelo y se pliega al system prompt.
4. Sesiones cliente/admin se crean perezosamente en el primer mensaje del usuario (no al abrir "nuevo chat").
5. `visibleCliente` se envía explícito en todos los puntos de creación de eventos.

## Huecos adicionales

- `resolverCotizacion` con texto libre: reglas deterministas (estado abierto + fecha desc, o coincidencia de `tipoObra`).
- Rate limit por hora requiere índice por `creadoEn`.
- Backfill `EventoCalendario.clienteId`: verificar nombre real de tabla (`@@map`).
- `Contrato.cotizacionId` único parcial: pre-check de duplicados antes de migrar.

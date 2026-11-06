
---

# Implementación de Chatbot con RAG + Guardrails + Caching

## 📋 CONTEXTO DEL REPOSITORIO ACTUAL

### Lo que YA existe en el proyecto:

**Stack técnico:**
- Next.js App Router + TypeScript
- Prisma ORM + PostgreSQL en Neon
- NVIDIA NIM para generación de respuestas del chatbot
- Zod para validaciones
- Auth.js v5 para autenticación

**Estructura del chat actual:**
- Tabla `chat_sesiones` con campos: `id`, `session_id`, `cliente_id`, `cotizacion_id`, `mensaje_count`, `creado_en`
- Tabla `chat_mensajes` con campos: `id`, `sesion_id`, `rol`, `contenido`, `creado_en`
- Route handler en `/api/chat` con validación y rate limiting
- System prompt en `src/lib/chat/system-prompt.ts`
- Validadores Zod en `src/lib/validators/chat.ts`
- Chat post-cotización en `/cotizacion/exito` con panel slide-over
- Integración con NVIDIA NIM para generar respuestas

**Lógica del bot actual:**
- Mensaje inicial personalizado según datos de cotización
- Conocimiento hardcodeado sobre Steel Frame, construcción tradicional, proceso de Constr-art
- Límites definidos (no da precios exactos, no promete tiempos específicos)
- Español neutro, tono amigable y profesional

---

## 🎯 QUÉ SE VA A IMPLEMENTAR

### 1. RAG (Retrieval-Augmented Generation)

**Propósito:** Que el bot responda con conocimiento específico de Constr-art en lugar de conocimiento hardcodeado.

**Lo que se va a agregar:**

**Nueva tabla en la base de datos:**
```
documentos_conocimiento
- id: String (PK)
- titulo: String
- contenido: Text (fragmento de texto)
- embedding: Vector (1536 dimensiones, pgvector)
- categoria: String (ej: "materiales", "proceso", "faq")
- tipo_construccion: String? (ej: "steel_frame", "tradicional")
- metadata: Json?
- creado_en: DateTime
```

**Nuevo servicio:**
```
src/lib/chat/rag-retriever.ts
- Función para buscar documentos relevantes
- Usa pgvector para búsqueda vectorial
- Retorna top 3-5 documentos más relevantes
```

**Nuevo script:**
```
scripts/seed-knowledge.ts
- Lee documentos fuente (PDFs, FAQs, manuales)
- Divide en chunks de 500-800 tokens
- Genera embeddings con NVIDIA NIM
- Guarda en tabla documentos_conocimiento
```

**Modificación al route handler:**
```
/api/chat/route.ts
- Antes de llamar al LLM, buscar documentos relevantes
- Inyectar documentos en el prompt como contexto
- El LLM responde basado en ese contexto
```

**Modificación al system prompt:**
```
src/lib/chat/system-prompt.ts
- Agregar instrucciones de cómo usar el contexto RAG
- Indicar que debe responder basado en el contexto proporcionado
```

---

### 2. Guardrails con Llama Guard

**Propósito:** Sistema de seguridad que valida el input del usuario y el output del LLM para prevenir jailbreaks y respuestas inapropiadas.

**Lo que se va a agregar:**

**Nuevo servicio:**
```
src/lib/chat/guardrails.ts
- Función para validar input del usuario
- Función para validar output del LLM
- Llama a Groq API con modelo Llama Guard
- Retorna "safe" o "unsafe"
```

**Nueva variable de entorno:**
```
.env
GROQ_API_KEY=xxx (nueva API key, separada de NVIDIA_NIM_API_KEY)
```

**Modificación al route handler:**
```
/api/chat/route.ts
- Antes de procesar el mensaje, validar con Llama Guard (INPUT)
- Si es "unsafe", retornar mensaje estándar y no llamar al LLM
- Después de recibir respuesta del LLM, validar con Llama Guard (OUTPUT)
- Si es "unsafe", reemplazar con mensaje estándar
```

**Nota importante:**
- Llama Guard requiere API key de Groq (NO es la misma que NVIDIA NIM)
- Groq tiene free tier: 14,400 llamadas/día
- Llama Guard añade ~200-500ms de latencia por llamada

---

### 3. Function Calling

**Propósito:** Capacidad del LLM de ejecutar funciones definidas (acciones automatizadas).

**Lo que se va a agregar:**

**Nueva tabla en la base de datos (ejemplo para una función posible):**
```
notificaciones_admin
- id: String (PK)
- sesion_id: String (FK a chat_sesiones)
- cliente_id: String (FK a clientes)
- motivo: String
- resumen_conversacion: Text
- prioridad: String (alta/media/baja)
- estado: String (pendiente/atendida)
- creado_en: DateTime
```

**Nuevo archivo de definiciones de funciones:**
```
src/lib/chat/tools.ts
- Definición de funciones disponibles para el LLM
- Las funciones específicas dependen de las necesidades del negocio
```

**Nuevas funciones de ejecución:**
```
src/lib/chat/tool-executors.ts
- Implementación de cada función definida en tools.ts
```

**Modificación al route handler:**
```
/api/chat/route.ts
- Configurar Vercel AI SDK para soportar tool calls
- Si el LLM retorna un tool_call, ejecutar la función correspondiente
- Retornar resultado al LLM para que genere respuesta final
```

**Modificación al system prompt:**
```
src/lib/chat/system-prompt.ts
- Agregar instrucciones de cuándo usar cada función
```

---

### 4. Caching Semántico

**Propósito:** Sistema para reutilizar respuestas a preguntas frecuentes y ahorrar tokens.

**Lo que se va a agregar:**

**Nueva tabla en la base de datos:**
```
cache_respuestas
- id: String (PK)
- pregunta: Text
- pregunta_embedding: Vector (1536 dimensiones)
- respuesta: Text
- uso_count: Int
- ultima_uso: DateTime
- creado_en: DateTime
```

**Nuevo servicio:**
```
src/lib/chat/semantic-cache.ts
- Función para buscar pregunta similar en cache
- Función para guardar nueva respuesta en cache
- Usa pgvector para búsqueda vectorial
- Threshold de similitud: 0.95 (muy estricto)
```

**Modificación al route handler:**
```
/api/chat/route.ts
- Antes de llamar al LLM, buscar pregunta similar en cache
- Si existe (similitud > 0.95), retornar respuesta cacheada
- Si no existe, llamar al LLM y guardar respuesta en cache
```

---

### 5. Actualizaciones a tablas existentes

**Modificación a `chat_sesiones`:**

**Nuevos campos:**
```
- estado: String (valores: "activo", "transferido_a_humano", "cerrado")
- resumen_contexto: Text? (resumen de la conversación)
- canal: String (valores: "web", "whatsapp", default: "web")
```

**Propósito:**
- `estado`: Saber si la sesión fue transferida a un humano
- `resumen_contexto`: Evitar enviar todo el historial al LLM (se actualiza cada 5-6 mensajes)
- `canal`: Diferenciar si el chat viene de web o WhatsApp (preparación para migración futura)

---

## 🔄 FLUJO COMPLETO DEL CHAT (DESPUÉS DE IMPLEMENTACIÓN)

```
Usuario envía mensaje
    ↓
[1] Validación Zod (YA EXISTE)
    ↓
[2] Guardrails INPUT (NUEVO - Llama Guard vía Groq)
    ├─ Si es INSEGURO → Retornar mensaje estándar
    └─ Si es SEGURO → Continuar
    ↓
[3] Caching Semántico (NUEVO - buscar pregunta similar en BD)
    ├─ Si existe (similitud > 0.95) → Retornar respuesta cacheada
    └─ Si no existe → Continuar
    ↓
[4] RAG Retrieval (NUEVO - buscar documentos relevantes en pgvector)
    ├─ Buscar por similitud vectorial
    ├─ Filtrar por metadata (categoria, tipo_construccion)
    └─ Retornar top 3-5 documentos
    ↓
[5] Construir prompt con contexto
    ├─ System prompt (YA EXISTE, se modifica)
    ├─ Contexto RAG (NUEVO - documentos recuperados)
    ├─ Historial resumido (NUEVO - usar resumen_contexto)
    ├─ Datos de cotización (YA EXISTE)
    └─ Mensaje del usuario
    ↓
[6] Function Calling (NUEVO - si el LLM decide ejecutar una función)
    ├─ Ejecutar función según definición en tools.ts
    └─ Retornar resultado al LLM
    ↓
[7] LLM Generativo (YA EXISTE - NVIDIA NIM)
    ├─ Generar respuesta con streaming
    └─ Retornar tokens al frontend
    ↓
[8] Guardrails OUTPUT (NUEVO - Llama Guard vía Groq)
    ├─ Si es INSEGURO → Reemplazar con mensaje estándar
    └─ Si es SEGURO → Continuar
    ↓
[9] Guardar en cache (NUEVO - si es pregunta frecuente)
    ↓
[10] Guardar en chat_mensajes (YA EXISTE)
    ↓
[11] Retornar respuesta al usuario
```

---

## 📁 ESTRUCTURA DE ARCHIVOS (DESPUÉS DE IMPLEMENTACIÓN)

```
src/
├── app/
│   └── api/
│       └── chat/
│           └── route.ts (MODIFICADO - integra todo)
├── lib/
│   └── chat/
│       ├── system-prompt.ts (MODIFICADO - instrucciones para RAG y function calling)
│       ├── rag-retriever.ts (NUEVO - búsqueda vectorial)
│       ├── guardrails.ts (NUEVO - Llama Guard)
│       ├── semantic-cache.ts (NUEVO - caching semántico)
│       ├── tools.ts (NUEVO - definiciones de funciones)
│       └── tool-executors.ts (NUEVO - implementación de funciones)
└── validators/
    └── chat.ts (YA EXISTE)

scripts/
└── seed-knowledge.ts (NUEVO - ingesta de documentos para RAG)

prisma/
└── schema.prisma (MODIFICADO - nuevas tablas)
```

---

## 🗄️ CAMBIOS EN LA BASE DE DATOS

### Nuevas tablas:
1. `documentos_conocimiento` (para RAG)
2. `cache_respuestas` (para caching semántico)
3. `notificaciones_admin` (ejemplo para function calling - puede haber otras según necesidades)

### Modificaciones a tablas existentes:
1. `chat_sesiones` - agregar campos: `estado`, `resumen_contexto`, `canal`

### Extensiones necesarias:
1. Habilitar pgvector en Neon: `CREATE EXTENSION IF NOT EXISTS vector;`
2. Crear índices HNSW en columnas de embeddings para búsqueda rápida

---

## 🔑 VARIABLES DE ENTORNO NECESARIAS

### Ya existen:
```
NVIDIA_NIM_API_KEY=xxx (para generación de respuestas)
DATABASE_URL=xxx (Neon PostgreSQL)
```

### Se van a agregar:
```
GROQ_API_KEY=xxx (para Llama Guard - NUEVA API key, diferente a NVIDIA)
```

---

## ⚙️ CONSIDERACIONES TÉCNICAS

### Performance:
- **Streaming:** Obligatorio para evitar timeouts de Vercel (10s en Hobby plan)
- **Edge Runtime:** Usar `export const runtime = 'edge'` en `/api/chat` para límite de 30s
- **Latencia esperada:** 1-3.3 segundos total (con streaming, usuario ve primer token en ~500ms)

### Costos:
- **NVIDIA NIM:** ~$4/mes para 100 chats/día (después de créditos iniciales gratis)
- **Groq:** Gratis hasta 14,400 llamadas/día (suficiente para ~500 chats/día)
- **Neon:** Gratis hasta 0.5 GB (suficiente para ~10,000 documentos RAG)

### Limitaciones del free tier:
- **Vercel Hobby:** 10 segundos de ejecución (Edge Runtime permite 30s)
- **Neon Free:** 0.5 GB de almacenamiento, cold start de 1-2 segundos
- **Groq Free:** 14,400 llamadas/día, 30 llamadas/minuto

---

## 🚀 ORDEN DE IMPLEMENTACIÓN SUGERIDO

### Fase 1: Preparación (manual, tú lo haces)
1. Crear cuenta en Groq (groq.com) y sacar API key
2. Habilitar pgvector en Neon: `CREATE EXTENSION IF NOT EXISTS vector;`
3. Agregar `GROQ_API_KEY` a `.env` y a variables de entorno de Vercel
4. Preparar documentos para RAG (PDFs, FAQs, manuales)

### Fase 2: Base de datos
1. Actualizar `schema.prisma` con nuevas tablas
2. Ejecutar migración: `npx prisma migrate dev`
3. Crear índices HNSW en columnas de embeddings

### Fase 3: RAG
1. Crear script `seed-knowledge.ts` para ingesta de documentos
2. Crear servicio `rag-retriever.ts` para búsqueda vectorial
3. Modificar `/api/chat` para integrar RAG
4. Actualizar `system-prompt.ts` con instrucciones para RAG

### Fase 4: Guardrails
1. Crear servicio `guardrails.ts` para Llama Guard
2. Modificar `/api/chat` para aplicar guardrails INPUT y OUTPUT

### Fase 5: Function Calling
1. Crear tabla(s) necesaria(s) para las funciones
2. Crear `tools.ts` con definiciones de funciones
3. Crear `tool-executors.ts` con implementación de funciones
4. Modificar `/api/chat` para soportar tool calls
5. Actualizar `system-prompt.ts` con instrucciones para function calling

### Fase 6: Caching Semántico
1. Crear servicio `semantic-cache.ts`
2. Modificar `/api/chat` para integrar caching

### Fase 7: Optimización
1. Implementar resumen de historial (actualizar `resumen_contexto` cada 5-6 mensajes)
2. Probar performance y ajustar si es necesario
3. Monitorear costos y uso de APIs

---

## ⚠️ DECISIONES PENDIENTES (TÚ DECIDES)

### Sobre RAG:
- ¿Qué documentos específicos quieres ingestar? (PDFs, FAQs, manuales, etc.)
- ¿Qué categorías quieres usar? (ej: "materiales", "proceso", "faq", "precios")
- ¿Quieres filtrar por `tipo_construccion`? (ej: solo mostrar documentos de Steel Frame si la cotización es de Steel Frame)

### Sobre Function Calling:
- ¿Qué funciones específicas necesitas? (ejemplos posibles: transferir_a_humano, agendar_visita, enviar_cotizacion_pdf, etc.)
- ¿Qué información debe incluir cada función?
- ¿Qué tablas nuevas necesitas para soportar esas funciones?

### Sobre Guardrails:
- ¿Quieres aplicar guardrails a INPUT, OUTPUT o ambos? (ambos es más seguro pero más lento)
- ¿Qué categorías de riesgo quieres detectar? (ej: jailbreaks, contenido ofensivo, promesas de precios)
- ¿Qué mensaje estándar quieres mostrar cuando se bloquee algo?

### Sobre Caching:
- ¿Qué threshold de similitud quieres usar? (0.95 es muy estricto, 0.90 es más permisivo)
- ¿Cada cuánto quieres limpiar el cache? (ej: cada 30 días eliminar respuestas con uso_count < 5)
- ¿Quieres cachear respuestas con function calling? (generalmente no se recomienda)

---

## 📝 NOTAS PARA EL AGENTE CLI

Este documento describe la lógica de implementación. El agente CLI debe:

1. **Evaluar** si la arquitectura propuesta se adapta al código real del repositorio
2. **Cuestionar** cualquier punto que no le cuadre o que considere mejorable
3. **Adaptar** la implementación a las convenciones de código existentes
4. **No asumir** que existen funciones o servicios que no están mencionados como "YA EXISTE"
5. **Crear** solo lo que está marcado como "NUEVO"
6. **Modificar** solo lo que está marcado como "MODIFICADO"
7. **Respetar** la estructura actual del proyecto y las convenciones establecidas
8. **Preguntar** si algo no está claro o falta información antes de implementar

**IMPORTANTE:** Las funciones específicas para function calling (sección 3) son ejemplos. El agente debe esperar a que el usuario defina qué funciones necesita exactamente antes de implementarlas.

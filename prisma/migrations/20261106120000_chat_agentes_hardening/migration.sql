-- ═══════════════════════════════════════════════════════════════════════════
-- Migración: chat_agentes_hardening
-- Fecha: 2026-11-06
--
-- Objetivos:
--  1. Eliminar el índice UNIQUE sobre chat_sesiones.usuario_id que limitaba a
--     UNA sesión de chat por usuario para siempre (causa de errores P2002 al
--     iniciar una segunda conversación o usar "Nueva conversación").
--  2. Convertir strings libres a enums nativos (cotizaciones, chat, conocimiento).
--  3. Reparar integridad referencial (FKs faltantes, cascade incorrecto).
--  4. Alinear chat_sesiones.cliente_id con la relación opcional (chat anónimo).
--  5. Estado de contrato, kardex de inventario, nombre comercial de obra,
--     límite 0-100 de progreso, timestamps consistentes, índices útiles.
--
-- Es idempotente respecto a datos: todas las conversiones de texto→enum
-- normalizan primero los valores fuera de dominio para no fallar.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Nuevos tipos enum ────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "EstadoCotizacion" AS ENUM ('nuevo', 'contactado', 'contratado', 'no_concretado');
EXCEPTION
  -- el enum ya existe (ej. creado por un intento anterior): continuar
  WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "EstadoContrato" AS ENUM ('borrador', 'firmado', 'anulado', 'finalizado');
EXCEPTION
  -- el enum ya existe (ej. creado por un intento anterior): continuar
  WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "AgenteChat" AS ENUM ('publico', 'cliente', 'admin');
EXCEPTION
  -- el enum ya existe (ej. creado por un intento anterior): continuar
  WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "EstadoChatSesion" AS ENUM ('activa', 'cerrada');
EXCEPTION
  -- el enum ya existe (ej. creado por un intento anterior): continuar
  WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "RolChatMensaje" AS ENUM ('user', 'assistant');
EXCEPTION
  -- el enum ya existe (ej. creado por un intento anterior): continuar
  WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "EstadoChatAccion" AS ENUM ('pendiente', 'ejecutada', 'rechazada', 'fallida');
EXCEPTION
  -- el enum ya existe (ej. creado por un intento anterior): continuar
  WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "AudienciaConocimiento" AS ENUM ('publico', 'cliente', 'admin');
EXCEPTION
  -- el enum ya existe (ej. creado por un intento anterior): continuar
  WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "TipoMovimiento" AS ENUM ('entrada', 'salida', 'ajuste');
EXCEPTION
  -- el enum ya existe (ej. creado por un intento anterior): continuar
  WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Normalización de valores fuera de dominio (defensivo) ────────────────

UPDATE "cotizaciones" SET "estado" = 'nuevo' WHERE "estado" NOT IN ('nuevo', 'contactado', 'contratado', 'no_concretado');
UPDATE "chat_sesiones" SET "agente" = 'publico' WHERE "agente" NOT IN ('publico', 'cliente', 'admin');
UPDATE "chat_sesiones" SET "estado" = 'activa' WHERE "estado" NOT IN ('activa', 'cerrada');
UPDATE "chat_mensajes" SET "rol" = 'assistant' WHERE "rol" NOT IN ('user', 'assistant');
UPDATE "chat_acciones" SET "estado" = 'pendiente' WHERE "estado" NOT IN ('pendiente', 'ejecutada', 'rechazada', 'fallida');
UPDATE "conocimiento" SET "audiencia" = 'publico' WHERE "audiencia" NOT IN ('publico', 'cliente', 'admin');

-- ── 3. Cotizaciones: estado TEXT → enum ─────────────────────────────────────

ALTER TABLE "cotizaciones" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "cotizaciones" ALTER COLUMN "estado" TYPE "EstadoCotizacion" USING ("estado"::"EstadoCotizacion");
ALTER TABLE "cotizaciones" ALTER COLUMN "estado" SET DEFAULT 'nuevo';
DROP INDEX IF EXISTS "cotizaciones_estado_idx";
CREATE INDEX "cotizaciones_estado_creado_en_idx" ON "cotizaciones"("estado", "creado_en");

-- ── 4. Contratos: estado + timestamps ───────────────────────────────────────

ALTER TABLE "contratos" ADD COLUMN "estado" "EstadoContrato" NOT NULL DEFAULT 'borrador';
UPDATE "contratos" SET "estado" = 'firmado' WHERE "fecha_firma" IS NOT NULL;
CREATE INDEX "contratos_estado_idx" ON "contratos"("estado");

ALTER TABLE "contratos" ADD COLUMN "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "contratos" ALTER COLUMN "actualizado_en" DROP DEFAULT;

-- ── 5. Testimonios: obra no obligatoria + cascade correcto + índices ────────

ALTER TABLE "testimonios" ALTER COLUMN "obra_id" DROP NOT NULL;
ALTER TABLE "testimonios" DROP CONSTRAINT IF EXISTS "testimonios_obra_id_fkey";
ALTER TABLE "testimonios" ADD CONSTRAINT "testimonios_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras_activas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
DROP INDEX IF EXISTS "testimonios_estado_idx";
DROP INDEX IF EXISTS "testimonios_publicado_idx";
CREATE INDEX "testimonios_estado_creado_en_idx" ON "testimonios"("estado", "creado_en");

-- ── 6. Proyectos de portafolio: índices duplicados/inútiles fuera ───────────

DROP INDEX IF EXISTS "proyectos_portafolio_slug_idx";
DROP INDEX IF EXISTS "proyectos_portafolio_destacado_idx";

-- ── 7. Actualizaciones de obra: índices booleanos solitarios fuera ──────────

DROP INDEX IF EXISTS "actualizaciones_obra_visible_cliente_idx";
DROP INDEX IF EXISTS "actualizaciones_obra_visto_por_cliente_idx";
DROP INDEX IF EXISTS "actualizaciones_obra_fecha_referencia_idx";
CREATE INDEX "actualizaciones_obra_visible_cliente_fecha_referencia_idx" ON "actualizaciones_obra"("visible_cliente", "fecha_referencia");

-- ── 8. Obras: nombre comercial + límite 0-100 en progreso ───────────────────

ALTER TABLE "obras_activas" ADD COLUMN "nombre_comercial" TEXT;
UPDATE "obras_activas" SET "progreso" = 100 WHERE "progreso" > 100;
UPDATE "obras_activas" SET "progreso" = 0 WHERE "progreso" < 0;
ALTER TABLE "obras_activas" DROP CONSTRAINT IF EXISTS "obras_activas_progreso_check";
ALTER TABLE "obras_activas" ADD CONSTRAINT "obras_activas_progreso_check" CHECK ("progreso" BETWEEN 0 AND 100);

-- ── 9. Préstamos: quién tomó la herramienta + timestamps ────────────────────

ALTER TABLE "prestamos_herramienta" ADD COLUMN "empleado_id" TEXT;
ALTER TABLE "prestamos_herramienta" ADD CONSTRAINT "prestamos_herramienta_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "prestamos_herramienta_empleado_id_idx" ON "prestamos_herramienta"("empleado_id");

ALTER TABLE "prestamos_herramienta" ADD COLUMN "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "prestamos_herramienta" ALTER COLUMN "actualizado_en" DROP DEFAULT;

-- ── 10. Invitaciones: FK del usuario que la creó + timestamps ───────────────

UPDATE "invitaciones_usuario" SET "creado_por" = NULL
  WHERE "creado_por" IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u."id" = "invitaciones_usuario"."creado_por");
ALTER TABLE "invitaciones_usuario" ADD CONSTRAINT "invitaciones_usuario_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invitaciones_usuario" ADD COLUMN "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "invitaciones_usuario" ALTER COLUMN "actualizado_en" DROP DEFAULT;

-- ── 11. Chat: sesiones ──────────────────────────────────────────────────────
--    CRÍTICO: el UNIQUE sobre usuario_id impedía una segunda sesión por
--    usuario (P2002 al reintentar o al abrir una nueva conversación).

DROP INDEX IF EXISTS "chat_sesiones_usuario_id_key";
DROP INDEX IF EXISTS "chat_sesiones_estado_idx";

ALTER TABLE "chat_sesiones" ALTER COLUMN "agente" DROP DEFAULT;
ALTER TABLE "chat_sesiones" ALTER COLUMN "agente" TYPE "AgenteChat" USING ("agente"::"AgenteChat");
ALTER TABLE "chat_sesiones" ALTER COLUMN "agente" SET DEFAULT 'publico';
ALTER TABLE "chat_sesiones" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "chat_sesiones" ALTER COLUMN "estado" TYPE "EstadoChatSesion" USING ("estado"::"EstadoChatSesion");
ALTER TABLE "chat_sesiones" ALTER COLUMN "estado" SET DEFAULT 'activa';

-- cliente_id pasa a opcional (permite sesiones de visitante anónimo) y su FK
-- pasa de RESTRICT a SET NULL (borrar el cliente no debe fallar ni borrar sesiones)
ALTER TABLE "chat_sesiones" ALTER COLUMN "cliente_id" DROP NOT NULL;
ALTER TABLE "chat_sesiones" DROP CONSTRAINT IF EXISTS "chat_sesiones_cliente_id_fkey";
ALTER TABLE "chat_sesiones" ADD CONSTRAINT "chat_sesiones_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "chat_sesiones_usuario_id_idx" ON "chat_sesiones"("usuario_id");
CREATE INDEX "chat_sesiones_estado_ultimo_mensaje_en_idx" ON "chat_sesiones"("estado", "ultimo_mensaje_en");

-- ── 12. Chat: mensajes ──────────────────────────────────────────────────────

ALTER TABLE "chat_mensajes" ALTER COLUMN "rol" DROP DEFAULT;
ALTER TABLE "chat_mensajes" ALTER COLUMN "rol" TYPE "RolChatMensaje" USING ("rol"::"RolChatMensaje");
ALTER TABLE "chat_mensajes" ALTER COLUMN "rol" SET DEFAULT 'user';

-- metadatos fue creado como JSON; Prisma espera JSONB
ALTER TABLE "chat_mensajes" ALTER COLUMN "metadatos" TYPE JSONB USING ("metadatos"::"jsonb");

-- ── 13. Chat: acciones (auditoría) ──────────────────────────────────────────

DROP INDEX IF EXISTS "chat_acciones_estado_idx";
ALTER TABLE "chat_acciones" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "chat_acciones" ALTER COLUMN "estado" TYPE "EstadoChatAccion" USING ("estado"::"EstadoChatAccion");
ALTER TABLE "chat_acciones" ALTER COLUMN "estado" SET DEFAULT 'pendiente';
-- argumentos y resultado fueron creados como JSON; Prisma espera JSONB
ALTER TABLE "chat_acciones" ALTER COLUMN "argumentos" SET DATA TYPE JSONB USING ("argumentos"::"jsonb");
ALTER TABLE "chat_acciones" ALTER COLUMN "resultado" SET DATA TYPE JSONB USING ("resultado"::"jsonb");
CREATE INDEX "chat_acciones_estado_creado_en_idx" ON "chat_acciones"("estado", "creado_en");

-- ── 14. Conocimiento: enum de audiencia + quitar versión sin uso ────────────

DROP INDEX IF EXISTS "conocimiento_categoria_idx";
DROP INDEX IF EXISTS "conocimiento_audiencia_idx";
ALTER TABLE "conocimiento" ALTER COLUMN "audiencia" DROP DEFAULT;
ALTER TABLE "conocimiento" ALTER COLUMN "audiencia" TYPE "AudienciaConocimiento" USING ("audiencia"::"AudienciaConocimiento");
ALTER TABLE "conocimiento" ALTER COLUMN "audiencia" SET DEFAULT 'publico';
ALTER TABLE "conocimiento" DROP COLUMN IF EXISTS "version";
CREATE INDEX "conocimiento_audiencia_categoria_idx" ON "conocimiento"("audiencia", "categoria");

-- ── 15. Kardex de inventario (historial de entradas/salidas/ajustes) ────────

CREATE TABLE IF NOT EXISTS "movimientos_materiales" (
    "id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "obra_id" TEXT,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" DECIMAL(12,2) NOT NULL,
    "costo_unitario" DECIMAL(12,2),
    "usuario_id" TEXT,
    "nota" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_materiales_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "movimientos_materiales_material_id_creado_en_idx" ON "movimientos_materiales"("material_id", "creado_en");
CREATE INDEX "movimientos_materiales_obra_id_idx" ON "movimientos_materiales"("obra_id");
ALTER TABLE "movimientos_materiales" ADD CONSTRAINT "movimientos_materiales_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materiales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_materiales" ADD CONSTRAINT "movimientos_materiales_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras_activas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "movimientos_materiales" ADD CONSTRAINT "movimientos_materiales_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "movimientos_materiales" ALTER COLUMN "actualizado_en" DROP DEFAULT;

-- ── 16. Timestamps consistentes en catálogos y entidades restantes ──────────

ALTER TABLE "servicios" ADD COLUMN IF NOT EXISTS "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "servicios" ALTER COLUMN "actualizado_en" DROP DEFAULT;
ALTER TABLE "faqs" ADD COLUMN IF NOT EXISTS "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "faqs" ALTER COLUMN "actualizado_en" DROP DEFAULT;
ALTER TABLE "certificaciones" ADD COLUMN IF NOT EXISTS "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "certificaciones" ALTER COLUMN "actualizado_en" DROP DEFAULT;
ALTER TABLE "hitos_obra" ADD COLUMN IF NOT EXISTS "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "hitos_obra" ALTER COLUMN "actualizado_en" DROP DEFAULT;
ALTER TABLE "pagos_obra" ADD COLUMN IF NOT EXISTS "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "pagos_obra" ALTER COLUMN "actualizado_en" DROP DEFAULT;
ALTER TABLE "empleados" ADD COLUMN IF NOT EXISTS "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "empleados" ALTER COLUMN "actualizado_en" DROP DEFAULT;
ALTER TABLE "asignaciones_obra" ADD COLUMN IF NOT EXISTS "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "asignaciones_obra" ALTER COLUMN "actualizado_en" DROP DEFAULT;
ALTER TABLE "materiales" ADD COLUMN IF NOT EXISTS "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "materiales" ALTER COLUMN "actualizado_en" DROP DEFAULT;
ALTER TABLE "materiales_obra" ADD COLUMN IF NOT EXISTS "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "materiales_obra" ALTER COLUMN "actualizado_en" DROP DEFAULT;
ALTER TABLE "herramientas" ADD COLUMN IF NOT EXISTS "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "herramientas" ALTER COLUMN "actualizado_en" DROP DEFAULT;

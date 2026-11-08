-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EstadoChatAccion" ADD VALUE 'ejecutando';
ALTER TYPE "EstadoChatAccion" ADD VALUE 'expirada';

-- AlterEnum
ALTER TYPE "EstadoChatSesion" ADD VALUE 'archivada';

-- AlterEnum
ALTER TYPE "TipoEventoCalendario" ADD VALUE 'visita_tecnica';

-- AlterTable
ALTER TABLE "chat_acciones" ADD COLUMN     "expira_en" TIMESTAMP(3),
ADD COLUMN     "precondiciones" JSONB,
ADD COLUMN     "resumen" JSONB;

-- AlterTable
ALTER TABLE "chat_mensajes" ADD COLUMN     "partes" JSONB;

-- AlterTable
ALTER TABLE "chat_sesiones" ADD COLUMN     "archivada_en" TIMESTAMP(3),
ADD COLUMN     "expira_en" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "eventos_calendario" ADD COLUMN     "cliente_id" TEXT;

-- CreateIndex
CREATE INDEX "chat_acciones_usuario_id_estado_idx" ON "chat_acciones"("usuario_id", "estado");

-- CreateIndex
CREATE INDEX "chat_sesiones_usuario_id_agente_ultimo_mensaje_en_idx" ON "chat_sesiones"("usuario_id", "agente", "ultimo_mensaje_en" DESC);

-- CreateIndex
CREATE INDEX "eventos_calendario_cliente_id_fecha_inicio_idx" ON "eventos_calendario"("cliente_id", "fecha_inicio");

-- AddForeignKey
ALTER TABLE "eventos_calendario" ADD CONSTRAINT "eventos_calendario_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill clienteId en eventos_calendario (C.2)
UPDATE eventos_calendario e SET cliente_id = o.cliente_id FROM obras_activas o WHERE e.obra_id = o.id AND e.cliente_id IS NULL;

-- C.1 (parcial) NO aplicado: existen sesiones publicas duplicadas por cotizacion.
-- Se resuelve en la app con findFirst + create dentro de transaccion (ver sesiones.ts).

-- DropForeignKey
ALTER TABLE "cotizaciones" DROP CONSTRAINT "cotizaciones_cliente_id_fkey";

-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "rol" SET DEFAULT 'cliente';

-- AlterTable
ALTER TABLE "cotizaciones" ADD COLUMN     "requerimiento" TEXT,
ALTER COLUMN "cliente_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "contratos" ADD COLUMN     "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "testimonios" ADD COLUMN     "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");

-- CreateIndex
CREATE INDEX "contratos_cliente_id_idx" ON "contratos"("cliente_id");

-- CreateIndex
CREATE INDEX "proyectos_cliente_id_idx" ON "proyectos"("cliente_id");

-- CreateIndex
CREATE INDEX "testimonios_proyecto_id_idx" ON "testimonios"("proyecto_id");

-- CreateIndex
CREATE INDEX "obras_activas_cliente_id_idx" ON "obras_activas"("cliente_id");

-- CreateIndex
CREATE INDEX "obras_activas_contrato_id_idx" ON "obras_activas"("contrato_id");

-- CreateIndex
CREATE INDEX "hitos_obra_obra_id_idx" ON "hitos_obra"("obra_id");

-- CreateIndex
CREATE INDEX "pagos_obra_obra_id_idx" ON "pagos_obra"("obra_id");

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
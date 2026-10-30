-- AlterTable
ALTER TABLE "proyectos" ADD COLUMN "video_url" TEXT,
ADD COLUMN "portada_url" TEXT,
ADD COLUMN "orden" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "m2_construidos" DROP NOT NULL,
ALTER COLUMN "dias_ejecucion" DROP NOT NULL,
ALTER COLUMN "problema_cliente" DROP NOT NULL,
ALTER COLUMN "solucion" DROP NOT NULL;

-- AlterTable
CREATE INDEX "proyectos_publicado_orden_idx" ON "proyectos"("publicado", "orden");

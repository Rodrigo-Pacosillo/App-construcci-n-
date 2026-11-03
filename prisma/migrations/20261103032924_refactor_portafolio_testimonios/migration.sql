/*
  Warnings:

  - You are about to drop the column `cliente_nombre` on the `testimonios` table. All the data in the column will be lost.
  - You are about to drop the column `proyecto_id` on the `testimonios` table. All the data in the column will be lost.
  - You are about to drop the `proyectos` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `obra_id` to the `testimonios` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoMultimedia" AS ENUM ('foto', 'video', 'pdf', 'plano', 'documento', 'otro');

-- CreateEnum
CREATE TYPE "EstadoTestimonio" AS ENUM ('pendiente', 'aprobado', 'rechazado', 'oculto');

-- CreateEnum
CREATE TYPE "TipoEventoCalendario" AS ENUM ('nota', 'recordatorio', 'inicio_etapa', 'fin_etapa', 'entrega', 'reunion', 'otro');

-- DropForeignKey
ALTER TABLE "proyectos" DROP CONSTRAINT "proyectos_cliente_id_fkey";

-- DropForeignKey
ALTER TABLE "testimonios" DROP CONSTRAINT "testimonios_proyecto_id_fkey";

-- DropIndex
DROP INDEX "testimonios_proyecto_id_idx";

-- AlterTable
ALTER TABLE "obras_activas" ADD COLUMN     "plano_distribucion_public_id" TEXT,
ADD COLUMN     "plano_distribucion_url" TEXT;

-- AlterTable
ALTER TABLE "testimonios" DROP COLUMN "cliente_nombre",
DROP COLUMN "proyecto_id",
ADD COLUMN     "cliente_id" TEXT,
ADD COLUMN     "creado_por_usuario_id" TEXT,
ADD COLUMN     "estado" "EstadoTestimonio" NOT NULL DEFAULT 'pendiente',
ADD COLUMN     "nombre_publico" TEXT,
ADD COLUMN     "obra_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "proyectos";

-- CreateTable
CREATE TABLE "proyectos_portafolio" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo_construccion" "TipoConstruccion",
    "m2_construidos" INTEGER,
    "dias_ejecucion" INTEGER,
    "ubicacion" TEXT,
    "portada_url" TEXT,
    "video_url" TEXT,
    "galeria_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proyectos_portafolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_calendario" (
    "id" TEXT NOT NULL,
    "obra_id" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoEventoCalendario" NOT NULL DEFAULT 'nota',
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "todo_el_dia" BOOLEAN NOT NULL DEFAULT true,
    "visible_cliente" BOOLEAN NOT NULL DEFAULT true,
    "creado_por_usuario_id" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_calendario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actualizaciones_obra" (
    "id" TEXT NOT NULL,
    "obra_id" TEXT NOT NULL,
    "tipo" "TipoMultimedia" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "url_archivo" TEXT NOT NULL,
    "cloudinary_public_id" TEXT,
    "thumbnail_url" TEXT,
    "mime_type" TEXT,
    "formato" TEXT,
    "bytes" INTEGER,
    "duracion_segundos" INTEGER,
    "fecha_referencia" TIMESTAMP(3),
    "visible_cliente" BOOLEAN NOT NULL DEFAULT true,
    "visto_por_cliente" BOOLEAN NOT NULL DEFAULT false,
    "subido_por_usuario_id" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actualizaciones_obra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proyectos_portafolio_slug_key" ON "proyectos_portafolio"("slug");

-- CreateIndex
CREATE INDEX "proyectos_portafolio_publicado_orden_idx" ON "proyectos_portafolio"("publicado", "orden");

-- CreateIndex
CREATE INDEX "proyectos_portafolio_destacado_idx" ON "proyectos_portafolio"("destacado");

-- CreateIndex
CREATE INDEX "proyectos_portafolio_slug_idx" ON "proyectos_portafolio"("slug");

-- CreateIndex
CREATE INDEX "eventos_calendario_obra_id_idx" ON "eventos_calendario"("obra_id");

-- CreateIndex
CREATE INDEX "eventos_calendario_fecha_inicio_idx" ON "eventos_calendario"("fecha_inicio");

-- CreateIndex
CREATE INDEX "eventos_calendario_visible_cliente_fecha_inicio_idx" ON "eventos_calendario"("visible_cliente", "fecha_inicio");

-- CreateIndex
CREATE INDEX "actualizaciones_obra_obra_id_idx" ON "actualizaciones_obra"("obra_id");

-- CreateIndex
CREATE INDEX "actualizaciones_obra_tipo_idx" ON "actualizaciones_obra"("tipo");

-- CreateIndex
CREATE INDEX "actualizaciones_obra_visible_cliente_idx" ON "actualizaciones_obra"("visible_cliente");

-- CreateIndex
CREATE INDEX "actualizaciones_obra_visto_por_cliente_idx" ON "actualizaciones_obra"("visto_por_cliente");

-- CreateIndex
CREATE INDEX "actualizaciones_obra_fecha_referencia_idx" ON "actualizaciones_obra"("fecha_referencia");

-- CreateIndex
CREATE INDEX "testimonios_obra_id_idx" ON "testimonios"("obra_id");

-- CreateIndex
CREATE INDEX "testimonios_estado_idx" ON "testimonios"("estado");

-- CreateIndex
CREATE INDEX "testimonios_publicado_idx" ON "testimonios"("publicado");

-- AddForeignKey
ALTER TABLE "testimonios" ADD CONSTRAINT "testimonios_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras_activas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonios" ADD CONSTRAINT "testimonios_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonios" ADD CONSTRAINT "testimonios_creado_por_usuario_id_fkey" FOREIGN KEY ("creado_por_usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_calendario" ADD CONSTRAINT "eventos_calendario_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras_activas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_calendario" ADD CONSTRAINT "eventos_calendario_creado_por_usuario_id_fkey" FOREIGN KEY ("creado_por_usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actualizaciones_obra" ADD CONSTRAINT "actualizaciones_obra_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras_activas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actualizaciones_obra" ADD CONSTRAINT "actualizaciones_obra_subido_por_usuario_id_fkey" FOREIGN KEY ("subido_por_usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

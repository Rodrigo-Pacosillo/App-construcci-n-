-- AlterTable
ALTER TABLE "certificaciones" ADD COLUMN     "image_public_id" TEXT;

-- AlterTable
ALTER TABLE "contratos" ADD COLUMN     "archivo_pdf_public_id" TEXT;

-- AlterTable
ALTER TABLE "cotizaciones" ADD COLUMN     "foto_lote_public_id" TEXT;

-- AlterTable
ALTER TABLE "hitos_obra" ADD COLUMN     "foto_public_id" TEXT;

-- AlterTable
ALTER TABLE "pagos_obra" ADD COLUMN     "comprobante_public_id" TEXT;

-- AlterTable
ALTER TABLE "proyectos_portafolio" ADD COLUMN     "galeria_public_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "portada_public_id" TEXT,
ADD COLUMN     "video_public_id" TEXT;

-- AlterTable
ALTER TABLE "testimonios" ADD COLUMN     "foto_public_id" TEXT;

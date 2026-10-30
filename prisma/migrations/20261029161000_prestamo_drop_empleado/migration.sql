-- DropForeignKey
ALTER TABLE "prestamos_herramienta" DROP CONSTRAINT "prestamos_herramienta_empleado_id_fkey";

-- DropIndex
DROP INDEX "prestamos_herramienta_empleado_id_idx";

-- AlterTable
ALTER TABLE "prestamos_herramienta" DROP COLUMN "empleado_id";

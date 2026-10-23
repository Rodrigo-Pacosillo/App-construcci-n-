-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PlazoInicio" ADD VALUE 'en_1_mes';
ALTER TYPE "PlazoInicio" ADD VALUE 'en_6_meses';

-- AlterTable
ALTER TABLE "clientes" ALTER COLUMN "apellidos" DROP DEFAULT;

-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "apellidos" DROP DEFAULT;

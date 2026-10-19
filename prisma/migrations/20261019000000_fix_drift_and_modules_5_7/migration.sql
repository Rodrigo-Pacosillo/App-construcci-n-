-- CreateEnum
CREATE TYPE "CargoEmpleado" AS ENUM ('ingeniero', 'arquitecto', 'maestro_obra', 'albanil', 'electricista', 'plomero', 'ayudante', 'administrativo');

-- CreateEnum
CREATE TYPE "EstadoHerramienta" AS ENUM ('disponible', 'en_uso', 'mantenimiento', 'baja');

-- AlterTable: usuarios - add apellidos column
ALTER TABLE "usuarios" ADD COLUMN "apellidos" TEXT NOT NULL DEFAULT 'Demo';

-- AlterTable: clientes - add apellidos column and rename whatsapp to telefono
ALTER TABLE "clientes" ADD COLUMN "apellidos" TEXT NOT NULL DEFAULT 'Demo';
ALTER TABLE "clientes" RENAME COLUMN "whatsapp" TO "telefono";

-- CreateTable: empleados
CREATE TABLE "empleados" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "ci" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "cargo" "CargoEmpleado" NOT NULL,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL,
    "salario" DECIMAL(12,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable: asignaciones_obra
CREATE TABLE "asignaciones_obra" (
    "id" TEXT NOT NULL,
    "empleado_id" TEXT NOT NULL,
    "obra_id" TEXT NOT NULL,
    "rol_en_obra" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),

    CONSTRAINT "asignaciones_obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable: materiales
CREATE TABLE "materiales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "stock_actual" DECIMAL(12,2) NOT NULL,
    "stock_minimo" DECIMAL(12,2) NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "materiales_pkey" PRIMARY KEY ("id")
);

-- CreateTable: materiales_obra
CREATE TABLE "materiales_obra" (
    "id" TEXT NOT NULL,
    "obra_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "cantidad" DECIMAL(12,2) NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materiales_obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable: herramientas
CREATE TABLE "herramientas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "estado" "EstadoHerramienta" NOT NULL DEFAULT 'disponible',
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "herramientas_pkey" PRIMARY KEY ("id")
);

-- CreateTable: prestamos_herramienta
CREATE TABLE "prestamos_herramienta" (
    "id" TEXT NOT NULL,
    "herramienta_id" TEXT NOT NULL,
    "empleado_id" TEXT NOT NULL,
    "obra_id" TEXT NOT NULL,
    "fecha_salida" TIMESTAMP(3) NOT NULL,
    "fecha_devolucion" TIMESTAMP(3),
    "observaciones" TEXT,

    CONSTRAINT "prestamos_herramienta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empleados_ci_key" ON "empleados"("ci");

-- CreateIndex
CREATE UNIQUE INDEX "herramientas_codigo_key" ON "herramientas"("codigo");

-- CreateIndex
CREATE INDEX "asignaciones_obra_empleado_id_idx" ON "asignaciones_obra"("empleado_id");

-- CreateIndex
CREATE INDEX "asignaciones_obra_obra_id_idx" ON "asignaciones_obra"("obra_id");

-- CreateIndex
CREATE INDEX "materiales_obra_obra_id_idx" ON "materiales_obra"("obra_id");

-- CreateIndex
CREATE INDEX "materiales_obra_material_id_idx" ON "materiales_obra"("material_id");

-- CreateIndex
CREATE INDEX "prestamos_herramienta_herramienta_id_idx" ON "prestamos_herramienta"("herramienta_id");

-- CreateIndex
CREATE INDEX "prestamos_herramienta_empleado_id_idx" ON "prestamos_herramienta"("empleado_id");

-- CreateIndex
CREATE INDEX "prestamos_herramienta_obra_id_idx" ON "prestamos_herramienta"("obra_id");

-- AddForeignKey
ALTER TABLE "asignaciones_obra" ADD CONSTRAINT "asignaciones_obra_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_obra" ADD CONSTRAINT "asignaciones_obra_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras_activas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales_obra" ADD CONSTRAINT "materiales_obra_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras_activas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales_obra" ADD CONSTRAINT "materiales_obra_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materiales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos_herramienta" ADD CONSTRAINT "prestamos_herramienta_herramienta_id_fkey" FOREIGN KEY ("herramienta_id") REFERENCES "herramientas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos_herramienta" ADD CONSTRAINT "prestamos_herramienta_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos_herramienta" ADD CONSTRAINT "prestamos_herramienta_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras_activas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
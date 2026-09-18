-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('admin', 'cliente');

-- CreateEnum
CREATE TYPE "TipoObra" AS ENUM ('vivienda_nueva', 'ampliacion', 'otro');

-- CreateEnum
CREATE TYPE "TipoConstruccion" AS ENUM ('tradicional', 'seco', 'no_sabe', 'integral');

-- CreateEnum
CREATE TYPE "RangoM2" AS ENUM ('hasta_50', 'm50_100', 'm100_200', 'mas_200');

-- CreateEnum
CREATE TYPE "PlazoInicio" AS ENUM ('lo_antes_posible', 'en_3_meses', 'no_sabe');

-- CreateEnum
CREATE TYPE "FaseFoto" AS ENUM ('antes', 'durante', 'despues');

-- CreateEnum
CREATE TYPE "EstadoObra" AS ENUM ('en_curso', 'pausada', 'finalizada', 'entregada');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('registrado', 'confirmado');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'admin',
    "cliente_id" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT,
    "ciudad" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotizaciones" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "tipo_obra" "TipoObra" NOT NULL,
    "tipo_construccion" "TipoConstruccion" NOT NULL,
    "rango_m2" "RangoM2" NOT NULL,
    "ubicacion_obra" TEXT,
    "plazo_inicio" "PlazoInicio" NOT NULL,
    "origen" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'nuevo',
    "monto_estimado" DECIMAL(12,2),
    "monto_cerrado" DECIMAL(12,2),
    "notas_internas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cotizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "cotizacion_id" TEXT,
    "archivo_pdf_url" TEXT,
    "fecha_firma" TIMESTAMP(3),
    "monto_total" DECIMAL(12,2) NOT NULL,
    "observaciones" TEXT,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyectos" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo_construccion" "TipoConstruccion" NOT NULL,
    "m2_construidos" INTEGER NOT NULL,
    "dias_ejecucion" INTEGER NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "problema_cliente" TEXT NOT NULL,
    "solucion" TEXT NOT NULL,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proyectos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos_proyecto" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fase" "FaseFoto" NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "fotos_proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonios" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT,
    "cliente_nombre" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "foto_url" TEXT,
    "puntaje" INTEGER,
    "autoriza_publicar" BOOLEAN NOT NULL DEFAULT false,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" TEXT NOT NULL,
    "pregunta" TEXT NOT NULL,
    "respuesta" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificaciones" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "certificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "precio_referencia" (
    "id" TEXT NOT NULL,
    "tipo_construccion" "TipoConstruccion" NOT NULL,
    "rango_m2" "RangoM2" NOT NULL,
    "precio_min" DECIMAL(12,2) NOT NULL,
    "precio_max" DECIMAL(12,2) NOT NULL,
    "vigente_desde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "precio_referencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obras_activas" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "contrato_id" TEXT,
    "direccion_obra" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin_estimada" TIMESTAMP(3),
    "estado" "EstadoObra" NOT NULL DEFAULT 'en_curso',
    "progreso" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "obras_activas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hitos_obra" (
    "id" TEXT NOT NULL,
    "obra_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "foto_url" TEXT,
    "visible_cliente" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "hitos_obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_obra" (
    "id" TEXT NOT NULL,
    "obra_id" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "concepto" TEXT NOT NULL,
    "comprobante_url" TEXT,
    "estado" "EstadoPago" NOT NULL DEFAULT 'registrado',

    CONSTRAINT "pagos_obra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cliente_id_key" ON "usuarios"("cliente_id");

-- CreateIndex
CREATE INDEX "cotizaciones_cliente_id_idx" ON "cotizaciones"("cliente_id");

-- CreateIndex
CREATE INDEX "cotizaciones_origen_idx" ON "cotizaciones"("origen");

-- CreateIndex
CREATE INDEX "cotizaciones_estado_idx" ON "cotizaciones"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "proyectos_slug_key" ON "proyectos"("slug");

-- CreateIndex
CREATE INDEX "fotos_proyecto_proyecto_id_idx" ON "fotos_proyecto"("proyecto_id");

-- CreateIndex
CREATE UNIQUE INDEX "servicios_slug_key" ON "servicios"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "precio_referencia_tipo_construccion_rango_m2_vigente_desde_key" ON "precio_referencia"("tipo_construccion", "rango_m2", "vigente_desde");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos_proyecto" ADD CONSTRAINT "fotos_proyecto_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonios" ADD CONSTRAINT "testimonios_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obras_activas" ADD CONSTRAINT "obras_activas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obras_activas" ADD CONSTRAINT "obras_activas_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hitos_obra" ADD CONSTRAINT "hitos_obra_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras_activas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_obra" ADD CONSTRAINT "pagos_obra_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras_activas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

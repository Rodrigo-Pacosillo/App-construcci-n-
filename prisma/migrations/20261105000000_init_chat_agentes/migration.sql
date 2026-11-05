-- AlterTable
ALTER TABLE "chat_sesiones" ADD COLUMN "agente" TEXT NOT NULL DEFAULT 'publico';
ALTER TABLE "chat_sesiones" ADD COLUMN "usuario_id" TEXT;
ALTER TABLE "chat_sesiones" ADD COLUMN "estado" TEXT NOT NULL DEFAULT 'activa';
ALTER TABLE "chat_sesiones" ADD COLUMN "titulo" TEXT;
ALTER TABLE "chat_sesiones" ADD COLUMN "resumen" TEXT;
ALTER TABLE "chat_sesiones" ADD COLUMN "ultimo_mensaje_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "chat_mensajes" ADD COLUMN "metadatos" JSON;

-- AlterTable
ALTER TABLE "cotizaciones" ADD COLUMN "chat_token_issued_en" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "chat_acciones" (
    "id" TEXT NOT NULL,
    "sesion_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "herramienta" TEXT NOT NULL,
    "argumentos" JSON NOT NULL,
    "resultado" JSON,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "error" TEXT,
    "confirmada_por_usuario_id" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ejecutado_en" TIMESTAMP(3),

    CONSTRAINT "chat_acciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conocimiento" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "audiencia" TEXT NOT NULL DEFAULT 'publico',
    "contenido" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conocimiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_sesiones_usuario_id_key" ON "chat_sesiones"("usuario_id");
CREATE INDEX "chat_sesiones_estado_idx" ON "chat_sesiones"("estado");
CREATE INDEX "chat_acciones_sesion_id_idx" ON "chat_acciones"("sesion_id");
CREATE INDEX "chat_acciones_estado_idx" ON "chat_acciones"("estado");
CREATE INDEX "conocimiento_categoria_idx" ON "conocimiento"("categoria");
CREATE INDEX "conocimiento_audiencia_idx" ON "conocimiento"("audiencia");

-- AddForeignKey
ALTER TABLE "chat_sesiones" ADD CONSTRAINT "chat_sesiones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_acciones" ADD CONSTRAINT "chat_acciones_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "chat_sesiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_acciones" ADD CONSTRAINT "chat_acciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chat_acciones" ADD CONSTRAINT "chat_acciones_confirmada_por_usuario_id_fkey" FOREIGN KEY ("confirmada_por_usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

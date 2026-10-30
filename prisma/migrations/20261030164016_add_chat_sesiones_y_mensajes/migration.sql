-- CreateTable
CREATE TABLE "chat_sesiones" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "cotizacion_id" TEXT,
    "mensaje_count" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_mensajes" (
    "id" TEXT NOT NULL,
    "sesion_id" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_mensajes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_sesiones_session_id_key" ON "chat_sesiones"("session_id");

-- CreateIndex
CREATE INDEX "chat_sesiones_cliente_id_idx" ON "chat_sesiones"("cliente_id");

-- CreateIndex
CREATE INDEX "chat_sesiones_cotizacion_id_idx" ON "chat_sesiones"("cotizacion_id");

-- CreateIndex
CREATE INDEX "chat_mensajes_sesion_id_creado_en_idx" ON "chat_mensajes"("sesion_id", "creado_en");

-- AddForeignKey
ALTER TABLE "chat_sesiones" ADD CONSTRAINT "chat_sesiones_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sesiones" ADD CONSTRAINT "chat_sesiones_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_mensajes" ADD CONSTRAINT "chat_mensajes_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "chat_sesiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

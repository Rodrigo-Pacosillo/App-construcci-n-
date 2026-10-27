-- CreateTable
CREATE TABLE "invitaciones_usuario" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,

    CONSTRAINT "invitaciones_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitaciones_usuario_token_key" ON "invitaciones_usuario"("token");

-- CreateIndex
CREATE INDEX "invitaciones_usuario_cliente_id_idx" ON "invitaciones_usuario"("cliente_id");

-- AddForeignKey
ALTER TABLE "invitaciones_usuario" ADD CONSTRAINT "invitaciones_usuario_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

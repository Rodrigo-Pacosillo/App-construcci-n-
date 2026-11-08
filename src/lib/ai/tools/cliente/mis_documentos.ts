import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { ToolContext } from "@/lib/ai/contexto";
import { fechaNegocio } from "@/lib/ai/datos/formato";

export const misDocumentosTool = (ctx: ToolContext) =>
  tool({
    description: "Lista documentos y actualizaciones visibles del cliente (contratos, fotos, planos, etc.).",
    inputSchema: z.object({}),
    execute: async () => {
      const clienteId = ctx.clienteId;
      if (!clienteId) return { estado: "sin_cliente", mensaje: "No hay cliente asociado a la sesion." };

      const [contratos, actualizaciones] = await Promise.all([
        prisma.contrato.findMany({
          where: { clienteId },
          orderBy: { creadoEn: "desc" },
          take: 10,
          select: { estado: true, fechaFirma: true, archivoPdfUrl: true, creadoEn: true, montoTotal: true },
        }),
        prisma.actualizacionObra.findMany({
          where: { obra: { clienteId }, visibleCliente: true },
          orderBy: { creadoEn: "desc" },
          take: 20,
          select: {
            titulo: true,
            tipo: true,
            urlArchivo: true,
            fechaReferencia: true,
            creadoEn: true,
            obra: { select: { nombreComercial: true, direccionObra: true } },
          },
        }),
      ]);

      return {
        estado: "ok",
        contratos: contratos.map((c) => ({
          estado: c.estado,
          fechaFirma: c.fechaFirma ? fechaNegocio(c.fechaFirma) : null,
          montoTotal: Number(c.montoTotal),
          archivo: c.archivoPdfUrl,
          creado: fechaNegocio(c.creadoEn),
        })),
        actualizaciones: actualizaciones.map((a) => ({
          titulo: a.titulo,
          tipo: a.tipo,
          obra: a.obra.nombreComercial ?? a.obra.direccionObra,
          fecha: a.fechaReferencia ? fechaNegocio(a.fechaReferencia) : fechaNegocio(a.creadoEn),
          url: a.urlArchivo,
        })),
      };
    },
  });

export default misDocumentosTool;
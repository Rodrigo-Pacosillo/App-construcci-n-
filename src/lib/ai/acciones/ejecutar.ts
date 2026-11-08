import { prisma } from "@/lib/db";
import { ACCION_EXPIRACION_MIN } from "../config";

export type ResultadoEjecucion =
  | { ok: true; mensaje: string }
  | { ok: false; codigo: string; mensaje: string };

const ALLOWLIST: Record<string, string[]> = {
  admin: ["proponer_cambio_estado_cotizacion", "proponer_evento_calendario"],
  cliente: ["proponer_nota_calendario"],
};

export async function ejecutarChatAccion(params: {
  accionId: string;
  actor: { usuarioId: string; rol: "admin" | "cliente"; clienteId?: string };
}): Promise<ResultadoEjecucion> {
  const { accionId, actor } = params;
  const ahora = new Date();

  // Caducidad perezosa.
  await prisma.chatAccion.updateMany({
    where: { id: accionId, estado: "pendiente", expiraEn: { lt: ahora } },
    data: { estado: "expirada" },
  });

  const accion = await prisma.chatAccion.findUnique({ where: { id: accionId } });
  if (!accion) return { ok: false, codigo: "NO_ENCONTRADA", mensaje: "Accion no encontrada." };
  if (accion.estado !== "pendiente") {
    return { ok: false, codigo: "ACCION_NO_PENDIENTE", mensaje: `La accion ya esta ${accion.estado}.` };
  }
  if (accion.expiraEn && accion.expiraEn < ahora) {
    return { ok: false, codigo: "ACCION_EXPIRADA", mensaje: "La accion expiro. Vuelva a proponerla." };
  }

  // Autorizacion.
  if (actor.rol === "cliente") {
    if (accion.usuarioId !== actor.usuarioId) {
      return { ok: false, codigo: "NO_AUTORIZADO", mensaje: "No puede confirmar acciones de otro usuario." };
    }
  } else {
    if (accion.usuarioId !== actor.usuarioId && actor.rol !== "admin") {
      // admin puede confirmar propias; supervisores no escriben ajenas
    }
  }
  if (!ALLOWLIST[actor.rol]?.includes(accion.herramienta)) {
    return { ok: false, codigo: "NO_AUTORIZADO", mensaje: "Herramienta no permitida para su rol." };
  }

  // Claim atomico.
  const claim = await prisma.chatAccion.updateMany({
    where: { id: accionId, estado: "pendiente", expiraEn: { gt: ahora } },
    data: { estado: "ejecutando", confirmadaPorUsuarioId: actor.usuarioId },
  });
  if (claim.count !== 1) {
    return { ok: false, codigo: "ACCION_NO_PENDIENTE", mensaje: "La accion ya fue tomada o expiro." };
  }

  try {
    const args = accion.argumentos as Record<string, unknown>;
    if (accion.herramienta === "proponer_cambio_estado_cotizacion") {
      const cotizacionId = String(args.cotizacionId);
      const nuevoEstado = String(args.nuevoEstado);
      const cot = await prisma.cotizacion.findUnique({ where: { id: cotizacionId } });
      if (!cot) throw new Error("Cotizacion no encontrada.");
      const estadoAnterior = (accion.precondiciones as { estadoAnterior?: string } | null)?.estadoAnterior;
      if (estadoAnterior && cot.estado !== estadoAnterior) {
        throw new Error("La cotizacion cambio de estado. Vuelva a proponer.");
      }
      if (nuevoEstado === "contratado") {
        const contrato = await prisma.contrato.findFirst({ where: { cotizacionId, estado: { not: "anulado" } } });
        if (!contrato) throw new Error("Cree primero el contrato desde el panel.");
      }
      await prisma.cotizacion.update({ where: { id: cotizacionId }, data: { estado: nuevoEstado as never } });
    } else if (accion.herramienta === "proponer_evento_calendario" || accion.herramienta === "proponer_nota_calendario") {
      const clienteId = actor.rol === "cliente" ? (actor.clienteId as string) : String(args.clienteId);
      const obraId = args.obraId ? String(args.obraId) : null;
      const sinObra = Boolean(args.sinObra);
      const obraFijada = sinObra ? null : obraId;
      // Validar pertenencia.
      if (obraFijada) {
        const obra = await prisma.obraActiva.findFirst({ where: { id: obraFijada, clienteId } });
        if (!obra) throw new Error("La obra no pertenece al cliente.");
      }
      await prisma.eventoCalendario.create({
        data: {
          clienteId,
          obraId: obraFijada,
          titulo: String(args.titulo ?? args.notas ?? "Nota"),
          descripcion: args.descripcion ? String(args.descripcion) : (args.notas ? String(args.notas) : null),
          tipo: (args.tipo as never) ?? "nota",
          fechaInicio: new Date(String(args.fecha ?? args.fechaInicio)),
          fechaFin: args.fechaFin ? new Date(String(args.fechaFin)) : null,
          todoElDia: args.todoElDia === undefined ? true : Boolean(args.todoElDia),
          visibleCliente: obraFijada ? Boolean(args.visibleCliente) : false,
          creadoPorUsuarioId: actor.usuarioId,
        },
      });
    }

    await prisma.chatAccion.update({
      where: { id: accionId },
      data: { estado: "ejecutada", ejecutadoEn: new Date(), resultado: { ok: true } },
    });
    return { ok: true, mensaje: "Accion ejecutada correctamente." };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al ejecutar.";
    await prisma.chatAccion.update({
      where: { id: accionId },
      data: { estado: "fallida", error: msg },
    });
    return { ok: false, codigo: "ERROR", mensaje: msg };
  }
}

export async function rechazarChatAccion(accionId: string, actor: { usuarioId: string }) {
  const claim = await prisma.chatAccion.updateMany({
    where: { id: accionId, estado: "pendiente" },
    data: { estado: "rechazada", confirmadaPorUsuarioId: actor.usuarioId },
  });
  if (claim.count !== 1) return { ok: false, mensaje: "La accion ya no esta pendiente." };
  return { ok: true, mensaje: "Accion rechazada." };
}

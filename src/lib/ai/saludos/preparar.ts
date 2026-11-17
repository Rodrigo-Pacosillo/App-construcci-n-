import { prisma } from "@/lib/db";
import { construirSaludoCliente } from "./cliente";
import { construirSaludoAdmin } from "./admin";

export type SaludoPreparado = {
  texto: string;
  sugerencias: string[];
  clienteId?: string;
};

/**
 * Construye el saludo del agente indicado SIN persistir nada.
 * La creación de la sesión queda fuera: abrir el chat no debe generar historial.
 */
export async function prepararSaludo(params: {
  agente: "cliente" | "admin";
  usuarioId: string;
  nombre?: string | null;
}): Promise<SaludoPreparado> {
  if (params.agente === "cliente") {
    const usuario = await prisma.usuario.findUnique({
      where: { id: params.usuarioId },
      select: { clienteId: true },
    });
    if (!usuario?.clienteId) {
      throw new Error("SIN_CLIENTE");
    }
    const saludo = await construirSaludoCliente({ clienteId: usuario.clienteId });
    return { ...saludo, clienteId: usuario.clienteId };
  }

  const saludo = await construirSaludoAdmin({ nombre: params.nombre ?? "Admin" });
  return saludo;
}

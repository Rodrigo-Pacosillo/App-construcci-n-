import { prisma } from "@/lib/db";
import { normalizarTexto, normalizarTelefono, tokenizar } from "../normalizar";

export type Resolucion<T> =
  | { estado: "unico"; valor: T }
  | { estado: "ambiguo"; opciones: { etiqueta: string }[]; sugerencia: string }
  | { estado: "ninguno"; sugerencia: string };

type ClienteRow = {
  id: string;
  nombre: string;
  apellidos: string;
  email: string | null;
  telefono: string;
  ciudad: string | null;
  usuario: { id: string } | null;
  _count: { cotizaciones: number; obras: number };
};

function etiquetaCliente(c: ClienteRow): string {
  const tel = c.telefono ? `••••${c.telefono.slice(-4)}` : "sin tel";
  const cuenta = c.usuario ? "con cuenta" : "prospecto";
  const correo = c.email ?? "sin correo";
  return `${c.nombre} ${c.apellidos} — ${correo} / ${tel} — ${cuenta}`;
}

export async function resolverCliente(
  texto: string,
  opts?: { soloConCuenta?: boolean }
): Promise<Resolucion<ClienteRow>> {
  const tokens = tokenizar(texto);
  const correoToken = tokens.find((t) => t.includes("@"));
  const telefonoToken = tokens.find((t) => /^\d{6,}$/.test(t.replace(/\D/g, "")));

  // 1. Correo exacto/contains (unico en BD).
  if (correoToken) {
    const c = await prisma.cliente.findFirst({
      where: { email: { equals: correoToken, mode: "insensitive" } },
      include: { usuario: { select: { id: true } }, _count: { select: { cotizaciones: true, obras: true } } },
    });
    if (c) return { estado: "unico", valor: c as unknown as ClienteRow };
    return { estado: "ninguno", sugerencia: "No encontre un cliente con ese correo. Pruebe con nombre, apellido o telefono." };
  }

  // 2. Telefono por sufijo.
  if (telefonoToken) {
    const tel = normalizarTelefono(telefonoToken);
    const sufijo = tel.slice(-6);
    const clientes = await prisma.cliente.findMany({
      include: { usuario: { select: { id: true } }, _count: { select: { cotizaciones: true, obras: true } } },
    });
    const coincidentes = clientes.filter((c) => normalizarTelefono(c.telefono).endsWith(sufijo));
    if (coincidentes.length === 1) return { estado: "unico", valor: coincidentes[0] as unknown as ClienteRow };
    if (coincidentes.length > 1) {
      return {
        estado: "ambiguo",
        opciones: coincidentes.slice(0, 5).map((c) => ({ etiqueta: etiquetaCliente(c as unknown as ClienteRow) })),
        sugerencia: "Hay varios clientes con ese telefono. Indique cual.",
      };
    }
    return { estado: "ninguno", sugerencia: "No encontre un cliente con ese telefono. Pruebe con nombre o correo." };
  }

  // 3. Resto de tokens: AND contra nombre+apellidos+ciudad normalizados.
  const todos = await prisma.cliente.findMany({
    include: { usuario: { select: { id: true } }, _count: { select: { cotizaciones: true, obras: true } } },
  });

  let candidatos = todos as unknown as ClienteRow[];
  if (opts?.soloConCuenta) candidatos = candidatos.filter((c) => c.usuario);

  const tokensNorm = tokens.map(normalizarTexto).filter((t) => !esCorreo(t) && !/^\d{6,}$/.test(t));
  if (tokensNorm.length > 0) {
    candidatos = candidatos.filter((c) => {
      const haystack = normalizarTexto(`${c.nombre} ${c.apellidos} ${c.ciudad ?? ""}`);
      return tokensNorm.every((t) => haystack.includes(t));
    });
  }

  if (candidatos.length === 0) {
    return { estado: "ninguno", sugerencia: "No encontre clientes. Pruebe con apellido, telefono o correo." };
  }
  if (candidatos.length === 1) {
    return { estado: "unico", valor: candidatos[0] };
  }

  // Rankear: con cuenta primero, luego con obra activa, luego actividad reciente.
  candidatos.sort((a, b) => {
    const ca = a.usuario ? 1 : 0;
    const cb = b.usuario ? 1 : 0;
    if (cb !== ca) return cb - ca;
    const oa = a._count.obras;
    const ob = b._count.obras;
    if (ob !== oa) return ob - oa;
    return 0;
  });

  return {
    estado: "ambiguo",
    opciones: candidatos.slice(0, 5).map((c) => ({ etiqueta: etiquetaCliente(c) })),
    sugerencia: "Hay varios clientes que coinciden. Indique cual.",
  };
}

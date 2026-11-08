import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { crearSesion, listarSesiones } from "@/lib/ai/sesiones";
import { construirSaludoCliente } from "@/lib/ai/saludos/cliente";
import { construirSaludoAdmin } from "@/lib/ai/saludos/admin";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: { code: "NO_AUTORIZADO", message: "No autorizado" } }, { status: 403 });
  }
  const agente = (req.nextUrl.searchParams.get("agente") as "cliente" | "admin") || "cliente";
  const lista = await listarSesiones(session.user.id, agente);
  return NextResponse.json(lista);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: { code: "NO_AUTORIZADO", message: "No autorizado" } }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const agente = (body.agente as "cliente" | "admin") || "cliente";
  const sesion = await crearSesion({ usuarioId: session.user.id, agente });
  const saludo = agente === "admin"
    ? await construirSaludoAdmin({ nombre: session.user.name ?? "Admin" })
    : await construirSaludoCliente({ nombre: session.user.name ?? "Cliente" });
  return NextResponse.json({ sessionId: sesion.sessionId, saludo: saludo.texto, sugerencias: saludo.sugerencias });
}

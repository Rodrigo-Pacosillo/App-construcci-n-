import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { archivarSesion, renombrarSesion } from "@/lib/ai/sesiones";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: { code: "NO_AUTORIZADO", message: "No autorizado" } }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  if (body.archivada) {
    await archivarSesion(id);
  }
  if (body.titulo) {
    await renombrarSesion(id, String(body.titulo));
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: { code: "NO_AUTORIZADO", message: "No autorizado" } }, { status: 403 });
  }
  await archivarSesion(id);
  return NextResponse.json({ ok: true });
}

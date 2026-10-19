import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { z } from "zod";

const herramientaSchema = z.object({
  nombre: z.string().min(1).max(100),
  codigo: z.string().min(1).max(50),
  estado: z.enum(["disponible", "en_uso", "mantenimiento", "baja"]),
  activo: z.boolean().default(true),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = herramientaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const existing = await prisma.herramienta.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: { _form: ["Herramienta no encontrada"] } }, { status: 404 });
    }

    await prisma.herramienta.update({ where: { id }, data: parsed.data });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error actualizando herramienta:", error);
    const e = error as { code?: string; meta?: { target?: string[] } };
    if (e.code === "P2002" && e.meta?.target?.includes("codigo")) {
      return NextResponse.json({ success: false, error: { codigo: ["Este código ya está en uso"] } }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: { _form: ["Error al actualizar"] } }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;

  try {
    await prisma.herramienta.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando herramienta:", error);
    return NextResponse.json({ success: false, error: { _form: ["Error al eliminar"] } }, { status: 500 });
  }
}
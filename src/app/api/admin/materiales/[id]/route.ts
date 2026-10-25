import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { z } from "zod";

const materialSchema = z.object({
  nombre: z.string().min(1).max(100),
  unidad: z.string().min(1).max(50),
  stockActual: z.number().min(0),
  stockMinimo: z.number().min(0),
  precioUnitario: z.number().positive(),
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
    const parsed = materialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const existing = await prisma.material.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: { _form: ["Material no encontrado"] } }, { status: 404 });
    }

    await prisma.material.update({ where: { id }, data: parsed.data });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error actualizando material:", error);
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
    await prisma.material.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando material:", error);
    return NextResponse.json({ success: false, error: { _form: ["Error al eliminar"] } }, { status: 500 });
  }
}
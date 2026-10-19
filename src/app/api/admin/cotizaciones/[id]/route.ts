import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { z } from "zod";

const updateSchema = z.object({
  estado: z.enum(["nuevo", "contactado", "visita_tecnica", "presupuestado", "ganado", "perdido"]).optional(),
  montoEstimado: z.number().positive().nullable().optional(),
  montoCerrado: z.number().positive().nullable().optional(),
  notasInternas: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!cotizacion) {
      return NextResponse.json(
        { success: false, error: { _form: ["Cotización no encontrada"] } },
        { status: 404 }
      );
    }

    await prisma.cotizacion.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error actualizando cotización:", error);
    return NextResponse.json(
      { success: false, error: { _form: ["Error al actualizar la cotización"] } },
      { status: 500 }
    );
  }
}
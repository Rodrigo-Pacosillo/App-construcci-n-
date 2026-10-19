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

export async function POST(req: NextRequest) {
  await requireAdmin();

  try {
    const body = await req.json();
    const parsed = materialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    await prisma.material.create({ data: parsed.data });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creando material:", error);
    return NextResponse.json({ success: false, error: { _form: ["Error al crear"] } }, { status: 500 });
  }
}
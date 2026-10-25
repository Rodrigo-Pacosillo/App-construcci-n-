import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { z } from "zod";

const empleadoSchema = z.object({
  nombre: z.string().min(1).max(100),
  apellidos: z.string().min(1).max(100),
  ci: z.string().min(1).max(20),
  telefono: z.string().min(1).max(30),
  cargo: z.enum(["ingeniero", "arquitecto", "maestro_obra", "albanil", "electricista", "plomero", "ayudante", "administrativo"]),
  fechaIngreso: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inválida"),
  salario: z.number().positive().nullable().optional(),
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
    const parsed = empleadoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const existing = await prisma.empleado.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: { _form: ["Empleado no encontrado"] } }, { status: 404 });
    }

    await prisma.empleado.update({
      where: { id },
      data: { ...parsed.data, fechaIngreso: new Date(parsed.data.fechaIngreso), salario: parsed.data.salario ?? null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error actualizando empleado:", error);
    const e = error as { code?: string; meta?: { target?: string[] } };
    if (e.code === "P2002" && e.meta?.target?.includes("ci")) {
      return NextResponse.json({ success: false, error: { ci: ["Este CI ya está registrado"] } }, { status: 400 });
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
    await prisma.empleado.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando empleado:", error);
    return NextResponse.json({ success: false, error: { _form: ["Error al eliminar"] } }, { status: 500 });
  }
}
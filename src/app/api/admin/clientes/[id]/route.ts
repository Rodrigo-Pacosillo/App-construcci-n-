import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();

  const { id } = await params;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: { usuario: { select: { email: true } } },
    });

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: { _form: ["Cliente no encontrado"] } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: cliente.id,
      nombre: cliente.nombre,
      apellidos: cliente.apellidos,
      telefono: cliente.telefono,
      email: cliente.email,
      ciudad: cliente.ciudad,
      usuario: cliente.usuario,
    });
  } catch (error) {
    console.error("Error obteniendo cliente:", error);
    return NextResponse.json(
      { success: false, error: { _form: ["Error al obtener el cliente"] } },
      { status: 500 }
    );
  }
}
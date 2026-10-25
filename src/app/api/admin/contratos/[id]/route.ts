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
    const contrato = await prisma.contrato.findUnique({
      where: { id },
      include: {
        cliente: true,
        cotizacion: true,
        obras: true,
      },
    });

    if (!contrato) {
      return NextResponse.json(
        { success: false, error: { _form: ["Contrato no encontrado"] } },
        { status: 404 }
      );
    }

    return NextResponse.json(contrato);
  } catch (error) {
    console.error("Error obteniendo contrato:", error);
    return NextResponse.json(
      { success: false, error: { _form: ["Error al obtener el contrato"] } },
      { status: 500 }
    );
  }
}
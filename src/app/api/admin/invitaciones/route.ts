import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const clienteId = body.clienteId as string | undefined;

    if (!clienteId) {
      return NextResponse.json({ success: false, error: "clienteId requerido" }, { status: 400 });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true, usuario: { select: { id: true } } },
    });

    if (!cliente) {
      return NextResponse.json({ success: false, error: "Cliente no encontrado" }, { status: 404 });
    }

    if (cliente.usuario?.id) {
      return NextResponse.json({ success: false, error: "El cliente ya tiene una cuenta de usuario" }, { status: 400 });
    }

    // Invalidar invitaciones previas no usadas
    await prisma.invitacionUsuario.updateMany({
      where: { clienteId, usado: false },
      data: { usado: true },
    });

    const token = randomBytes(32).toString("hex");
    const expiraEn = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 horas

    await prisma.invitacionUsuario.create({
      data: {
        clienteId,
        token,
        expiraEn,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || "https://app-construcci-n.vercel.app";
    const link = `${baseUrl}/completar-cuenta?token=${token}`;

    return NextResponse.json({ success: true, link });
  } catch (error) {
    console.error("Error creando invitación:", error);
    return NextResponse.json({ success: false, error: "Error al generar enlace" }, { status: 500 });
  }
}

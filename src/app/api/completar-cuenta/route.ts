import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ success: false, error: "token requerido" }, { status: 400 });
    }

    const invitacion = await prisma.invitacionUsuario.findUnique({
      where: { token },
      select: {
        id: true,
        usado: true,
        expiraEn: true,
        clienteId: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            email: true,
            telefono: true,
            usuario: {
              select: {
                id: true
              }
            }
          },
        },
      },
    }) as {
      id: string;
      usado: boolean;
      expiraEn: Date;
      clienteId: string;
      cliente: {
        id: string;
        nombre: string;
        apellidos: string;
        email: string | null;
        telefono: string;
        usuario: { id: string } | null;
      };
    };

    if (!invitacion) {
      return NextResponse.json({ success: false, error: "Enlace no encontrado" }, { status: 404 });
    }

    if (invitacion.usado) {
      return NextResponse.json({ success: false, error: "El enlace ya fue usado" }, { status: 410 });
    }

    if (new Date(invitacion.expiraEn) < new Date()) {
      return NextResponse.json({ success: false, error: "El enlace ha expirado" }, { status: 410 });
    }

    if (invitacion.cliente.usuario?.id) {
      return NextResponse.json({ success: false, error: "El cliente ya tiene una cuenta de usuario" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      invitacion: {
        id: invitacion.id,
        cliente: {
          id: invitacion.cliente.id,
          nombre: invitacion.cliente.nombre,
          apellidos: invitacion.cliente.apellidos,
          email: invitacion.cliente.email,
          telefono: invitacion.cliente.telefono,
        },
      },
    });
  } catch (error) {
    console.error("Error validando invitación:", error);
    return NextResponse.json({ success: false, error: "Error al validar el enlace" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, email, password } = body as { token?: string; email?: string; password?: string };

    if (!token) {
      return NextResponse.json({ success: false, error: "token requerido" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ success: false, error: "email requerido" }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const invitacion = await prisma.invitacionUsuario.findUnique({
      where: { token },
      select: {
        id: true,
        usado: true,
        expiraEn: true,
        clienteId: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            email: true,
            telefono: true,
            usuario: {
              select: {
                id: true
              }
            }
          },
        },
      },
    }) as {
      id: string;
      usado: boolean;
      expiraEn: Date;
      clienteId: string;
      cliente: {
        id: string;
        nombre: string;
        apellidos: string;
        email: string | null;
        telefono: string;
        usuario: { id: string } | null;
      };
    };

    if (!invitacion) {
      return NextResponse.json({ success: false, error: "Enlace no encontrado" }, { status: 404 });
    }

    if (invitacion.usado) {
      return NextResponse.json({ success: false, error: "El enlace ya fue usado" }, { status: 410 });
    }

    if (new Date(invitacion.expiraEn) < new Date()) {
      return NextResponse.json({ success: false, error: "El enlace ha expirado" }, { status: 410 });
    }

    if (invitacion.cliente.usuario?.id) {
      return NextResponse.json({ success: false, error: "El cliente ya tiene una cuenta de usuario" }, { status: 400 });
    }

    const emailExistente = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true },
    });

    if (emailExistente) {
      return NextResponse.json({ success: false, error: "El email ya está registrado" }, { status: 400 });
    }

    const passwordHash = await hash(password, 10);

    await prisma.$transaction(async (tx) => {
      await tx.usuario.create({
        data: {
          nombre: invitacion.cliente.nombre || "",
          apellidos: invitacion.cliente.apellidos || "",
          email,
          passwordHash,
          rol: "cliente",
          clienteId: invitacion.clienteId,
          activo: true,
        },
      });

      await tx.invitacionUsuario.update({
        where: { id: invitacion.id },
        data: { usado: true },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completando cuenta:", error);
    return NextResponse.json({ success: false, error: "Error al crear la cuenta" }, { status: 500 });
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { cotizacionFormSchema } from "@/lib/validators";
import { uploadFile, deleteFile } from "@/lib/cloudinary";
import { generarChatToken } from "@/lib/tokens";

/**
 * Crea una nueva cotización desde el formulario público
 * - Valida todos los datos con Zod
 * - Solo permite crear para clientes que estén logueados
 * - Para visitantes, se crea sin clienteId (origen: web)
 */
export async function createCotizacion(formData: FormData) {
  const session = await auth();

  // Parsear y validar datos con Zod
  const data = {
    nombre: formData.get("nombre") as string,
    apellidos: formData.get("apellidos") as string,
    telefono: formData.get("telefono") as string,
    email: formData.get("email") as string,
    tipoObra: formData.get("tipoObra") as string,
    tipoConstruccion: formData.get("tipoConstruccion") as string,
    rangoM2: formData.get("rangoM2") as string,
    ubicacionObra: formData.get("ubicacion") as string,
    descripcion: formData.get("descripcion") as string,
    plazoInicio: formData.get("plazoInicio") as string,
  };

  const valid = cotizacionFormSchema.safeParse(data);

  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  // Subir foto del lote a Cloudinary si se envía una.
  let fotoLoteUrl: string | null = null;
  let fotoLotePublicId: string | null = null;
  const fotoLoteFile = formData.get("fotoLote") as File | null;
  if (fotoLoteFile) {
    try {
      const bytes = await fotoLoteFile.arrayBuffer();
      const uploaded = await uploadFile(Buffer.from(bytes), {
        folder: "constr-art/cotizaciones/fotos-lote",
        resourceType: "image",
        filename: fotoLoteFile.name,
      });
      fotoLoteUrl = uploaded.secureUrl;
      fotoLotePublicId = uploaded.publicId;
    } catch (error) {
      console.error("Error subiendo foto de lote:", error);
      return {
        success: false,
        error: {
          _form: ["Error al subir la foto del lote. Intente nuevamente."],
        },
      };
    }
  }

  const { nombre, apellidos, telefono, email, tipoObra, tipoConstruccion, rangoM2, ubicacionObra, descripcion, plazoInicio } =
    valid.data;

  // Resolver el cliente que respalda la cotización.
  // session.user.id es el id de `usuarios`; el id de negocio vive en `clientes`.
  let clienteIdFinal: string | null = null;

  if (session?.user?.role === "cliente") {
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { clienteId: true },
    });
    if (!usuario?.clienteId) {
      return {
        success: false,
        error: {
          _form: ["Su cuenta no está vinculada a un cliente. Comuníquese por WhatsApp."],
        },
      };
    }
    clienteIdFinal = usuario.clienteId;
  } else {
    // Visitante: buscar el cliente existente por email o teléfono o crearlo (find-or-create).
    // La unicidad de clientes.email evita duplicar un lead que ya cotizó antes.
    // telefono no es unique en el schema, usamos findFirst.
    let existente = null;
    if (email) {
      existente = await prisma.cliente.findUnique({ where: { email } });
    }
    if (!existente && telefono) {
      existente = await prisma.cliente.findFirst({ where: { telefono } });
    }
    if (existente) clienteIdFinal = existente.id;

    if (!clienteIdFinal) {
      try {
        const cliente = await prisma.cliente.create({
          data: {
            nombre,
            apellidos,
            telefono,
            email: email || null,
            ciudad: ubicacionObra?.split(",")[1]?.trim() || null,
          },
        });
        clienteIdFinal = cliente.id;
      } catch (error) {
        const e = error as { code?: string };
        if (e?.code === "P2002") {
          const existente = await prisma.cliente.findUnique({ where: { email } });
          if (existente) {
            clienteIdFinal = existente.id;
          }
        }
        if (!clienteIdFinal) {
          console.error("Error creando cliente:", error);
          return {
            success: false,
            error: {
              _form: ["No se pudo registrar su consulta. Inténtelo de nuevo."],
            },
          };
        }
      }
    }
  }

  try {
    const cotizacion = await prisma.cotizacion.create({
      data: {
        clienteId: clienteIdFinal,
        tipoObra,
        tipoConstruccion,
        rangoM2,
        ubicacionObra,
        plazoInicio,
        estado: "nuevo",
        requerimiento: descripcion || null,
        fotoLoteUrl,
        fotoLotePublicId,
        chatTokenIssuedEn: new Date(),
      },
    });

    const chatToken = generarChatToken(cotizacion.id);

    // Invalidar caché para actualizar vistas
    revalidatePath("/cotizacion");
    revalidatePath("/admin");
    revalidatePath("/admin/cotizaciones");

    return {
      success: true,
      data: {
        clienteId: clienteIdFinal,
        cotizacionId: cotizacion.id,
        chatToken,
      },
    };
  } catch (error) {
    // Si falla la BD, borrar la foto ya subida a Cloudinary.
    if (fotoLotePublicId) await deleteFile(fotoLotePublicId, "image");
    console.error("Error creando cotización:", error);
    return {
      success: false,
      error: {
        _form: ["Error al crear la cotización. Intente nuevamente."],
      },
    };
  }
}

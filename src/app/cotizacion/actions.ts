"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { cotizacionSchema } from "@/lib/validators";
import { ESTADOS_COTIZACION } from "@/lib/constants";

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
    whatsapp: formData.get("whatsapp") as string,
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

  const { nombre, whatsapp, email, tipoObra, tipoConstruccion, rangoM2, ubicacionObra, descripcion, plazoInicio } =
    valid.data;

  // Determinar si es cliente o visitante
  const origen = session?.user?.role === "cliente" ? "referido" : "web";
  const clienteId = session?.user?.role === "cliente" ? session.user.id : null;

  // Crear o actualizar cliente
  let clienteIdFinal = clienteId;
  if (!clienteIdFinal) {
    // Crear cliente para visitante
    try {
      const cliente = await prisma.cliente.create({
        data: {
          nombre,
          whatsapp,
          email,
          ciudad: ubicacionObra?.split(',')[1]?.trim() || null, // Extraer ciudad si viene en ubicacion
        },
      });
      clienteIdFinal = cliente.id;
    } catch (error) {
      console.error("Error creando cliente:", error);
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
        origen,
        estado: "nuevo",
        notasInternas: descripcion, // Usar descripcion como notas internas
      },
    });

    // Invalidar caché para actualizar vistas
    revalidatePath("/cotizacion");
    revalidatePath("/admin");
    revalidatePath("/admin/cotizaciones");

    return {
      success: true,
      data: cotizacion,
    };
  } catch (error) {
    console.error("Error creando cotización:", error);
    return {
      success: false,
      error: {
        _form: ["Error al crear la cotización. Intente nuevamente."],
      },
    };
  }
}

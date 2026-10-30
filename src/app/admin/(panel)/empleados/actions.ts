"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { z } from "zod";

const empleadoSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(100),
  apellidos: z.string().min(1, "Apellidos requeridos").max(100),
  ci: z.string().min(1, "CI requerido").max(20),
  telefono: z.string().min(1, "Teléfono requerido").max(30),
  cargo: z.enum(["ingeniero", "arquitecto", "maestro_obra", "albanil", "electricista", "plomero", "ayudante", "administrativo"]),
  fechaIngreso: z.coerce.date({ message: "Fecha inválida" }),
  salario: z.number().positive().optional().nullable(),
  activo: z.boolean().default(true),
});

type EmpleadoInput = z.infer<typeof empleadoSchema>;

export async function getEmpleados() {
  await requireAdmin();

  try {
    return await prisma.empleado.findMany({
      orderBy: { creadoEn: "desc" },
      take: 50,
    });
  } catch (error) {
    console.error("Error en getEmpleados:", error);
    return [];
  }
}

export async function getEmpleadoById(id: string) {
  await requireAdmin();

  try {
    return await prisma.empleado.findUnique({
      where: { id },
      include: { asignaciones: { include: { obra: true } } },
    });
  } catch (error) {
    console.error("Error en getEmpleadoById:", error);
    return null;
  }
}

export async function createEmpleado(formData: FormData) {
  await requireAdmin();

  const data = {
    nombre: formData.get("nombre") as string,
    apellidos: formData.get("apellidos") as string,
    ci: formData.get("ci") as string,
    telefono: formData.get("telefono") as string,
    cargo: formData.get("cargo") as string,
    fechaIngreso: formData.get("fechaIngreso") as string,
    salario: formData.get("salario") ? parseFloat(formData.get("salario") as string) : null,
    activo: formData.get("activo") === "true",
  };

  const parsed = empleadoSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.empleado.create({
      data: {
        ...parsed.data,
        fechaIngreso: new Date(parsed.data.fechaIngreso),
        salario: parsed.data.salario ?? null,
      },
    });
    revalidatePath("/admin/empleados");
    return { success: true };
  } catch (error) {
    console.error("Error creando empleado:", error);
    const e = error as { code?: string; meta?: { target?: string[] } };
    if (e.code === "P2002" && e.meta?.target?.includes("ci")) {
      return { success: false, error: { ci: ["Este CI ya está registrado"] } };
    }
    return { success: false, error: { _form: ["Error al crear el empleado"] } };
  }
}

export async function updateEmpleado(id: string, formData: FormData) {
  await requireAdmin();

  const data = {
    nombre: formData.get("nombre") as string,
    apellidos: formData.get("apellidos") as string,
    ci: formData.get("ci") as string,
    telefono: formData.get("telefono") as string,
    cargo: formData.get("cargo") as string,
    fechaIngreso: formData.get("fechaIngreso") as string,
    salario: formData.get("salario") ? parseFloat(formData.get("salario") as string) : null,
    activo: formData.get("activo") === "true",
  };

  const parsed = empleadoSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.empleado.update({
      where: { id },
      data: {
        ...parsed.data,
        fechaIngreso: new Date(parsed.data.fechaIngreso),
        salario: parsed.data.salario ?? null,
      },
    });
    revalidatePath("/admin/empleados");
    revalidatePath(`/admin/empleados/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error actualizando empleado:", error);
    const e = error as { code?: string; meta?: { target?: string[] } };
    if (e.code === "P2002" && e.meta?.target?.includes("ci")) {
      return { success: false, error: { ci: ["Este CI ya está registrado"] } };
    }
    return { success: false, error: { _form: ["Error al actualizar el empleado"] } };
  }
}

export async function deleteEmpleado(id: string) {
  await requireAdmin();

  try {
    await prisma.empleado.delete({ where: { id } });
    revalidatePath("/admin/empleados");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando empleado:", error);
    return { success: false, error: { _form: ["Error al eliminar el empleado"] } };
  }
}

export const CARGO_LABELS: Record<string, string> = {
  ingeniero: "Ingeniero",
  arquitecto: "Arquitecto",
  maestro_obra: "Maestro de obra",
  albanil: "Albañil",
  electricista: "Electricista",
  plomero: "Plomero",
  ayudante: "Ayudante",
  administrativo: "Administrativo",
};
import { prisma } from "@/lib/db";

export type CategoriaConocimiento =
  | "sitio_web"
  | "servicios"
  | "faq"
  | "tecnico"
  | "proceso"
  | "politica"
  | "otro";

export type AudienciaConocimiento = "publico" | "cliente" | "admin";

/** Categorias que puede ver el publico (y que el cliente hereda). */
export const CATEGORIAS_SITIO: CategoriaConocimiento[] = [
  "sitio_web",
  "servicios",
  "faq",
  "tecnico",
  "proceso",
  "politica",
];

export interface DocConocimiento {
  id: string;
  titulo: string;
  categoria: CategoriaConocimiento;
  audiencia: AudienciaConocimiento;
  contenido: string;
  activo: boolean;
}

export async function obtenerConocimiento(opts: {
  audiencia: AudienciaConocimiento;
  categorias?: CategoriaConocimiento[];
}): Promise<DocConocimiento[]> {
  const { audiencia, categorias } = opts;

  const donde: Record<string, unknown> = {
    activo: true,
  };

  if (audiencia === "publico") {
    donde.audiencia = "publico";
  } else if (audiencia === "cliente") {
    donde.OR = [{ audiencia: "publico" }, { audiencia: "cliente" }];
  }
  // admin puede leer todo

  if (categorias && categorias.length > 0) {
    donde.categoria = { in: categorias };
  }

  const docs = await prisma.conocimiento.findMany({
    where: donde,
    orderBy: [{ categoria: "asc" }, { titulo: "asc" }],
  });

  return docs.map((d) => ({
    id: d.id,
    titulo: d.titulo,
    categoria: d.categoria as CategoriaConocimiento,
    audiencia: d.audiencia as AudienciaConocimiento,
    contenido: d.contenido,
    activo: d.activo,
  }));
}

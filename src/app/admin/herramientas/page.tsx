import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { HerramientasList } from "@/components/admin/HerramientasList";

export default async function AdminHerramientasPage() {
  await requireAdmin();

  const herramientas = await prisma.herramienta.findMany({
    orderBy: { nombre: "asc" },
    take: 100,
  });

  return <HerramientasList herramientas={herramientas} />;
}
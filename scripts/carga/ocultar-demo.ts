// scripts/carga/ocultar-demo.ts
// Uso: npx tsx --env-file=.env scripts/carga/ocultar-demo.ts
import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  const demo = [
    "casa-steel-frame-santa-cruz",
    "ampliacion-zona-sur-la-paz",
    "local-comercial-santa-cruz",
    "quinta-rehabilitacion",
    "oficinas-empresariales",
    "casa-ecologica-cochabamba",
  ];
  const r = await prisma.proyectoPortafolio.updateMany({
    where: { slug: { in: demo } },
    data: { publicado: false },
  });
  console.log(`Demo ocultada: ${r.count} proyectos`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
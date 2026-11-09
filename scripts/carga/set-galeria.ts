// scripts/carga/set-galeria.ts
// Uso: npx tsx --env-file=.env scripts/carga/set-galeria.ts <slug> scripts/carga/manifest-<slug>.json
// (si --env-file no está disponible: npm i -D dotenv  y agrega  import "dotenv/config";  arriba)
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

async function main() {
  const [slug, manifiestoPath] = process.argv.slice(2);
  if (!slug || !manifiestoPath) throw new Error("Uso: tsx set-galeria.ts <slug> <manifest.json>");
  const { portadaUrl, portadaPublicId, urls, publicIds } = JSON.parse(fs.readFileSync(manifiestoPath, "utf8"));

  const prisma = new PrismaClient();
  const existe = await prisma.proyectoPortafolio.findUnique({ where: { slug } });
  if (!existe) {
    await prisma.proyectoPortafolio.create({
      data: {
        slug,
        titulo: slug,
        ubicacion: null,
        portadaUrl,
        portadaPublicId,
        galeriaUrls: urls,
        galeriaPublicIds: publicIds,
        videoUrl: null,
        videoPublicId: null,
        publicado: false,
      },
    });
    console.log(`✅ Creado ${slug} con ${urls.length} fotos`);
  } else {
    await prisma.proyectoPortafolio.update({
      where: { slug },
      data: {
        portadaUrl: portadaUrl ?? existe.portadaUrl,
        portadaPublicId: portadaPublicId ?? existe.portadaPublicId,
        galeriaUrls: urls,
        galeriaPublicIds: publicIds,
      },
    });
    console.log(`✅ Actualizado ${slug} con ${urls.length} fotos`);
  }
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
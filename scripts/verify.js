const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.proyectoPortafolio.findMany({
    where: { publicado: true },
    select: { slug: true, titulo: true, portadaUrl: true, galeriaUrls: true, tipoConstruccion: true, ubicacion: true }
  });
  console.log('Proyectos publicados:');
  projects.forEach(p => {
    console.log('  - ' + p.titulo + ' (' + p.slug + ')');
    console.log('    Tipo: ' + p.tipoConstruccion + ', Ubicación: ' + p.ubicacion);
    console.log('    Portada: ' + (p.portadaUrl ? 'Sí' : 'No'));
    console.log('    Galería: ' + (p.galeriaUrls?.length || 0) + ' imágenes');
  });
  await prisma['']();
}

main().catch(async (e) => { console.error(e); await prisma[''](); });

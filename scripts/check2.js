const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.proyectoPortafolio.findMany({ where: { publicado: true } }).then(r => {
  r.forEach(x => console.log(x.titulo + " | " + x.ubicacion + " | portada: " + (x.portadaUrl ? "SI" : "NO") + " | galeria: " + (x.galeriaUrls?.length || 0)));
  p.$disconnect();
});
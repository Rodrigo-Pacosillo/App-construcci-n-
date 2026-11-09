const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.proyectoPortafolio.findMany().then(r => {
  r.forEach(x => console.log(x.slug + '|' + x.titulo + '|' + x.ubicacion + '|' + x.portadaUrl));
  p['']();
});

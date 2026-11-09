const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: 'fjub0euv',
  api_key: '668584167358333',
  api_secret: 'sqN8oeqQ4-9wZEo5Do66hmAth1Q',
  secure: true,
});

const prisma = new PrismaClient();
const FOTOS_BASE = path.join(process.cwd(), 'fotos');

// Map existing projects (from seed) to new data + photo folders
// Seed creates 6 projects in this order:
const EXISTING_SLUGS = [
  'casa-steel-frame-santa-cruz',      // 1
  'ampliacion-zona-sur-la-paz',       // 2
  'local-comercial-santa-cruz',       // 3
  'quinta-rehabilitacion',            // 4
  'oficinas-empresariales',           // 5
  'casa-ecologica-cochabamba',        // 6
];

const PROJECT_MAPPING = [
  { 
    oldSlug: 'casa-steel-frame-santa-cruz',
    newSlug: 'plaza-isabela-catolica-asfi',
    folder: 'proyecto1',
    titulo: 'Plaza Isabela Católica ASFI',
    tipoConstruccion: 'integral',
    ubicacion: 'Santa Cruz de la Sierra, Bolivia',
  },
  { 
    oldSlug: 'ampliacion-zona-sur-la-paz',
    newSlug: 'remodelacion-residencia-diego',
    folder: 'proyecto2',
    titulo: 'Remodelación Residencia Diego',
    tipoConstruccion: 'integral',
    ubicacion: 'Zona cercanía al aeropuerto, Santa Cruz, Bolivia',
  },
  { 
    oldSlug: 'local-comercial-santa-cruz',
    newSlug: 'campamento-corporativo-pan-silver',
    folder: 'proyecto3',
    titulo: 'Campamento Corporativo Pan Silver',
    tipoConstruccion: 'seco',
    ubicacion: 'Bolivia',
  },
];

function uploadFile(buffer, folder, resourceType = 'image', filename) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType, use_filename: !!filename, unique_filename: !!filename },
      (error, result) => {
        if (error || !result) reject(error || new Error('Error subiendo a Cloudinary'));
        else resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
}

async function main() {
  console.log('?? Iniciando actualización de proyectos y subida de imágenes...\n');

  for (const project of PROJECT_MAPPING) {
    console.log('\n?? Actualizando: ' + project.titulo + ' (desde ' + project.oldSlug + ')');
    try {
      await prisma.proyectoPortafolio.update({
        where: { slug: project.oldSlug },
        data: { 
          slug: project.newSlug,
          titulo: project.titulo, 
          tipoConstruccion: project.tipoConstruccion, 
          ubicacion: project.ubicacion, 
          publicado: true 
        },
      });
      console.log('   ? Datos actualizados, slug cambiado a: ' + project.newSlug);
    } catch (e) {
      console.log('   Error: ' + e.message);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('?? SUBIDA DE IMÁGENES A CLOUDINARY');
  console.log('='.repeat(50));

  for (const project of PROJECT_MAPPING) {
    const projectFolder = path.join(FOTOS_BASE, project.folder);
    if (!fs.existsSync(projectFolder)) { console.log('??  No existe: ' + projectFolder); continue; }

    const files = fs.readdirSync(projectFolder).filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f)).sort();
    if (files.length === 0) { console.log('??  Sin imágenes en: ' + project.folder); continue; }

    console.log('\n?? ' + project.folder + ' (' + files.length + ' imágenes) ? ' + project.titulo);

    const portadaFile = files[0];
    const galeriaFiles = files.slice(1, 11);

    console.log('   ?? Portada: ' + portadaFile);
    const portadaUpload = await uploadFile(fs.readFileSync(path.join(projectFolder, portadaFile)), 'constr-art/proyectos/portadas', 'image', portadaFile);
    console.log('   ? ' + portadaUpload.secureUrl);

    const galeriaUrls = [], galeriaPublicIds = [];
    for (const file of galeriaFiles) {
      console.log('   ?? Galería: ' + file);
      const upload = await uploadFile(fs.readFileSync(path.join(projectFolder, file)), 'constr-art/proyectos/galeria', 'image', file);
      galeriaUrls.push(upload.secureUrl); galeriaPublicIds.push(upload.publicId);
      console.log('   ? ' + upload.secureUrl);
    }

    console.log('   ?? BD: ' + project.newSlug);
    await prisma.proyectoPortafolio.update({
      where: { slug: project.newSlug },
      data: { portadaUrl: portadaUpload.secureUrl, portadaPublicId: portadaUpload.publicId, galeriaUrls, galeriaPublicIds, publicado: true },
    });
    console.log('   ? BD actualizada');
  }

  console.log('\n?? ¡Completado!');
  await prisma['']();
}

main().catch(async (e) => { console.error('?', e); await prisma[''](); process.exit(1); });

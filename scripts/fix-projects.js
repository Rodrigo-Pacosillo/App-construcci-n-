const { PrismaClient } = require("@prisma/client");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

cloudinary.config({
  cloud_name: "fjub0euv",
  api_key: "668584167358333",
  api_secret: "sqN8oeqQ4-9wZEo5Do66hmAth1Q",
  secure: true,
});

const prisma = new PrismaClient();
const FOTOS_BASE = path.join(process.cwd(), "fotos");

const PROJECT_FIXES = [
  {
    slug: "plaza-isabela-catolica-asfi",
    titulo: "Plaza Isabela Cat\u00f3lica ASFI",
    ubicacion: "Santa Cruz de la Sierra, Bolivia",
    coverFile: "WhatsApp Image 2026-11-08 at 8.41.26 PM (1).jpeg",
    folder: "proyecto1",
  },
  {
    slug: "remodelacion-residencia-diego",
    titulo: "Remodelaci\u00f3n Residencia Diego",
    ubicacion: "Zona cercan\u00eda al aeropuerto, Santa Cruz, Bolivia",
    coverFile: "WhatsApp Image 2026-11-08 at 9.23.26 PM (1).jpeg",
    folder: "proyecto2",
  },
  {
    slug: "campamento-corporativo-pan-silver",
    titulo: "Campamento Corporativo Pan Silver",
    ubicacion: "Bolivia",
    coverFile: "WhatsApp Image 2026-11-08 at 9.57.26 PM.jpeg",
    folder: "proyecto3",
  },
];

function uploadFile(buffer, folder, resourceType, filename) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType, use_filename: !!filename, unique_filename: !!filename },
      (error, result) => {
        if (error || !result) reject(error || new Error("Error subiendo a Cloudinary"));
        else resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
}

async function main() {
  console.log("Fixing project data and cover images...");

  for (const project of PROJECT_FIXES) {
    const projectFolder = path.join(FOTOS_BASE, project.folder);
    const coverPath = path.join(projectFolder, project.coverFile);

    console.log("Updating: " + project.titulo);

    console.log("  Uploading cover: " + project.coverFile);
    const coverUpload = await uploadFile(
      fs.readFileSync(coverPath),
      "constr-art/proyectos/portadas",
      "image",
      project.coverFile
    );
    console.log("  Cover URL: " + coverUpload.secureUrl);

    await prisma.proyectoPortafolio.update({
      where: { slug: project.slug },
      data: {
        titulo: project.titulo,
        ubicacion: project.ubicacion,
        portadaUrl: coverUpload.secureUrl,
        portadaPublicId: coverUpload.publicId,
      },
    });
    console.log("  DB updated successfully");
  }

  console.log("All projects fixed!");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Error:", e);
  await prisma.$disconnect();
  process.exit(1);
});
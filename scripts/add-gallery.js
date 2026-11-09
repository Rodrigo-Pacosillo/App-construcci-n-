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

const PROJECTS = [
  { slug: "plaza-isabela-catolica-asfi", folder: "proyecto1", currentGallery: 10 },
  { slug: "remodelacion-residencia-diego", folder: "proyecto2", currentGallery: 10 },
  { slug: "campamento-corporativo-pan-silver", folder: "proyecto3", currentGallery: 10 },
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
  console.log("Adding 2 more gallery images per project (10 -> 12)...\n");

  for (const project of PROJECTS) {
    const projectFolder = path.join(FOTOS_BASE, project.folder);
    const files = fs.readdirSync(projectFolder).filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f)).sort();

    // Get the next 2 images (indices 11 and 12, since 0 is cover and 1-10 are gallery)
    const newFiles = files.slice(11, 13);

    console.log(project.slug + ": adding " + newFiles.length + " images");

    // Get existing project data
    const existing = await prisma.proyectoPortafolio.findUnique({
      where: { slug: project.slug },
      select: { galeriaUrls: true, galeriaPublicIds: true },
    });

    const galeriaUrls = [...(existing.galeriaUrls || [])];
    const galeriaPublicIds = [...(existing.galeriaPublicIds || [])];

    for (const file of newFiles) {
      console.log("  Uploading: " + file);
      const upload = await uploadFile(
        fs.readFileSync(path.join(projectFolder, file)),
        "constr-art/proyectos/galeria",
        "image",
        file
      );
      galeriaUrls.push(upload.secureUrl);
      galeriaPublicIds.push(upload.publicId);
      console.log("  OK: " + upload.secureUrl);
    }

    await prisma.proyectoPortafolio.update({
      where: { slug: project.slug },
      data: { galeriaUrls, galeriaPublicIds },
    });
    console.log("  Updated: now " + galeriaUrls.length + " gallery images\n");
  }

  console.log("Done!");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Error:", e);
  await prisma.$disconnect();
  process.exit(1);
});
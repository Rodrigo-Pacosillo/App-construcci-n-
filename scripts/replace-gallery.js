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
  { slug: "plaza-isabela-catolica-asfi", folder: "proyecto1" },
  { slug: "remodelacion-residencia-diego", folder: "proyecto2" },
  { slug: "campamento-corporativo-pan-silver", folder: "proyecto3" },
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
  console.log("Replacing gallery with 12 selected images per project...\n");
  console.log("NOTE: Cover images (portadas) will NOT be changed.\n");

  for (const project of PROJECTS) {
    const projectFolder = path.join(FOTOS_BASE, project.folder);
    const files = fs.readdirSync(projectFolder).filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f)).sort();

    console.log(project.slug + ": " + files.length + " images found");

    // Get existing project (to preserve portada)
    const existing = await prisma.proyectoPortafolio.findUnique({
      where: { slug: project.slug },
      select: { portadaUrl: true, portadaPublicId: true, galeriaPublicIds: true },
    });

    // Delete old gallery images from Cloudinary
    console.log("  Deleting old gallery images...");
    for (const pid of (existing.galeriaPublicIds || [])) {
      await cloudinary.uploader.destroy(pid, { resource_type: "image" });
    }

    // Upload new 12 gallery images
    const galeriaUrls = [];
    const galeriaPublicIds = [];

    for (const file of files) {
      console.log("  Uploading: " + file);
      const upload = await uploadFile(
        fs.readFileSync(path.join(projectFolder, file)),
        "constr-art/proyectos/galeria",
        "image",
        file
      );
      galeriaUrls.push(upload.secureUrl);
      galeriaPublicIds.push(upload.publicId);
    }

    // Update DB: only gallery, NOT portada
    await prisma.proyectoPortafolio.update({
      where: { slug: project.slug },
      data: {
        galeriaUrls,
        galeriaPublicIds,
      },
    });

    console.log("  Done: " + galeriaUrls.length + " gallery images. Portada unchanged.\n");
  }

  console.log("All galleries replaced!");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Error:", e);
  await prisma.$disconnect();
  process.exit(1);
});
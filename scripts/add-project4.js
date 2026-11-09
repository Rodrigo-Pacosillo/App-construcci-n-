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
const FOTOS_BASE = path.join(process.cwd(), "fotos", "proyecto4");

const COVER_FILE = "WhatsApp Image 2026-11-08 at 9.33.48 PM.jpeg";
const VIDEO_FILE = "WhatsApp Video 2026-11-08 at 9.33.46 PM.mp4";

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
  console.log("Creating project 4: Construccion de campamento mina bedrock...\n");

  // Get all image files except the cover
  const allFiles = fs.readdirSync(FOTOS_BASE).filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f)).sort();
  const galleryFiles = allFiles.filter(f => f !== COVER_FILE);

  console.log("Total images: " + allFiles.length);
  console.log("Cover: " + COVER_FILE);
  console.log("Gallery: " + galleryFiles.length + " images");
  console.log("Video: " + VIDEO_FILE + "\n");

  // Upload cover
  console.log("Uploading cover...");
  const coverUpload = await uploadFile(
    fs.readFileSync(path.join(FOTOS_BASE, COVER_FILE)),
    "constr-art/proyectos/portadas",
    "image",
    COVER_FILE
  );
  console.log("Cover URL: " + coverUpload.secureUrl);

  // Upload gallery
  const galeriaUrls = [];
  const galeriaPublicIds = [];
  for (const file of galleryFiles) {
    console.log("Uploading gallery: " + file);
    const upload = await uploadFile(
      fs.readFileSync(path.join(FOTOS_BASE, file)),
      "constr-art/proyectos/galeria",
      "image",
      file
    );
    galeriaUrls.push(upload.secureUrl);
    galeriaPublicIds.push(upload.publicId);
  }

  // Upload video
  console.log("Uploading video: " + VIDEO_FILE);
  const videoUpload = await uploadFile(
    fs.readFileSync(path.join(FOTOS_BASE, VIDEO_FILE)),
    "constr-art/proyectos/videos",
    "video",
    VIDEO_FILE
  );
  console.log("Video URL: " + videoUpload.secureUrl);

  // Create project in DB
  console.log("\nCreating project in DB...");
  await prisma.proyectoPortafolio.create({
    data: {
      slug: "construccion-campamento-mina-bedrock",
      titulo: "Construcción de Campamento Mina Bedrock",
      tipoConstruccion: "seco",
      ubicacion: "Guadalupe, Potosí, Bolivia",
      orden: 4,
      destacado: true,
      publicado: true,
      portadaUrl: coverUpload.secureUrl,
      portadaPublicId: coverUpload.publicId,
      videoUrl: videoUpload.secureUrl,
      videoPublicId: videoUpload.publicId,
      galeriaUrls,
      galeriaPublicIds,
    },
  });

  console.log("Project created successfully!");
  console.log("  Slug: construccion-campamento-mina-bedrock");
  console.log("  Titulo: Construcción de Campamento Mina Bedrock");
  console.log("  Galeria: " + galeriaUrls.length + " images");
  console.log("  Video: SI");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Error:", e);
  await prisma.$disconnect();
  process.exit(1);
});
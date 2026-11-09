// scripts/carga/subir-proyecto.mjs
// Uso: node scripts/carga/subir-proyecto.mjs <slug> <carpeta_fotos_renombradas> [ruta_portada.jpg]
// Requiere CLOUDINARY_URL en el entorno (misma variable que usa la app).
import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs";
import path from "node:path";

const [slug, carpeta, portada] = process.argv.slice(2);
if (!slug || !carpeta) {
  console.error("Uso: node subir-proyecto.mjs <slug> <carpeta> [portada.jpg]");
  process.exit(1);
}
cloudinary.config({ secure: true });

const manifiesto = { slug, portadaUrl: null, portadaPublicId: null, urls: [], publicIds: [] };

if (portada) {
  const r = await cloudinary.uploader.upload(portada, {
    folder: `constr-art/proyectos/${slug}/portada`,
    public_id: `${slug}-portada`,
    overwrite: false,
  });
  manifiesto.portadaUrl = r.secure_url;
  manifiesto.portadaPublicId = r.public_id;
  console.log(`  ✓ portada → ${r.public_id}`);
}

const fotos = fs.readdirSync(carpeta).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
for (const f of fotos) {
  const num = path.basename(f).match(/g-(\d+)\./)?.[1] ?? String(manifiesto.urls.length + 1);
  const r = await cloudinary.uploader.upload(path.join(carpeta, f), {
    folder: `constr-art/proyectos/${slug}/galeria`,
    public_id: `${slug}-g-${num}`,
    overwrite: false,
  });
  manifiesto.urls.push(r.secure_url);
  manifiesto.publicIds.push(r.public_id);
  console.log(`  ✓ ${f} → ${r.public_id} (${(r.bytes / 1024).toFixed(0)} KB)`);
}

const out = `scripts/carga/manifest-${slug}.json`;
fs.writeFileSync(out, JSON.stringify(manifiesto, null, 2));
console.log(`✅ Listo: ${manifiesto.urls.length} fotos + ${manifiesto.portadaUrl ? "portada" : "sin portada"}. Manifiesto: ${out}`);
// scripts/carga/renombrar.mjs
// Uso: node scripts/carga/renombrar.mjs <carpeta_origen> <carpeta_destino> <slug>
import fs from "node:fs";
import path from "node:path";

const [origen, destino, slug] = process.argv.slice(2);
if (!origen || !destino || !slug) {
  console.error("Uso: node renombrar.mjs <origen> <destino> <slug>");
  process.exit(1);
}

fs.mkdirSync(destino, { recursive: true });
const fotos = fs.readdirSync(origen)
  .filter((f) => /\.(jpe?g|png)$/i.test(f))
  .sort();

fotos.forEach((f, i) => {
  const n = String(i + 1).padStart(2, "0");
  fs.copyFileSync(path.join(origen, f), path.join(destino, `${slug}-g-${n}.jpg`));
});

console.log(`✅ ${fotos.length} fotos renombradas (orden alfabético) en ${destino}`);
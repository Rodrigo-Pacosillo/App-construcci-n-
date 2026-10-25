import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const OUT_DIR = 'public/img/hero';
const BLUR_OUT = 'src/data/hero-blur.json';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
const dataDir = path.dirname(BLUR_OUT);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const FILES = {
  estructura: 'public/img/proyectos/img_reales/1.jpeg',
  cerramiento: 'public/img/proyectos/img_reales/2.jpeg',
  fachada: 'public/img/proyectos/img_reales/3.jpeg',
  acabados: 'public/img/proyectos/img_reales/4.jpeg',
};

const blur = {};

async function run() {
  const results = [];
  for (const [name, src] of Object.entries(FILES)) {
    const meta = await sharp(src).rotate().metadata();
    await sharp(src)
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true, kernel: 'lanczos3' })
      .sharpen({ sigma: 0.5 })
      .webp({ quality: 82, effort: 6 })
      .toFile(path.join(OUT_DIR, `${name}.webp`));
    
    const buf = await sharp(src).rotate().resize(24, 32, { fit: 'cover' }).webp({ quality: 40 }).toBuffer();
    blur[name] = `data:image/webp;base64,${buf.toString('base64')}`;
    
    const st = fs.statSync(path.join(OUT_DIR, `${name}.webp`));
    results.push({ name, dims: `${meta.width}x${meta.height}`, kb: Math.round(st.size/1024) });
  }
  fs.writeFileSync(BLUR_OUT, JSON.stringify(blur, null, 2));
  console.table(results);
}

run().catch(e => { console.error(e); process.exit(1); });

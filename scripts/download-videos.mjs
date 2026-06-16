import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar el diccionario (como texto para extraer las URLs por regex)
const dataPath = path.join(__dirname, '..', 'src', 'lib', 'lscData.ts');
const dataContent = fs.readFileSync(dataPath, 'utf8');

// Extraer todas las URLs de los videos
const regex = /url:\s*["'](https:\/\/huggingface\.co[^"']+\.mp4)["']/g;
let match;
const urls = new Set();

while ((match = regex.exec(dataContent)) !== null) {
  urls.add(match[1]);
}

console.log(`Encontrados ${urls.size} videos únicos para descargar.`);

const videosDir = path.join(__dirname, '..', 'public', 'videos');
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

async function downloadVideo(url) {
  const filename = decodeURIComponent(url.split('/').pop());
  const dest = path.join(videosDir, filename);

  if (fs.existsSync(dest)) {
    console.log(`[SALTANDO] ${filename} ya existe.`);
    return;
  }

  console.log(`[DESCARGANDO] ${filename}...`);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(dest, Buffer.from(buffer));
    console.log(`[OK] ${filename}`);
  } catch (err) {
    console.error(`[ERROR] Falló la descarga de ${filename}: ${err.message}`);
  }
}

async function run() {
  for (const url of urls) {
    await downloadVideo(url);
  }
  console.log('¡Descarga de videos completada!');
}

run();

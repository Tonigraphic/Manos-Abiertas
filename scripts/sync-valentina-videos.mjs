import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const publicVideosDir = path.join(projectRoot, 'public', 'videos');

const REPO_ID = process.env.VITE_HF_SUGGESTIONS_REPO || 'manosabiertas/Manos-Abiertas-LSC';
const TOKEN = process.env.VITE_HF_SUGGESTIONS_TOKEN || process.env.VITE_HF_TRANSLATION_TOKEN || process.env.VITE_HF_TOKEN;

async function syncValentinaVideos() {
  console.log(`🔍 Buscando grabaciones de Valentina Mora en Hugging Face repo: ${REPO_ID}...`);
  
  if (!fs.existsSync(publicVideosDir)) {
    fs.mkdirSync(publicVideosDir, { recursive: true });
  }

  const headers = {};
  if (TOKEN) {
    headers['Authorization'] = `Bearer ${TOKEN}`;
  }

  try {
    const treeRes = await fetch(`https://huggingface.co/api/models/${REPO_ID}/tree/main/grabaciones_valentina`, { headers });
    if (!treeRes.ok) {
      console.log(`⚠️ No se encontró la carpeta 'grabaciones_valentina' en el repositorio ${REPO_ID}. Exiting.`);
      return;
    }

    const categories = await treeRes.json();
    let totalDownloaded = 0;

    for (const catFolder of categories) {
      if (catFolder.type !== 'directory') continue;
      
      const wordsRes = await fetch(`https://huggingface.co/api/models/${REPO_ID}/tree/main/${catFolder.path}`, { headers });
      if (!wordsRes.ok) continue;
      const wordFolders = await wordsRes.json();

      for (const wordFolder of wordFolders) {
        if (wordFolder.type !== 'directory') continue;

        const filesRes = await fetch(`https://huggingface.co/api/models/${REPO_ID}/tree/main/${wordFolder.path}`, { headers });
        if (!filesRes.ok) continue;
        const files = await filesRes.json();
        
        const metadataFile = files.find(f => f.path.endsWith('metadata.json'));
        if (!metadataFile) continue;

        const rawRes = await fetch(`https://huggingface.co/${REPO_ID}/raw/main/${metadataFile.path}`, { headers });
        if (!rawRes.ok) continue;
        const data = await rawRes.json();

        if (data.word && data.videoBase64) {
          const cleanWordName = data.word.toUpperCase().replace(/\s+/g, '_');
          const destPath = path.join(publicVideosDir, `${cleanWordName}.mp4`);
          
          // Decode Base64 to binary buffer
          const base64Data = data.videoBase64.replace(/^data:video\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          
          fs.writeFileSync(destPath, buffer);
          console.log(`✓ Descargado y guardado: public/videos/${cleanWordName}.mp4`);
          totalDownloaded++;
        }
      }
    }

    console.log(`🎉 Proceso completado. ${totalDownloaded} videos sincronizados a public/videos/.`);
  } catch (error) {
    console.error(`❌ Error en la sincronización:`, error);
  }
}

syncValentinaVideos();

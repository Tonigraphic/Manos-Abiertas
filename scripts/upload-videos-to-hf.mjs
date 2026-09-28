import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Cargar variables de entorno manualmente de .env.local si existe
const envPath = path.join(projectRoot, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valParts] = trimmed.split('=');
      const value = valParts.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  }
}

const REPO_ID = process.env.VITE_HF_SUGGESTIONS_REPO || process.env.HF_SUGGESTIONS_REPO || 'manosabiertas/Manos-Abiertas-LSC';
const TOKEN = process.env.VITE_HF_SUGGESTIONS_TOKEN || process.env.VITE_HF_TRANSLATION_TOKEN || process.env.HF_TOKEN || process.env.HF_TRANSLATION_TOKEN;

const sourceDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(projectRoot, 'videos_to_upload');

// Mapeo simple de categorías para señas conocidas
const WORD_CATEGORIES = {
  A: 'abecedario', B: 'abecedario', C: 'abecedario', D: 'abecedario', E: 'abecedario',
  F: 'abecedario', G: 'abecedario', H: 'abecedario', I: 'abecedario', J: 'abecedario',
  K: 'abecedario', L: 'abecedario', LL: 'abecedario', M: 'abecedario', N: 'abecedario',
  Ñ: 'abecedario', O: 'abecedario', P: 'abecedario', Q: 'abecedario', R: 'abecedario',
  RR: 'abecedario', S: 'abecedario', T: 'abecedario', U: 'abecedario', V: 'abecedario',
  W: 'abecedario', X: 'abecedario', Y: 'abecedario', Z: 'abecedario',
  
  AMARILLO: 'colores', AZUL: 'colores', BLANCO: 'colores', NEGRO: 'colores', ROJO: 'colores',
  
  AGUA: 'diseño', CAPAS: 'diseño', HOJAS: 'diseño', LÁPIZ: 'diseño', MATERIALES: 'diseño',
  PERSPECTIVA: 'diseño', PINCEL: 'diseño', SEPARAR: 'diseño', TEXTURA: 'diseño', VOLUMEN: 'diseño',
  
  ENVIAR_TAREA: 'oficina', HORARIO: 'oficina', HORARIO_DE_CLASE: 'oficina', HORARIO_DE_MATERIA: 'oficina',
  MATRICULA_ACADEMICA: 'oficina', MATRICULA_FINANCIERA: 'oficina', MATRÍCULA_MATERIAS: 'oficina',
  PROCESO_DE_MATRÍCULA: 'oficina', SOLICITAR_CERTIFICADO: 'oficina',
  
  GRACIAS: 'saludos', HOLA: 'saludos', MI_NOMBRE: 'saludos', MI_SEÑA: 'saludos', PROFESOR: 'saludos'
};

async function uploadVideos() {
  console.log('🚀 Iniciando script de carga a Hugging Face...');
  console.log(`📦 Repositorio objetivo: ${REPO_ID}`);
  console.log(`📁 Directorio de origen: ${sourceDir}`);

  if (!TOKEN) {
    console.error('❌ ERROR: No se encontró ningún token de Hugging Face (VITE_HF_SUGGESTIONS_TOKEN o HF_TOKEN) en .env.local ni en variables de entorno.');
    console.log('Por favor agrega HF_TOKEN=tu_token_de_hf en .env.local y vuelve a intentarlo.');
    process.exit(1);
  }

  if (!fs.existsSync(sourceDir)) {
    console.log(`📁 Creando directorio de origen: ${sourceDir}`);
    fs.mkdirSync(sourceDir, { recursive: true });
    console.log(`💡 Coloca tus archivos .mp4 o .webm dentro de '${sourceDir}' y vuelve a ejecutar este script.`);
    console.log(`   Ejemplo de nombre de archivo: HOLA.mp4, AMARILLO.mp4, A.mp4`);
    return;
  }

  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.mp4') || f.endsWith('.webm'));

  if (files.length === 0) {
    console.log(`⚠️ No se encontraron archivos .mp4 o .webm en ${sourceDir}`);
    console.log(`💡 Coloca los nuevos videos en '${sourceDir}' para subirlos.`);
    return;
  }

  console.log(`📹 Encontrados ${files.length} video(s) para subir.\n`);

  for (const file of files) {
    const filePath = path.join(sourceDir, file);
    const wordRaw = path.parse(file).name;
    const wordClean = wordRaw.toUpperCase().replace(/\s+/g, '_');
    const category = WORD_CATEGORIES[wordClean] || 'general';
    const folderPath = `grabaciones_valentina/${category}/${wordClean}`;

    console.log(`⏳ Procesando ${file} -> palabra: "${wordClean}", categoría: "${category}"...`);

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(file).replace('.', '') || 'mp4';
    const videoBase64 = `data:video/${ext};base64,` + fileBuffer.toString('base64');

    const metadataData = {
      word: wordClean.replace(/_/g, ' '),
      category,
      recordedBy: 'Valentina Mora',
      recordedAt: new Date().toISOString(),
      fileName: file,
      videoBase64
    };

    const operations = [
      {
        key: 'header',
        value: {
          summary: `Actualización de seña: ${wordClean} (${category})`,
          description: `Nuevo video grabado cargado mediante script para ${wordClean}`
        }
      },
      {
        key: 'file',
        value: {
          path: `${folderPath}/metadata.json`,
          content: JSON.stringify(metadataData, null, 2)
        }
      }
    ];

    try {
      const response = await fetch(`https://huggingface.co/api/models/${REPO_ID}/commit/main?create_pr=1`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/x-ndjson',
        },
        body: operations.map(x => JSON.stringify(x)).join('\n'),
      });

      if (response.ok) {
        console.log(`  ✅ Exitoso: ${wordClean} cargado en Hugging Face!`);
      } else {
        const errText = await response.text();
        console.error(`  ❌ Error al subir ${wordClean} (HTTP ${response.status}):`, errText);
      }
    } catch (err) {
      console.error(`  ❌ Error de conexión al subir ${wordClean}:`, err.message);
    }
  }

  console.log('\n🎉 Proceso de carga finalizado.');
}

uploadVideos();

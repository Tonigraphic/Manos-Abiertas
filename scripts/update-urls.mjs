import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '..', 'src', 'lib', 'lscData.ts');
let data = fs.readFileSync(dataPath, 'utf8');

// Reemplazar la URL de huggingface por la ruta local decodificada
data = data.replace(/https:\/\/huggingface\.co[^"']+\/([^"']+)/g, (match, p1) => '/videos/' + decodeURIComponent(p1));

fs.writeFileSync(dataPath, data);
console.log('URLs actualizadas en lscData.ts');

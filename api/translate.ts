export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

type TranslateRequest = {
  text?: string;
};

function stripCodeFences(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, match => match.replace(/```/g, ''))
    .replace(/^['"“”]+|['"“”]+$/g, '')
    .trim();
}

function extractGeneratedText(payload: any): string {
  if (!payload) return '';

  if (typeof payload === 'string') {
    return payload;
  }

  if (Array.isArray(payload)) {
    const first = payload[0];
    if (typeof first === 'string') return first;
    if (first?.generated_text) return String(first.generated_text);
    if (first?.summary_text) return String(first.summary_text);
  }

  if (payload.generated_text) {
    return String(payload.generated_text);
  }

  if (payload.summary_text) {
    return String(payload.summary_text);
  }

  return '';
}

function buildPrompt(input: string): string {
  return [
    'Eres un corrector experto en español colombiano y en texto escrito por personas sordas usuarias de Lengua de Señas Colombiana.',
    'Tu tarea es convertir el texto de entrada al español convencional natural, sin explicar el proceso.',
    'Reglas:',
    '- Devuelve solo la versión final corregida.',
    '- No agregues conectores si no son necesarios.',
    '- No inventes significado.',
    '- Si el texto ya está correcto, devuélvelo casi igual.',
    '- Conserva nombres propios y términos técnicos.',
    '',
    `Texto: ${input}`,
    'Respuesta:'
  ].join('\n');
}

function cleanTranslation(text: string): string {
  const cleaned = stripCodeFences(text)
    .replace(/^Respuesta:\s*/i, '')
    .replace(/^Texto:\s*/i, '')
    .replace(/^[-•*]\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

const TEMPORAL_ADVERBS = new Set([
  'ayer',
  'anoche',
  'antes',
  'hoy',
  'mañana',
  'ahora',
]);

const PAST_IRREGULARS: Record<string, string> = {
  ver: 'vi',
  ir: 'fui',
  ser: 'fui',
  tener: 'tuve',
  hacer: 'hice',
  poder: 'pude',
  poner: 'puse',
  decir: 'dije',
  venir: 'vine',
  querer: 'quise',
  saber: 'supe',
  salir: 'salí',
  dar: 'di',
  traer: 'traje',
  haber: 'hube',
};

const PRESENT_IRREGULARS: Record<string, string> = {
  ver: 'veo',
  ir: 'voy',
  ser: 'soy',
  tener: 'tengo',
  hacer: 'hago',
  poder: 'puedo',
  poner: 'pongo',
  decir: 'digo',
  venir: 'vengo',
  querer: 'quiero',
  saber: 'sé',
  salir: 'salgo',
  dar: 'doy',
  traer: 'traigo',
  haber: 'he',
};

function isVerbLike(word: string): boolean {
  const normalized = word.toLowerCase();
  return normalized.endsWith('ar') || normalized.endsWith('er') || normalized.endsWith('ir') || normalized in PAST_IRREGULARS || normalized in PRESENT_IRREGULARS;
}

function conjugatePastFirstPerson(word: string): string {
  const normalized = word.toLowerCase();

  if (normalized in PAST_IRREGULARS) {
    return PAST_IRREGULARS[normalized];
  }

  if (normalized.endsWith('ar')) {
    return `${normalized.slice(0, -2)}é`;
  }

  if (normalized.endsWith('er') || normalized.endsWith('ir')) {
    return `${normalized.slice(0, -2)}í`;
  }

  return normalized;
}

function conjugatePresentFirstPerson(word: string): string {
  const normalized = word.toLowerCase();

  if (normalized in PRESENT_IRREGULARS) {
    return PRESENT_IRREGULARS[normalized];
  }

  if (normalized.endsWith('ar') || normalized.endsWith('er') || normalized.endsWith('ir')) {
    return `${normalized.slice(0, -2)}o`;
  }

  return normalized;
}

function fallbackTranslation(input: string): string {
  const cleaned = input
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  const words = cleaned.split(' ');
  const firstWord = words[0].toLowerCase();
  const secondWord = words[1]?.toLowerCase() || '';

  if (TEMPORAL_ADVERBS.has(firstWord) && secondWord && isVerbLike(secondWord)) {
    const remainder = words.slice(2).join(' ');
    const conjugated = conjugatePastFirstPerson(secondWord);
    return `${firstWord.charAt(0).toUpperCase() + firstWord.slice(1)} ${conjugated}${remainder ? ` ${remainder}` : ''}.`;
  }

  if ((firstWord === 'yo' || firstWord === 'me' || firstWord === 'mi') && secondWord && isVerbLike(secondWord)) {
    const remainder = words.slice(2).join(' ');
    const conjugated = conjugatePresentFirstPerson(secondWord);
    return `${firstWord.charAt(0).toUpperCase() + firstWord.slice(1)} ${conjugated}${remainder ? ` ${remainder}` : ''}.`;
  }

  if (isVerbLike(firstWord)) {
    const remainder = words.slice(1).join(' ');
    const conjugated = conjugatePresentFirstPerson(firstWord);
    return `${conjugated.charAt(0).toUpperCase() + conjugated.slice(1)}${remainder ? ` ${remainder}` : ''}.`;
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1) + (/[.!?]$/.test(cleaned) ? '' : '.');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body as TranslateRequest;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Missing text' });
    }

    const localFallback = fallbackTranslation(text);
    const HF_TOKEN = process.env.HF_TOKEN;
    const MODEL_ID = process.env.HF_TRANSLATION_MODEL || 'Qwen/Qwen2.5-1.5B-Instruct';

    if (!HF_TOKEN) {
      return res.status(200).json({
        success: true,
        provider: 'local',
        simulated: true,
        translatedText: localFallback,
      });
    }

    const response = await fetchWithTimeout(`https://api-inference.huggingface.co/models/${MODEL_ID}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: buildPrompt(text),
        parameters: {
          max_new_tokens: 128,
          temperature: 0.2,
          top_p: 0.9,
          return_full_text: false,
        },
        options: {
          wait_for_model: false,
        },
      }),
    }, 8000);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face translation API Error:', errorText);
      return res.status(200).json({
        success: true,
        provider: 'local-fallback',
        translatedText: localFallback,
      });
    }

    const payload = await response.json();
    const generatedText = cleanTranslation(extractGeneratedText(payload));

    return res.status(200).json({
      success: true,
      provider: 'huggingface',
      model: MODEL_ID,
      translatedText: generatedText || localFallback,
    });
  } catch (error) {
    console.error('Error procesando traducción:', error);
    return res.status(200).json({
      success: true,
      provider: 'local-fallback',
      translatedText: fallbackTranslation(String(req.body?.text || '')),
    });
  }
}
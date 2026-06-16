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

// Heurística local de fallback por si la API falla
const TEMPORAL_ADVERBS = new Set(['ayer', 'anoche', 'antes', 'hoy', 'mañana', 'ahora']);
const PAST_IRREGULARS: Record<string, string> = { ver: 'vi', ir: 'fui', ser: 'fui', tener: 'tuve', hacer: 'hice', poder: 'pude', poner: 'puse', decir: 'dije', venir: 'vine', querer: 'quise', saber: 'supe', salir: 'salí', dar: 'di', traer: 'traje', haber: 'hube' };
const PRESENT_IRREGULARS: Record<string, string> = { ver: 'veo', ir: 'voy', ser: 'soy', tener: 'tengo', hacer: 'hago', poder: 'puedo', poner: 'pongo', decir: 'digo', venir: 'vengo', querer: 'quiero', saber: 'sé', salir: 'salgo', dar: 'doy', traer: 'traigo', haber: 'he' };

function isVerbLike(word: string): boolean {
  const normalized = word.toLowerCase();
  return normalized.endsWith('ar') || normalized.endsWith('er') || normalized.endsWith('ir') || normalized in PAST_IRREGULARS || normalized in PRESENT_IRREGULARS;
}
function conjugatePastFirstPerson(word: string): string {
  const normalized = word.toLowerCase();
  if (normalized in PAST_IRREGULARS) return PAST_IRREGULARS[normalized];
  if (normalized.endsWith('ar')) return `${normalized.slice(0, -2)}é`;
  if (normalized.endsWith('er') || normalized.endsWith('ir')) return `${normalized.slice(0, -2)}í`;
  return normalized;
}
function conjugatePresentFirstPerson(word: string): string {
  const normalized = word.toLowerCase();
  if (normalized in PRESENT_IRREGULARS) return PRESENT_IRREGULARS[normalized];
  if (normalized.endsWith('ar') || normalized.endsWith('er') || normalized.endsWith('ir')) return `${normalized.slice(0, -2)}o`;
  return normalized;
}
function destinationWithPreposition(raw: string): string {
  const destMap: Record<string, string> = { universidad: 'a la universidad', escuela: 'a la escuela', oficina: 'a la oficina', casa: 'a casa', trabajo: 'al trabajo', colegio: 'al colegio', hospital: 'al hospital', parque: 'al parque' };
  return destMap[raw.toLowerCase()] || `a ${raw.toLowerCase()}`;
}
function fallbackTranslation(input: string): string {
  const cleaned = input.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const words = cleaned.split(' ');
  const firstWord = words[0].toLowerCase();
  const secondWord = words[1]?.toLowerCase() || '';

  if (TEMPORAL_ADVERBS.has(firstWord) && secondWord && isVerbLike(secondWord)) {
    const conjugated = conjugatePastFirstPerson(secondWord);
    const remainder = words.slice(2).join(' ');
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
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      return res.status(200).json({
        success: true,
        provider: 'local-fallback',
        reason: 'OPENAI_API_KEY no configurado. Se usó traductor manual local.',
        tokenSource: 'none',
        translatedText: localFallback,
      });
    }

    const systemPrompt = `Eres un corrector experto en español colombiano y en texto escrito por personas sordas usuarias de Lengua de Señas Colombiana (LSC).
Tu tarea es convertir el texto ingresado (glosas o español sordo) al español convencional natural, sin explicar el proceso.
Reglas:
1. Devuelve SOLO la versión final corregida.
2. Agrega artículos, conectores y conjuga los verbos correctamente.
3. No inventes significado extra.
4. Si el texto ya está correcto, devuélvelo igual.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Modelo rápido y económico
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.2,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Error:', response.status, errorText);
      throw new Error(`OpenAI API status ${response.status}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content?.trim();

    if (!translatedText) {
      throw new Error('Respuesta vacía de OpenAI');
    }

    return res.status(200).json({
      success: true,
      provider: 'openai',
      model: 'gpt-4o-mini',
      tokenSource: 'env',
      translatedText,
    });

  } catch (error: any) {
    console.error('Error procesando traducción con OpenAI:', error);
    return res.status(200).json({
      success: true,
      provider: 'local-fallback',
      reason: `Error conectando con OpenAI: ${error.message}. Se usó el fallback manual.`,
      tokenSource: process.env.OPENAI_API_KEY ? 'present' : 'none',
      translatedText: fallbackTranslation(String(req.body?.text || '')),
    });
  }
}
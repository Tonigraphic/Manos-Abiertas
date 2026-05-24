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

function fallbackTranslation(input: string): string {
  const cleaned = input
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
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
    const MODEL_ID = process.env.HF_TRANSLATION_MODEL || 'Qwen/Qwen2.5-7B-Instruct';

    if (!HF_TOKEN) {
      return res.status(200).json({
        success: true,
        provider: 'local',
        simulated: true,
        translatedText: localFallback,
      });
    }

    const response = await fetch(`https://api-inference.huggingface.co/models/${MODEL_ID}`, {
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
          wait_for_model: true,
        },
      }),
    });

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
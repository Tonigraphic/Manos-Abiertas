export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

// debug payload removed

type TranslateRequest = {
  text?: string;
  mode?: 'hearing' | 'deaf';
};

const DEFAULT_HF_MODELS = [
  'openai/gpt-oss-20b',
  'Qwen/Qwen2.5-1.5B-Instruct',
  'mistralai/Mistral-7B-Instruct-v0.3',
  'google/gemma-2-2b-it',
];

const DEFAULT_CLASSIC_HF_MODELS = [
  'google/flan-t5-base',
  'google/flan-t5-small',
];

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

function buildMessages(input: string, compact = false, context?: string) {
  const systemContent = compact
    ? [
        'Corrige el texto al español natural.',
        'Devuelve solo la versión final.',
        'No expliques el proceso.',
      ].join('\n')
    : [
        'Eres un corrector experto en español colombiano y en texto escrito por personas sordas usuarias de Lengua de Señas Colombiana.',
        'Tu tarea es convertir el texto de entrada al español convencional natural, sin explicar el proceso.',
        'Reglas:',
        '- Devuelve solo la versión final corregida.',
        '- No agregues conectores si no son necesarios.',
        '- No inventes significado.',
        '- Si el texto ya está correcto, devuélvelo casi igual.',
        '- Conserva nombres propios y términos técnicos.',
      ].join('\n');

  const messages: any[] = [
    {
      role: 'system',
      content: systemContent,
    },
  ];

  if (context && context.trim()) {
    messages.push({ role: 'assistant', content: `Contexto previo: ${context.trim()}` });
  }

  messages.push({ role: 'user', content: `Texto: ${input}` });

  return messages;
}

  function normalizeModelId(model: string): string {
    return model
    .trim()
    .replace(/^['"`]+|['"`]+$/g, '')
    .replace(/[.,;:]+$/g, '')
    .trim();
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

function isLongInput(text: string): boolean {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return text.length > 110 || words > 14;
}

function splitIntoChunks(text: string, maxWords = 20): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n+/).map(part => part.trim()).filter(Boolean);
  const chunks: string[] = [];
  const pushWordChunks = (input: string) => {
    const words = input.split(/\s+/).filter(Boolean);
    let segment: string[] = [];

    for (const word of words) {
      segment.push(word);
      if (segment.length >= maxWords) {
        chunks.push(segment.join(' '));
        segment = [];
      }
    }

    if (segment.length) {
      chunks.push(segment.join(' '));
    }
  };

  for (const paragraph of paragraphs) {
    const sentences = paragraph.match(/[^.!?]+[.!?]*|[^.!?]+$/g) || [paragraph];
    for (const sentence of sentences) {
      const cleanedSentence = sentence.trim();
      if (!cleanedSentence) continue;
      const clauses = cleanedSentence.split(/,|;|\bpero\b|\by\b/gi).map(part => part.trim()).filter(Boolean);
      if (clauses.length > 1) {
        for (const clause of clauses) {
          pushWordChunks(clause);
        }
      } else {
        pushWordChunks(cleanedSentence);
      }
    }
  }

  return chunks;
}

function getMaxTokensForText(input: string): number {
  const words = input.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(320, Math.max(96, words * 16));
}

async function translateWithRouterModel(
  input: string,
  token: string,
  modelId: string,
  waitForModel: boolean,
  compact = false,
  opts?: { temperature?: number; maxTokens?: number },
  context?: string,
): Promise<string> {
  // Use the model id as provided (avoid forcing the ':fastest' router variant which may reduce quality)
  const hfModel = modelId;
  const body: any = {
    model: hfModel,
    messages: buildMessages(input, compact, context),
    temperature: typeof opts?.temperature === 'number' ? opts.temperature : 0.2,
    max_tokens: typeof opts?.maxTokens === 'number' ? opts.maxTokens : getMaxTokensForText(input),
    stream: false,
    ...(waitForModel ? { wait_for_model: true } : {}),
  };

  const payload = await fetchJsonWithRetries(
    'https://router.huggingface.co/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    18000,
    2
  );

  return cleanTranslation(extractGeneratedText(payload?.choices?.[0]?.message?.content ?? payload));
}

async function translateLongInputInChunks(text: string, token: string, candidateModels: string[], waitForModel: boolean): Promise<string | null> {
  const chunks = splitIntoChunks(text, 20);

  if (chunks.length <= 1) {
    return null;
  }

  const modelId = candidateModels[0];
  if (!modelId) return null;

  const translatedChunks: string[] = [];
  let usedFallbackSegment = false;
  let contextAccum = '';

  for (const chunk of chunks) {
    try {
      // Provide accumulated original-source context from previous chunks to improve coherence
      const translatedChunk = await translateWithRouterModel(chunk, token, modelId, waitForModel, chunk.length < 120, undefined, contextAccum);
      if (!translatedChunk) {
        const fallbackChunk = fallbackTranslation(chunk);
        translatedChunks.push(fallbackChunk || chunk);
        usedFallbackSegment = true;
        continue;
      }
      translatedChunks.push(translatedChunk);
      // Accumulate original chunks as context for later fragments (avoid accumulating translated text to prevent repetition)
      contextAccum = (contextAccum ? `${contextAccum} ${chunk}` : chunk).trim();
      if (contextAccum.length > 800) {
        contextAccum = contextAccum.slice(-800);
      }
    } catch (error) {
      console.warn('Chunked translation failed:', error);
      const fallbackChunk = fallbackTranslation(chunk);
      translatedChunks.push(fallbackChunk || chunk);
      usedFallbackSegment = true;
    }
  }

  const merged = cleanTranslation(translatedChunks.join(' '));
  if (!merged) {
    return null;
  }

  return usedFallbackSegment ? merged : merged;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 15000): Promise<Response> {
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

async function fetchJsonWithRetries(url: string, init: RequestInit, timeoutMs = 15000, maxRetries = 1): Promise<any> {
  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      const res = await fetchWithTimeout(url, init, timeoutMs);
      const text = await res.text();

      if (!res.ok) {
        console.error(`Hugging Face API returned status ${res.status} (attempt ${attempt}):`, text);
        if (res.status >= 500 && attempt <= maxRetries) {
          // small backoff
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        const err: any = new Error(`HF API ${res.status}`);
        err.status = res.status;
        err.body = text;
        throw err;
      }

      // Try to parse JSON, but tolerate non-JSON payloads
      try {
        return text ? JSON.parse(text) : null;
      } catch (parseErr) {
        // If HF returns plain text, return raw text instead of throwing
        return text;
      }
    } catch (err: any) {
      const isRetryable = err?.name === 'AbortError' || /network|fetch|timeout/i.test(String(err?.message)) || (err?.status && err.status >= 500);
      console.warn(`HF request attempt ${attempt} failed:`, err?.message || err);
      if (attempt <= maxRetries && isRetryable) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      throw err;
    }
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

function destinationWithPreposition(raw: string): string {
  const destination = raw.toLowerCase();
  const destinationMap: Record<string, string> = {
    universidad: 'a la universidad',
    escuela: 'a la escuela',
    oficina: 'a la oficina',
    casa: 'a casa',
    trabajo: 'al trabajo',
    colegio: 'al colegio',
    hospital: 'al hospital',
    parque: 'al parque',
  };

  return destinationMap[destination] || `a ${destination}`;
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
    const conjugated = conjugatePastFirstPerson(secondWord);

    if (secondWord === 'ir' && words.length > 2) {
      const destination = words[2] || '';
      const normalizedDestination = destinationWithPreposition(destination);
      const remainder = words.slice(3).join(' ');
      return `${firstWord.charAt(0).toUpperCase() + firstWord.slice(1)} ${conjugated} ${normalizedDestination}${remainder ? ` ${remainder}` : ''}.`;
    }

    const remainder = words.slice(2).join(' ');
    return `${firstWord.charAt(0).toUpperCase() + firstWord.slice(1)} ${conjugated}${remainder ? ` ${remainder}` : ''}.`;
  }

  if ((firstWord === 'yo' || firstWord === 'me' || firstWord === 'mi') && secondWord === 'no' && words[2] && isVerbLike(words[2])) {
    const verb = words[2].toLowerCase();
    const conjugated = conjugatePresentFirstPerson(verb);

    if (verb === 'ir' && words.length > 3) {
      const destination = words[3] || '';
      const normalizedDestination = destinationWithPreposition(destination);
      const remainder = words.slice(4).join(' ');
      return `${firstWord.charAt(0).toUpperCase() + firstWord.slice(1)} no ${conjugated} ${normalizedDestination}${remainder ? ` ${remainder}` : ''}.`;
    }

    const remainder = words.slice(3).join(' ');
    return `${firstWord.charAt(0).toUpperCase() + firstWord.slice(1)} no ${conjugated}${remainder ? ` ${remainder}` : ''}.`;
  }

  if ((firstWord === 'yo' || firstWord === 'me' || firstWord === 'mi') && secondWord && isVerbLike(secondWord)) {
    const conjugated = conjugatePresentFirstPerson(secondWord);

    if (secondWord === 'ir' && words.length > 2) {
      const destination = words[2] || '';
      const normalizedDestination = destinationWithPreposition(destination);
      const remainder = words.slice(3).join(' ');
      return `${firstWord.charAt(0).toUpperCase() + firstWord.slice(1)} ${conjugated} ${normalizedDestination}${remainder ? ` ${remainder}` : ''}.`;
    }

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

function getRouterCandidateModels(): string[] {
  const primary = normalizeModelId(process.env.HF_TRANSLATION_MODEL || '');
  const fallback = DEFAULT_HF_MODELS[0];

  return [primary || fallback].filter(Boolean);
}

function getClassicCandidateModels(): string[] {
  return [];
}

function normalizeHfError(err: any): { status: number; bodyText: string; messageText: string; isNetwork: boolean } {
  const status = Number(err?.status || 0);
  const bodyText = String(err?.body || '');
  const messageText = String(err?.message || err || 'unknown_error');
  const isNetwork = /fetch failed|network|timeout|abort|econn|enotfound|eai_again/i.test(
    `${messageText} ${bodyText}`
  );

  return { status, bodyText, messageText, isNetwork };
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
    // Preferir el token específico de traducción si existe, sino usar el legacy HF_TOKEN
    const HF_TOKEN = process.env.HF_TRANSLATION_TOKEN || process.env.HF_TOKEN;
    const tokenSource = process.env.HF_TRANSLATION_TOKEN ? 'new' : (process.env.HF_TOKEN ? 'legacy' : 'none');
    const routerCandidateModels = getRouterCandidateModels();

    if (!HF_TOKEN) {
      return res.status(200).json({
        success: true,
        provider: 'local',
        simulated: true,
        reason: 'HF_TOKEN no configurado en el entorno de despliegue',
        tokenSource,
        translatedText: localFallback,
      });
    }

    const WAIT_FOR_MODEL = process.env.HF_WAIT_FOR_MODEL === 'true';
    let lastError = '';
    let unsupportedProviderErrors = 0;
    let classicNetworkFailed = false;

      if (isLongInput(text)) {
        const chunkedTranslation = await translateLongInputInChunks(text, HF_TOKEN, routerCandidateModels, WAIT_FOR_MODEL);
        if (chunkedTranslation) {
          return res.status(200).json({
            success: true,
            provider: 'huggingface',
            model: routerCandidateModels[0] || 'openai/gpt-oss-20b',
            mode: 'chunked-router',
            tokenSource,
            translatedText: chunkedTranslation,
          });
        }
      }

    for (const modelId of routerCandidateModels) {
      try {
          let generatedText = await translateWithRouterModel(text, HF_TOKEN, modelId, WAIT_FOR_MODEL, false, undefined, mode);

          // If the model returned the same text (identity), retry once with stricter options
          const normalizeForCompare = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/gi, ' ').trim();
          const inputNorm = normalizeForCompare(text);
          const outNorm = normalizeForCompare(generatedText);

          if (outNorm === inputNorm || !generatedText) {
            try {
              // Retry with wait_for_model and lower temperature and larger token budget
              const retryMax = Math.min(512, getMaxTokensForText(text) * 2);
              generatedText = await translateWithRouterModel(text, HF_TOKEN, modelId, true, false, { temperature: 0.0, maxTokens: retryMax });
            } catch (retryErr) {
              // ignore retry error, we'll fallback below if needed
              console.warn('Retry with adjusted params failed:', retryErr);
            }
          }

          if (generatedText) {
            return res.status(200).json({
              success: true,
              provider: 'huggingface',
              model: modelId,
              tokenSource,
              translatedText: generatedText,
            });
          }

        lastError = `Respuesta vacía del modelo ${modelId}`;
      } catch (hfErr: any) {
        const { status, bodyText, messageText } = normalizeHfError(hfErr);
        if (/model_not_supported/i.test(bodyText)) {
          unsupportedProviderErrors += 1;
        }

        lastError = bodyText
          ? `${messageText} | ${bodyText.slice(0, 240)}`
          : messageText;

        if (status === 401 || status === 403) {
          break;
        }
      }
    }

    const classicCandidateModels = getClassicCandidateModels();
    for (const modelId of classicCandidateModels) {
      try {
        const payload = await fetchJsonWithRetries(
          `https://api-inference.huggingface.co/models/${modelId}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${HF_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: buildPrompt(text),
              parameters: {
                max_new_tokens: 96,
                temperature: 0.2,
                return_full_text: false,
              },
              options: {
                wait_for_model: WAIT_FOR_MODEL,
                use_cache: false,
              },
            }),
          },
          20000,
          2
        );

        const generatedText = cleanTranslation(extractGeneratedText(payload));
        if (generatedText) {
          return res.status(200).json({
            success: true,
            provider: 'huggingface',
            model: modelId,
            mode: 'classic-inference',
            tokenSource,
            translatedText: generatedText,
          });
        }

        lastError = `Respuesta vacía del endpoint clásico (${modelId})`;
      } catch (hfClassicErr: any) {
        const { bodyText, messageText, isNetwork } = normalizeHfError(hfClassicErr);
        if (isNetwork) {
          classicNetworkFailed = true;
        }
        lastError = bodyText
          ? `${messageText} | ${bodyText.slice(0, 240)}`
          : messageText;
      }
    }

    const unsupportedHint = unsupportedProviderErrors > 0
      ? 'Los proveedores del router no soportan el modelo configurado; se intentó endpoint clásico.'
      : '';
    const networkHint = classicNetworkFailed
      ? 'El runtime no logró conectar con el endpoint clásico de Hugging Face.'
      : '';

    const finalReason = `No se obtuvo respuesta válida de Hugging Face. ${unsupportedHint} ${networkHint}`
      .replace(/\s+/g, ' ')
      .trim();

    return res.status(200).json({
      success: true,
      provider: 'local-fallback',
      reason: finalReason === 'No se obtuvo respuesta válida de Hugging Face.'
        ? 'No se obtuvo respuesta válida de Hugging Face; se aplicó corrección local.'
        : finalReason,
      tokenSource,
      attemptedModels: routerCandidateModels,
      attemptedClassicModels: classicCandidateModels,
      debugReason: lastError || 'Sin detalle adicional.',
      translatedText: localFallback,
    });
  } catch (error) {
    console.error('Error procesando traducción:', error);
    return res.status(200).json({
      success: true,
      provider: 'local-fallback',
      reason: `Error de red, timeout o caída del runtime del endpoint: ${String((error as any)?.message || error)}`,
      tokenSource: (process.env.HF_TRANSLATION_TOKEN ? 'new' : (process.env.HF_TOKEN ? 'legacy' : 'none')),
      translatedText: fallbackTranslation(String(req.body?.text || '')),
    });
  }
}
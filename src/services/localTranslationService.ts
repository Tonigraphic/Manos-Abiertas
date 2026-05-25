type TransformersModule = typeof import('@xenova/transformers');

let transformersModulePromise: Promise<TransformersModule> | null = null;

async function getTransformersModule(): Promise<TransformersModule> {
  if (!transformersModulePromise) {
    transformersModulePromise = import('@xenova/transformers').then((module) => {
      module.env.allowLocalModels = false;
      module.env.allowRemoteModels = true;
      module.env.useBrowserCache = true;
      module.env.backends.onnx.wasm.numThreads = 1;
      module.env.backends.onnx.wasm.proxy = true;
      return module;
    });
  }

  return transformersModulePromise;
}

export const LOCAL_TRANSLATION_MODEL = 'Xenova/flan-t5-small';
const MODEL_LOAD_TIMEOUT_MS = 45000;
const INFERENCE_TIMEOUT_MS = 12000;
const MODEL_RETRY_COOLDOWN_MS = 5 * 60 * 1000;
const FORCE_BROWSER_MODEL = import.meta.env.VITE_ENABLE_BROWSER_MODEL === 'true';

let translatorPromise: Promise<any> | null = null;
let modelDisabledUntil = 0;

async function getTranslator() {
  const now = Date.now();
  if (now < modelDisabledUntil) {
    throw new Error('Modelo local en enfriamiento temporal por timeout de red');
  }

  if (!translatorPromise) {
    translatorPromise = (async () => {
      const { pipeline } = await getTransformersModule();
      return pipeline('text2text-generation', LOCAL_TRANSLATION_MODEL, {
        quantized: true,
      });
    })().catch((error) => {
      translatorPromise = null;
      throw error;
    });
  }

  return translatorPromise;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise
      .then((result) => {
        clearTimeout(id);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(id);
        reject(error);
      });
  });
}

function normalizeWord(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function removeAdjacentDuplicates(text: string): string {
  const words = text.split(/\s+/).filter(Boolean);
  const compact: string[] = [];

  for (const word of words) {
    const prev = compact[compact.length - 1];
    if (prev && normalizeWord(prev) === normalizeWord(word)) {
      continue;
    }
    compact.push(word);
  }

  return compact.join(' ');
}

function sanitizeOutput(rawOutput: string): string {
  const cleaned = removeAdjacentDuplicates(
    rawOutput
      .replace(/^respuesta:\s*/i, '')
      .replace(/^frase:\s*/i, '')
      .replace(/^texto:\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim()
  );

  return cleaned.replace(/\s+([,.;!?])/g, '$1').trim();
}

function looksReasonable(input: string, output: string): boolean {
  if (!output) return false;
  if (output.length < 4) return false;
  if (output.length > input.length * 2.6) return false;

  const words = output.split(/\s+/).filter(Boolean);
  if (words.length < 2) return false;

  const normalized = words.map(normalizeWord);
  const unique = new Set(normalized);
  if (unique.size <= Math.max(1, Math.floor(words.length * 0.35))) return false;

  return true;
}

function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as any;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  if (!conn) return false;

  const type = String(conn.effectiveType || '').toLowerCase();
  return conn.saveData === true || type.includes('2g') || type.includes('slow-2g');
}

export function shouldAttemptBrowserModel(): boolean {
  if (typeof window === 'undefined') return false;
  if (FORCE_BROWSER_MODEL) return true;

  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return true;

  const nav = navigator as any;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  if (!conn) return false;

  const effectiveType = String(conn.effectiveType || '').toLowerCase();
  const downlink = Number(conn.downlink || 0);
  const saveData = conn.saveData === true;

  return !saveData && effectiveType.includes('4g') && downlink >= 5;
}

export async function translateWithLocalModel(input: string): Promise<string> {
  if (isSlowConnection()) {
    throw new Error('Red lenta detectada para descargar el modelo local');
  }

  const translator = await withTimeout(
    getTranslator(),
    MODEL_LOAD_TIMEOUT_MS,
    'Tiempo de espera agotado cargando el modelo local'
  );

  const prompt = [
    'Corrige el español de esta frase sin añadir explicación.',
    'Mantén el significado original y evita conectores innecesarios.',
    'Si la frase ya está correcta, devuélvela casi igual.',
    '',
    `Frase: ${input}`,
  ].join('\n');

  const output = await withTimeout(
    translator(prompt, {
      max_new_tokens: 56,
      temperature: 0.1,
      repetition_penalty: 1.15,
      top_p: 0.85,
      do_sample: false,
      num_beams: 2,
    }),
    INFERENCE_TIMEOUT_MS,
    'Tiempo de espera agotado ejecutando la traduccion local'
  );

  const generated = Array.isArray(output)
    ? output[0]?.generated_text
    : output?.generated_text ?? '';

  const cleaned = sanitizeOutput(String(generated || '').trim());
  return looksReasonable(input, cleaned) ? cleaned : '';
}

export function markLocalModelTimeout(): void {
  modelDisabledUntil = Date.now() + MODEL_RETRY_COOLDOWN_MS;
  translatorPromise = null;
}
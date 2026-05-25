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

let translatorPromise: Promise<any> | null = null;

async function getTranslator() {
  if (!translatorPromise) {
    translatorPromise = (async () => {
      const { pipeline } = await getTransformersModule();
      return pipeline('text2text-generation', LOCAL_TRANSLATION_MODEL, {
        quantized: true,
      });
    })();
  }

  return translatorPromise;
}

export async function translateWithLocalModel(input: string): Promise<string> {
  const translator = await getTranslator();

  const prompt = [
    'Corrige el español de esta frase sin añadir explicación.',
    'Mantén el significado original y evita conectores innecesarios.',
    'Si la frase ya está correcta, devuélvela casi igual.',
    '',
    `Frase: ${input}`,
  ].join('\n');

  const output = await translator(prompt, {
    max_new_tokens: 64,
    temperature: 0.2,
    repetition_penalty: 1.05,
    top_p: 0.9,
  });

  const generated = Array.isArray(output)
    ? output[0]?.generated_text
    : output?.generated_text ?? '';

  return String(generated || '').trim();
}
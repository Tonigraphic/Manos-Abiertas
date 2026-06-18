export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

type TranslateRequest = {
  text?: string;
  mode?: 'hearing' | 'deaf';
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, mode } = req.body as TranslateRequest;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Missing text' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const HF_TOKEN = process.env.HF_TRANSLATION_TOKEN || process.env.HF_TOKEN;

    if (!OPENAI_API_KEY && !HF_TOKEN) {
      console.warn('Ni OPENAI_API_KEY ni HF_TOKEN configurados en el entorno.');
      return res.status(200).json({
        success: false,
        provider: 'local-fallback',
        reason: 'No hay llaves de API configuradas en el entorno (ni OpenAI ni Hugging Face)',
        translatedText: mode === 'deaf' 
          ? 'Por favor configurar API Key | Necesito configurar la API Key | Error de API Key' 
          : 'POR FAVOR CONFIGURAR API KEY',
      });
    }

    let systemPrompt = '';

    if (mode === 'hearing') {
      systemPrompt = `You are an expert Spanish to Colombian Sign Language (LSC) gloss translator.
Your task is to translate the Spanish sentence into LSC gloss in Spanish words.
Rules:
1. Translate to LSC gloss in Spanish vocabulary (e.g. "rojo", "azul").
2. Do NOT use connectors, prepositions, or articles (y, o, de, la, el, los, las, un, una, etc.).
3. Translate verbs to infinitive (e.g., "mezcles" -> "mezclar").
4. Output the final gloss in lowercase (only the very first letter of the sentence capitalized).
5. Output ONLY the clean gloss sentence. Do NOT write any introduction, notes, explanations, quotes, or punctuation.
Example output: "Mezclar rojo azul pincel"`;
    } else {
      systemPrompt = `You are an expert Colombian Sign Language (LSC) to natural written Spanish translator.
Your task is to translate CSL glosses (e.g., "YO IR UNIVERSIDAD MAÑANA") into natural, grammatically correct written SPANISH.
Provide EXACTLY THREE (3) different translation options in Spanish.
Rules:
1. The options must be in Spanish. Absolutely NO English vocabulary is allowed.
2. The options should vary slightly in tone or context (formal, informal, question, or statement).
3. Separate each option strictly with the "|" (pipe) character.
4. Do NOT use numbers (e.g. 1., 2.), bullet points, prefixes, introductory sentences (like "Aquí te dejo..."), notes, or conversational text.
5. Respond ONLY with the three Spanish translations separated by "|".
Example Output:
Mañana iré a la universidad. | Yo voy a ir a la universidad mañana. | ¿Iré mañana a la universidad?`;
    }

    let translatedText = '';
    let providerUsed = '';

    // Priorizar OpenAI si está configurado
    if (OPENAI_API_KEY) {
      providerUsed = 'openai';
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API responded with status ${response.status}`);
      }

      const data = await response.json();
      translatedText = data.choices[0]?.message?.content?.trim() || '';
    } 
    // Fallback a Hugging Face usando el formato compatible con OpenAI
    else if (HF_TOKEN) {
      providerUsed = 'huggingface';
      // Usar el modelo de Llama por defecto (cálido y estable)
      const hfModel = process.env.HF_TRANSLATION_MODEL || 'meta-llama/Meta-Llama-3-8B-Instruct';
      
      let response = await fetch('https://router.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: hfModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      // Si falla o responde 503 (cargando), intentar con el modelo fallback warm
      if (!response.ok && hfModel !== 'meta-llama/Meta-Llama-3-8B-Instruct') {
        console.warn(`Error llamando a ${hfModel}. Intentando fallback a Llama-3-8B...`);
        response = await fetch('https://router.huggingface.co/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'meta-llama/Meta-Llama-3-8B-Instruct',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: text }
            ],
            temperature: 0.3,
            max_tokens: 1000,
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`Hugging Face API responded with status ${response.status}`);
      }

      const data = await response.json();
      translatedText = data.choices[0]?.message?.content?.trim() || '';
    }

    // Asegurarse de que no haya comillas, asteriscos ni puntuación innecesaria
    translatedText = translatedText.replace(/[\*"'“”`]/g, '').trim();

    if (mode === 'deaf') {
      const parsedOptions = translatedText.split('|').map((s: string) => s.trim()).filter(Boolean);
      const cleaned = parsedOptions.map(opt => opt.replace(/^(opci[oó]n\s+\d+:?|opc\s+\d+:?|\d+[\s.-]+)/i, '').trim()).filter(opt => {
        const lower = opt.toLowerCase();
        return !(lower.startsWith('aquí tienes') || lower.startsWith('estas son') || lower.startsWith('opciones de') || (lower.includes('traducción') && lower.length < 35) || lower.includes('intérprete') || lower.length < 3);
      });
      translatedText = cleaned.slice(0, 3).join(' | ');
    }

    return res.status(200).json({
      success: true,
      provider: providerUsed,
      translatedText,
    });

  } catch (error) {
    console.error('Error procesando traducción:', error);
    return res.status(200).json({
      success: false,
      provider: 'error',
      reason: `Error de red o API: ${String((error as any)?.message || error)}`,
      // Retorna el mismo texto para evitar crashear la UI
      translatedText: req.body?.mode === 'deaf' ? `${req.body?.text} | Opción 2 | Opción 3` : String(req.body?.text || '').toUpperCase(),
    });
  }
}
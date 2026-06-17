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

    // Usar la clave de OpenAI del entorno
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY no configurado en el entorno.');
      return res.status(200).json({
        success: false,
        provider: 'local-fallback',
        reason: 'OPENAI_API_KEY no configurado en el entorno de despliegue',
        translatedText: mode === 'deaf' 
          ? 'Por favor configurar API Key | Necesito configurar la API Key | Error de API Key' 
          : 'POR FAVOR CONFIGURAR API KEY',
      });
    }

    let systemPrompt = '';

    if (mode === 'hearing') {
      systemPrompt = `Eres un experto intérprete de español a Lengua de Señas Colombiana (LSC).
Tu tarea es traducir el texto en español a "glosa LSC" (la estructura que usan las personas sordas).
Reglas estrictas para la glosa LSC:
1. Elimina TODOS los conectores, preposiciones y artículos (y, o, de, la, el, los, las, un, una, etc.). NUNCA sugieras la seña individual para un conector.
2. Usa una estructura de sujeto-objeto-verbo (SOV) o tiempo-lugar-sujeto-objeto-verbo según aplique.
3. Los verbos deben ir en infinitivo (ej: "fui" -> "ir").
4. Elimina la conjugación de género y número cuando no sea estrictamente necesaria.
5. Devuelve SOLO la glosa final en letras MAYÚSCULAS, sin explicaciones, sin comillas y sin puntuación.`;
    } else {
      systemPrompt = `Eres un experto intérprete de Lengua de Señas Colombiana (LSC) a español escrito.
La entrada será una secuencia de glosas (ej: "YO IR UNIVERSIDAD MAÑANA").
Tu tarea es traducir esa glosa a español natural, convencional y gramaticalmente correcto.
Como una glosa puede tener múltiples interpretaciones según el contexto, debes proporcionar EXACTAMENTE TRES (3) opciones diferentes de traducción al español.
Reglas:
1. Las opciones deben variar ligeramente en tono o contexto (ej. formal, informal, pregunta/afirmación si aplican).
2. Separa cada opción estrictamente con el carácter "|" (pipe). No uses números, ni viñetas, ni saltos de línea.
3. Devuelve SOLO las opciones separadas por "|", sin ningún otro texto explicativo.
Ejemplo de salida: Mañana iré a la universidad. | Yo voy a ir a la universidad mañana. | ¿Iré mañana a la universidad?`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Utiliza un modelo rápido y eficiente de OpenAI
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API responded with status ${response.status}`);
    }

    const data = await response.json();
    let translatedText = data.choices[0]?.message?.content?.trim() || '';

    // Asegurarse de que en modo hearing no haya comillas residuales ni puntuación innecesaria
    if (mode === 'hearing') {
       translatedText = translatedText.replace(/['"]/g, '').trim();
    }

    return res.status(200).json({
      success: true,
      provider: 'openai',
      translatedText,
    });

  } catch (error) {
    console.error('Error procesando traducción con OpenAI:', error);
    return res.status(200).json({
      success: false,
      provider: 'error',
      reason: `Error de red o API: ${String((error as any)?.message || error)}`,
      // Retorna el mismo texto para evitar crashear la UI
      translatedText: req.body?.mode === 'deaf' ? `${req.body?.text} | Opción 2 | Opción 3` : String(req.body?.text || '').toUpperCase(),
    });
  }
}

import fetch from 'node-fetch'; // No need in node 18+ but just in case, we will run with node

const HF_TOKEN = process.env.HF_TRANSLATION_TOKEN;
const text = "yo ir universidad mañana";
const hfModel = process.env.HF_TRANSLATION_MODEL || "meta-llama/Meta-Llama-3-8B-Instruct";

const systemPrompt = `Eres un experto intérprete de Lengua de Señas Colombiana (LSC) a español escrito.
La entrada será una secuencia de glosas (ej: "YO IR UNIVERSIDAD MAÑANA").
Tu tarea es traducir esa glosa a español natural, convencional y gramaticalmente correcto.
Como una glosa puede tener múltiples interpretaciones según el contexto, debes proporcionar EXACTAMENTE TRES (3) opciones diferentes de traducción al español.
Reglas:
1. Las opciones deben variar ligeramente en tono o contexto (ej. formal, informal, pregunta/afirmación si aplican).
2. Separa cada opción estrictamente con el carácter "|" (pipe). No uses números, ni viñetas, ni saltos de línea.
3. Devuelve SOLO las opciones separadas por "|", sin ningún otro texto explicativo.
Ejemplo de salida: Mañana iré a la universidad. | Yo voy a ir a la universidad mañana. | ¿Iré mañana a la universidad?`;

async function main() {
  try {
    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
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
    console.log(response.status);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}
main();

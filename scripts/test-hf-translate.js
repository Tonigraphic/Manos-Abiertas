#!/usr/bin/env node
// Script para probar localmente token/modelos contra router y endpoint clásico de Hugging Face.
// Uso: set HF_TRANSLATION_TOKEN=hf_xxx && node scripts/test-hf-translate.js "ayer ver película"

const text = process.argv.slice(2).join(' ') || 'ayer ver película';
const HF_TOKEN = process.env.HF_TRANSLATION_TOKEN || process.env.HF_TOKEN;
const MODEL = process.env.HF_TRANSLATION_MODEL || 'Qwen/Qwen2.5-1.5B-Instruct:fastest';
const CLASSIC_MODEL = process.env.HF_TRANSLATION_CLASSIC_MODEL || 'google/flan-t5-base';

if (!HF_TOKEN) {
  console.error('Falta HF_TRANSLATION_TOKEN en el entorno. Exporta la variable y reintenta.');
  process.exit(2);
}

const messages = [
  { role: 'system', content: 'Eres un corrector experto en español colombiano. Devuelve solo la versión final corregida.' },
  { role: 'user', content: `Texto: ${text}` },
];

async function main() {
  const payloadRouter = { model: MODEL, messages, temperature: 0.2, max_tokens: 128 };
  const payloadClassic = {
    inputs: [
      'Eres un corrector experto en español colombiano.',
      'Devuelve solo la versión final corregida.',
      `Texto: ${text}`,
      'Respuesta:',
    ].join('\n'),
    parameters: {
      max_new_tokens: 96,
      temperature: 0.2,
      return_full_text: false,
    },
    options: {
      wait_for_model: true,
      use_cache: false,
    },
  };

  try {
    const routerRes = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadRouter),
    });

    console.log('\n=== Router ===');
    console.log('HTTP', routerRes.status, routerRes.statusText);
    const routerText = await routerRes.text();
    try {
      const json = JSON.parse(routerText);
      console.log('Response JSON:', JSON.stringify(json, null, 2));
      const content = json?.choices?.[0]?.message?.content ?? json;
      console.log('\n--- Generated content (router) ---\n', content);
    } catch (e) {
      console.log('Response (non-JSON):', routerText);
    }

    const classicRes = await fetch(`https://api-inference.huggingface.co/models/${CLASSIC_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadClassic),
    });

    console.log('\n=== Classic Inference ===');
    console.log('HTTP', classicRes.status, classicRes.statusText);
    const classicText = await classicRes.text();
    try {
      const json = JSON.parse(classicText);
      console.log('Response JSON:', JSON.stringify(json, null, 2));
      const content = Array.isArray(json) ? json[0]?.generated_text : json?.generated_text ?? json;
      console.log('\n--- Generated content (classic) ---\n', content);
    } catch (e) {
      console.log('Response (non-JSON):', classicText);
    }
  } catch (err) {
    console.error('Error calling Hugging Face endpoints:', err);
    process.exitCode = 1;
  }
}

main();

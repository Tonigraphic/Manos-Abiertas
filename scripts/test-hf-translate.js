#!/usr/bin/env node
// Script para probar localmente el token y modelo contra el router de Hugging Face
// Uso: set HF_TRANSLATION_TOKEN=hf_xxx && node scripts/test-hf-translate.js "ayer ver película"

const text = process.argv.slice(2).join(' ') || 'ayer ver película';
const HF_TOKEN = process.env.HF_TRANSLATION_TOKEN || process.env.HF_TOKEN;
const MODEL = process.env.HF_TRANSLATION_MODEL || 'Qwen/Qwen2.5-1.5B-Instruct:fastest';

if (!HF_TOKEN) {
  console.error('Falta HF_TRANSLATION_TOKEN en el entorno. Exporta la variable y reintenta.');
  process.exit(2);
}

const messages = [
  { role: 'system', content: 'Eres un corrector experto en español colombiano. Devuelve solo la versión final corregida.' },
  { role: 'user', content: `Texto: ${text}` },
];

async function main() {
  try {
    const res = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0.2, max_tokens: 128 }),
    });

    console.log('HTTP', res.status, res.statusText);
    const textBody = await res.text();
    try {
      const json = JSON.parse(textBody);
      console.log('Response JSON:', JSON.stringify(json, null, 2));
      const content = json?.choices?.[0]?.message?.content ?? json;
      console.log('\n--- Generated content ---\n', content);
    } catch (e) {
      console.log('Response (non-JSON):', textBody);
    }
  } catch (err) {
    console.error('Error calling Hugging Face router:', err);
    process.exitCode = 1;
  }
}

main();

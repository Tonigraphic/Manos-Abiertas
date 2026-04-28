/**
 * Postinstall script: copies onnxruntime-web .mjs files to public/
 * so Vite's dev server and production build can resolve them.
 * The heavy .wasm binaries are loaded from CDN at runtime.
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', 'onnxruntime-web', 'dist');
const dst = path.join(__dirname, '..', 'public');

const files = [
  'ort-wasm-simd-threaded.mjs',
  'ort-wasm-simd-threaded.jsep.mjs',
];

if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });

files.forEach(f => {
  const s = path.join(src, f);
  const d = path.join(dst, f);
  if (fs.existsSync(s)) {
    fs.copyFileSync(s, d);
    console.log(`✓ Copied ${f}`);
  } else {
    console.warn(`⚠ Not found: ${f}`);
  }
});

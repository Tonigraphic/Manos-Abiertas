import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Configuración del servidor local
  server: {
    port: 5173,      // Define el puerto fijo
    strictPort: true, // Si el puerto está ocupado, no cambia a otro automáticamente
    open: true,       // Abre el navegador automáticamente al iniciar
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Configuración para Vercel: La base debe ser '/' para que encuentre los assets en la raíz
  base: '/',
})

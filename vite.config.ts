import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import translateHandler from './api/translate'
import basicSsl from '@vitejs/plugin-basic-ssl'

async function readRequestBody(req: any): Promise<any> {
  return await new Promise((resolve, reject) => {
    let raw = ''

    req.on('data', (chunk: string) => {
      raw += chunk
    })

    req.on('end', () => {
      if (!raw) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        reject(error)
      }
    })

    req.on('error', reject)
  })
}

function createMockResponse(res: any) {
  let statusCode = 200

  return {
    status(code: number) {
      statusCode = code
      return this
    },
    json(payload: any) {
      if (!res.headersSent) {
        res.statusCode = statusCode
        res.setHeader('Content-Type', 'application/json')
      }
      res.end(JSON.stringify(payload))
    },
  }
}

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    // basicSsl(), // Desactívalo si usas el método de chrome://flags
    tailwindcss(),
    {
      name: 'dev-api-translate',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.split('?')[0] !== '/api/translate' || req.method !== 'POST') {
            next()
            return
          }

          try {
            const body = await readRequestBody(req)
            await translateHandler({ method: req.method, body }, createMockResponse(res))
          } catch (error) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Error interno del servidor de desarrollo' }))
          }
        })
      },
    },
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
    host: true,       // Permite el acceso desde la red local
    https: false,     // Cámbialo a false si usas el método de chrome://flags
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Configuración para Vercel: La base debe ser '/' para que encuentre los assets en la raíz
  base: '/',
})

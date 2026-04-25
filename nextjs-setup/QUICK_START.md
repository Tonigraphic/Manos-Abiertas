# Quick Start - LSC Recognition

Guía rápida para poner en marcha el proyecto en desarrollo.

## 📋 Prerrequisitos

- Node.js 18 o superior
- Python 3.11 o superior
- npm o pnpm
- Git

## 🚀 Instalación Rápida (5 minutos)

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd lsc-recognition
```

### 2. Frontend (Next.js)

```bash
# Navegar al directorio frontend
cd nextjs-setup

# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env.local

# Iniciar servidor de desarrollo
npm run dev
```

Frontend disponible en: **http://localhost:3000**

### 3. Backend (FastAPI) - En otra terminal

```bash
# Crear directorio backend
mkdir backend
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Crear requirements.txt
cat > requirements.txt << EOF
fastapi==0.104.1
uvicorn[standard]==0.24.0
websockets==12.0
opencv-python==4.8.1.78
numpy==1.26.2
mediapipe==0.10.8
pydantic==2.5.0
python-multipart==0.0.6
EOF

# Instalar dependencias
pip install -r requirements.txt

# Crear archivo main.py básico
cat > main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="LSC Recognition API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "LSC Recognition API", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Mock endpoints para desarrollo
@app.get("/api/dictionary/signs")
def get_signs():
    return {
        "success": True,
        "data": [
            {
                "id": "1",
                "word": "Hola",
                "category": "greetings",
                "difficulty": "Fácil",
                "videoUrl": "/videos/hola.mp4"
            }
        ]
    }
EOF

# Iniciar servidor
uvicorn main:app --reload --port 8000
```

Backend disponible en: **http://localhost:8000**

## ✅ Verificación

Abre tu navegador y verifica:

1. **Frontend**: http://localhost:3000
   - Deberías ver la landing page de LSC Recognition
   
2. **Backend**: http://localhost:8000/docs
   - Deberías ver la documentación interactiva de la API (Swagger)

3. **Health Check**: http://localhost:8000/health
   - Debería retornar `{"status": "healthy"}`

## 🎯 Próximos Pasos

### Desarrollo Frontend

```bash
cd nextjs-setup

# Crear nueva página
mkdir -p src/app/asistente
touch src/app/asistente/page.tsx

# Ejecutar linter
npm run lint

# Build de producción
npm run build
```

### Desarrollo Backend

```bash
cd backend

# Crear estructura de routers
mkdir routers
touch routers/__init__.py
touch routers/recognition.py

# Ejecutar con auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 🐛 Troubleshooting

### Error: Puerto 3000 ya en uso
```bash
# Matar proceso en puerto 3000
lsof -ti:3000 | xargs kill -9
```

### Error: Puerto 8000 ya en uso
```bash
# Matar proceso en puerto 8000
lsof -ti:8000 | xargs kill -9
```

### Error: Módulo no encontrado
```bash
# Frontend
cd nextjs-setup
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend
pip install -r requirements.txt --force-reinstall
```

### Error: CORS en peticiones
Verifica que el backend tenga configurado:
```python
allow_origins=["http://localhost:3000"]
```

## 📚 Documentación

- [README.md](./README.md) - Documentación completa
- [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) - Guía de integración backend
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía de deployment

## 🛠️ Comandos Útiles

```bash
# Frontend
npm run dev          # Desarrollo
npm run build        # Build producción
npm run start        # Iniciar producción
npm run lint         # Linter

# Backend
uvicorn main:app --reload              # Desarrollo
uvicorn main:app --workers 4           # Producción
pytest tests/                          # Tests
python -m pytest --cov                 # Tests con coverage
```

## 💡 Tips

1. **Hot Reload**: Ambos servidores tienen hot reload automático
2. **API Docs**: Visita http://localhost:8000/docs para probar endpoints
3. **Dev Tools**: Instala React DevTools y la extensión de Tailwind CSS
4. **VSCode**: Usa las extensiones recomendadas (ESLint, Prettier, Tailwind IntelliSense)

## 🎨 Personalización Rápida

### Cambiar colores del tema

```typescript
// nextjs-setup/tailwind.config.ts
theme: {
  extend: {
    colors: {
      primary: {
        600: '#TU_COLOR_AQUI',
      },
    },
  },
}
```

### Añadir nueva página

```typescript
// nextjs-setup/src/app/nueva-pagina/page.tsx
export default function NuevaPagina() {
  return <div>Mi nueva página</div>;
}
```

## 🔗 Links Útiles

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- API Redoc: http://localhost:8000/redoc

---

¿Problemas? Revisa la sección de Troubleshooting o abre un issue.

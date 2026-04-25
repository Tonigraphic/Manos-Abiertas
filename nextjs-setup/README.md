# LSC Recognition - Next.js Frontend

Plataforma educativa para el aprendizaje de Lengua de Señas Colombiana mediante inteligencia artificial.

## 🚀 Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **TypeScript**: Tipado estático
- **Styling**: Tailwind CSS 4
- **Animations**: Motion (Framer Motion)
- **API Client**: Axios
- **State Management**: SWR + Zustand
- **Icons**: Lucide React

## 📁 Estructura del Proyecto

```
nextjs-setup/
├── src/
│   ├── app/                    # App Router
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Landing page
│   │   ├── asistente/         # Módulo asistente
│   │   ├── practica/          # Módulo práctica
│   │   └── diccionario/       # Módulo diccionario
│   ├── components/
│   │   ├── ui/                # Componentes UI reutilizables
│   │   ├── features/          # Componentes por feature
│   │   └── layout/            # Componentes de layout
│   ├── hooks/                 # Custom hooks
│   │   ├── useRecognition.ts  # Hook para reconocimiento
│   │   ├── useSigns.ts        # Hook para diccionario
│   │   └── useProgress.ts     # Hook para progreso
│   ├── lib/                   # Utilidades
│   │   ├── api.ts             # Cliente API
│   │   ├── websocket.ts       # Cliente WebSocket
│   │   └── utils.ts           # Utilidades generales
│   ├── types/                 # Tipos TypeScript
│   │   └── index.ts          # Tipos globales
│   └── styles/               # Estilos globales
│       └── globals.css
├── public/                   # Assets estáticos
├── next.config.js           # Configuración Next.js
├── tailwind.config.ts       # Configuración Tailwind
└── tsconfig.json           # Configuración TypeScript
```

## 🛠️ Instalación

### Requisitos previos
- Node.js 18+ 
- npm o pnpm

### Pasos de instalación

```bash
# 1. Navegar al directorio
cd nextjs-setup

# 2. Instalar dependencias
npm install
# o
pnpm install

# 3. Crear archivo .env.local
cp .env.example .env.local

# 4. Configurar variables de entorno
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws

# 5. Ejecutar en desarrollo
npm run dev
# o
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🔌 Integración con Backend FastAPI

### Estructura de API esperada

```python
# Backend FastAPI endpoints esperados

# Reconocimiento
POST   /api/recognition/start
POST   /api/recognition/stop
GET    /api/recognition/history

# Diccionario
GET    /api/dictionary/signs
GET    /api/dictionary/signs/{id}
GET    /api/dictionary/categories
GET    /api/dictionary/search?q=hola&category=greetings

# Práctica
GET    /api/practice/exercises
GET    /api/practice/exercises/{id}
POST   /api/practice/submit
GET    /api/practice/progress

# Usuario
GET    /api/user/profile
PUT    /api/user/profile
GET    /api/user/achievements

# Videos
GET    /api/videos/{signId}
POST   /api/videos/upload

# WebSocket para reconocimiento en tiempo real
WS     /ws?session={sessionId}
```

### Ejemplo de modelo FastAPI

```python
# backend/models.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class RecognizedSign(BaseModel):
    id: str
    sign: str
    confidence: float
    timestamp: datetime
    videoFrame: Optional[str] = None

class Sign(BaseModel):
    id: str
    word: str
    category: str
    difficulty: str
    videoUrl: str
    thumbnailUrl: Optional[str] = None
    description: Optional[str] = None

class Exercise(BaseModel):
    id: str
    title: str
    description: str
    difficulty: str
    points: int
    signs: List[str]
    completed: bool = False

class UserProgress(BaseModel):
    userId: str
    totalPoints: int
    currentStreak: int
    dailyGoal: int
    dailyProgress: int
    achievements: List[dict]
```

### Ejemplo de endpoint FastAPI

```python
# backend/main.py
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/dictionary/signs")
async def get_signs():
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

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Recibir frame de video
            data = await websocket.receive_bytes()
            
            # Procesar con modelo ML
            result = await recognize_sign(data)
            
            # Enviar resultado
            await websocket.send_json({
                "type": "recognition",
                "payload": result,
                "timestamp": datetime.now().isoformat()
            })
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## 📹 Integración de Video y Reconocimiento

### Uso del hook de reconocimiento

```typescript
import { useRecognition } from '@/hooks/useRecognition';

function AsistentePage() {
  const {
    isActive,
    isLoading,
    error,
    recognizedSigns,
    videoRef,
    startRecognition,
    stopRecognition,
  } = useRecognition();

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline />
      <button onClick={startRecognition}>Iniciar</button>
      <button onClick={stopRecognition}>Detener</button>
      
      {recognizedSigns.map(sign => (
        <div key={sign.id}>
          {sign.sign} - {sign.confidence}%
        </div>
      ))}
    </div>
  );
}
```

## 🎨 Componentes Reutilizables

### Button
```tsx
<Button variant="primary" size="lg" leftIcon={<Icon />}>
  Texto
</Button>
```

### Card
```tsx
<Card hoverable>
  <CardBody>Contenido</CardBody>
</Card>
```

### Badge
```tsx
<Badge variant="success">Completado</Badge>
```

## 🔐 Variables de Entorno

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

## 📦 Scripts Disponibles

```bash
npm run dev        # Desarrollo
npm run build      # Build producción
npm run start      # Iniciar producción
npm run lint       # Linter
npm run type-check # Verificar tipos
```

## 🚢 Deploy

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t lsc-recognition .
docker run -p 3000:3000 lsc-recognition
```

## 📚 Documentación Adicional

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Motion](https://motion.dev/docs)
- [SWR](https://swr.vercel.app/)

## 👥 Equipo

**Universidad de Nariño**
- Programa: Diseño Gráfico
- Materia: Expresión - Primer Semestre
- Año: 2026

## 📄 Licencia

Proyecto académico - Universidad de Nariño

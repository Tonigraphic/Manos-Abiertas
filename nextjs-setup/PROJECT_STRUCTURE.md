# Estructura del Proyecto LSC Recognition - Next.js

## 📂 Árbol de Archivos

```
lsc-recognition/
│
├── nextjs-setup/                          # Frontend Next.js
│   ├── src/
│   │   ├── app/                          # App Router (Next.js 15)
│   │   │   ├── layout.tsx               # Layout raíz con metadata
│   │   │   ├── page.tsx                 # Landing page principal
│   │   │   ├── globals.css              # Estilos globales + Tailwind
│   │   │   ├── asistente/               # Módulo de reconocimiento
│   │   │   │   └── page.tsx
│   │   │   ├── practica/                # Módulo de práctica
│   │   │   │   └── page.tsx
│   │   │   └── diccionario/             # Módulo de diccionario
│   │   │       └── page.tsx
│   │   │
│   │   ├── components/                   # Componentes React
│   │   │   ├── ui/                      # Componentes base reutilizables
│   │   │   │   ├── Button.tsx           # ✅ Botón con variantes
│   │   │   │   ├── Card.tsx             # ✅ Card con animaciones
│   │   │   │   ├── Badge.tsx            # ✅ Badges de estado
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── Toast.tsx
│   │   │   ├── features/                # Componentes por feature
│   │   │   │   ├── recognition/
│   │   │   │   │   ├── VideoFeed.tsx
│   │   │   │   │   ├── SignList.tsx
│   │   │   │   │   └── RecognitionControls.tsx
│   │   │   │   ├── practice/
│   │   │   │   │   ├── ExerciseCard.tsx
│   │   │   │   │   ├── ProgressBar.tsx
│   │   │   │   │   └── AchievementBadge.tsx
│   │   │   │   └── dictionary/
│   │   │   │       ├── SignGrid.tsx
│   │   │   │       ├── CategoryFilter.tsx
│   │   │   │       └── VideoPlayer.tsx
│   │   │   └── layout/                  # Componentes de layout
│   │   │       ├── Navbar.tsx
│   │   │       ├── Footer.tsx
│   │   │       └── Sidebar.tsx
│   │   │
│   │   ├── hooks/                       # Custom React Hooks
│   │   │   ├── useRecognition.ts       # ✅ Hook para reconocimiento WebSocket
│   │   │   ├── useSigns.ts             # ✅ Hook para diccionario (SWR)
│   │   │   ├── useProgress.ts          # ✅ Hook para progreso del usuario
│   │   │   ├── useCamera.ts
│   │   │   ├── useWebSocket.ts
│   │   │   └── useLocalStorage.ts
│   │   │
│   │   ├── lib/                         # Utilidades y servicios
│   │   │   ├── api.ts                  # ✅ Cliente HTTP (Axios)
│   │   │   ├── websocket.ts            # ✅ Cliente WebSocket
│   │   │   ├── utils.ts                # ✅ Utilidades generales
│   │   │   ├── constants.ts
│   │   │   └── validators.ts
│   │   │
│   │   ├── types/                       # TypeScript Types
│   │   │   ├── index.ts                # ✅ Tipos globales
│   │   │   ├── api.ts
│   │   │   ├── recognition.ts
│   │   │   └── user.ts
│   │   │
│   │   └── styles/                      # Estilos adicionales
│   │       └── fonts.css
│   │
│   ├── public/                          # Assets estáticos
│   │   ├── videos/
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── next.config.mjs                  # ✅ Configuración Next.js
│   ├── tailwind.config.ts               # ✅ Configuración Tailwind
│   ├── tsconfig.json                    # ✅ Configuración TypeScript
│   ├── package.json                     # ✅ Dependencias
│   ├── .env.example                     # ✅ Variables de entorno ejemplo
│   ├── .env.local                       # Variables de entorno (git-ignored)
│   ├── README.md                        # ✅ Documentación principal
│   ├── QUICK_START.md                   # ✅ Guía de inicio rápido
│   ├── DEPLOYMENT.md                    # ✅ Guía de deployment
│   └── BACKEND_INTEGRATION.md           # ✅ Guía de integración backend
│
└── backend/                             # Backend FastAPI (a crear)
    ├── main.py                          # App principal
    ├── models/                          # Modelos Pydantic
    │   ├── sign.py
    │   ├── user.py
    │   └── exercise.py
    ├── routers/                         # Endpoints REST
    │   ├── recognition.py
    │   ├── dictionary.py
    │   ├── practice.py
    │   └── user.py
    ├── services/                        # Lógica de negocio
    │   ├── ml_service.py               # Modelo ML/IA
    │   ├── video_service.py
    │   └── db_service.py
    ├── ml/                             # Machine Learning
    │   ├── model.py
    │   ├── preprocessor.py
    │   └── weights/
    ├── database/                        # Base de datos
    │   ├── connection.py
    │   ├── migrations/
    │   └── seeds/
    ├── videos/                          # Videos de señas
    ├── requirements.txt                 # Dependencias Python
    ├── .env                            # Variables de entorno
    └── README.md
```

## 📋 Archivos Creados y Configurados

### ✅ Configuración Base
- [x] `package.json` - Dependencias y scripts
- [x] `tsconfig.json` - TypeScript config
- [x] `tailwind.config.ts` - Tailwind CSS v4
- [x] `next.config.mjs` - Next.js config
- [x] `.env.example` - Template variables

### ✅ Tipos TypeScript
- [x] `src/types/index.ts` - Todos los tipos (Sign, Exercise, User, etc.)

### ✅ Servicios
- [x] `src/lib/api.ts` - Cliente HTTP con interceptores
- [x] `src/lib/websocket.ts` - Cliente WebSocket con reconexión
- [x] `src/lib/utils.ts` - Utilidades (cn, formatDate, debounce, etc.)

### ✅ Hooks Personalizados
- [x] `src/hooks/useRecognition.ts` - WebSocket + cámara
- [x] `src/hooks/useSigns.ts` - Diccionario con SWR
- [x] `src/hooks/useProgress.ts` - Progreso del usuario

### ✅ Componentes UI
- [x] `src/components/ui/Button.tsx` - 3 variantes
- [x] `src/components/ui/Card.tsx` - Con animaciones
- [x] `src/components/ui/Badge.tsx` - 6 variantes

### ✅ Páginas
- [x] `src/app/layout.tsx` - Layout con metadata SEO
- [x] `src/app/page.tsx` - Landing page completa
- [x] `src/app/globals.css` - Estilos globales

### ✅ Documentación
- [x] `README.md` - Documentación completa
- [x] `QUICK_START.md` - Inicio rápido (5 min)
- [x] `BACKEND_INTEGRATION.md` - Guía backend FastAPI
- [x] `DEPLOYMENT.md` - Deployment producción

## 🔗 Integración Frontend ↔ Backend

### Flujo de Datos

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Components  →  Hooks  →  Services  →  API/WebSocket    │
│                    ↓                         ↓           │
│                  State                  Backend          │
│                                                           │
└───────────────────────────────┬───────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Routers  →  Services  →  ML Model  →  Database         │
│                  ↓              ↓                        │
│              Business      Predictions                   │
│               Logic                                      │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Endpoints Implementados

| Endpoint | Método | Descripción | Hook |
|----------|--------|-------------|------|
| `/api/dictionary/signs` | GET | Listar señas | `useSigns()` |
| `/api/dictionary/signs/:id` | GET | Obtener seña | `useSign(id)` |
| `/api/dictionary/search` | GET | Buscar señas | `useSearchSigns()` |
| `/api/practice/exercises` | GET | Listar ejercicios | `useExercises()` |
| `/api/practice/progress` | GET | Progreso usuario | `useProgress()` |
| `/ws` | WebSocket | Reconocimiento | `useRecognition()` |

## 🎨 Design System

### Colores
- **Primary**: Azul (`primary-600: #2563eb`)
- **Accent**: Naranja (`accent-500: #f97316`)
- **Success**: Verde (`green-500`)
- **Warning**: Amarillo (`yellow-500`)
- **Error**: Rojo (`red-500`)

### Componentes
- **Button**: primary, secondary, ghost
- **Card**: default, featured, hoverable
- **Badge**: 6 variantes de color

### Animaciones
- Motion/React para transiciones suaves
- Hover effects en cards
- Scroll animations con `whileInView`

## 🚀 Comandos Rápidos

```bash
# Desarrollo
cd nextjs-setup && npm run dev

# Build
npm run build

# Producción
npm run start

# Linter
npm run lint

# Type check
npm run type-check
```

## 📦 Dependencias Principales

```json
{
  "next": "^15.1.0",
  "react": "^18.3.1",
  "motion": "^12.23.24",
  "axios": "^1.7.2",
  "swr": "^2.2.5",
  "lucide-react": "^0.487.0",
  "tailwindcss": "^4.1.12"
}
```

## 🔐 Variables de Entorno

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

## 📚 Referencias

- Next.js 15: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Motion: https://motion.dev/docs
- SWR: https://swr.vercel.app/
- FastAPI: https://fastapi.tiangolo.com/

---

**Estado del Proyecto**: ✅ Estructura base completada y lista para desarrollo

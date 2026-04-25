# LSC Recognition - Documentación Técnica

## 📂 Estructura del Proyecto

```
/src
├── /app
│   ├── App.tsx                      # Componente principal con routing
│   ├── /components
│   │   ├── /lsc                     # Componentes UI personalizados
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── LoadingState.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── Toast.tsx
│   │   └── /ui                      # Componentes shadcn/ui
│   └── /views                       # Vistas principales
│       ├── LandingView.tsx          # Landing page
│       ├── AssistantView.tsx        # Reconocimiento en tiempo real
│       ├── PracticeView.tsx         # Modo práctica gamificado
│       └── DictionaryView.tsx       # Catálogo de señas
├── /hooks
│   ├── useLSCRecognition.ts         # Hook principal de reconocimiento
│   └── usePracticeGame.ts           # Hook de gamificación
├── /services
│   ├── handDetectionService.ts      # Servicio MediaPipe Hands
│   └── signRecognitionService.ts    # Servicio de reconocimiento de señas
└── /styles
    ├── design-tokens.css            # Tokens de diseño
    ├── fonts.css                    # Fuentes personalizadas
    ├── index.css                    # Estilos globales
    ├── tailwind.css                 # Configuración Tailwind
    └── theme.css                    # Tema de colores
```

## 🧩 Arquitectura de Componentes

### Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                             │
│                    (State Management)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
    ┌────▼───┐  ┌────▼────┐  ┌───▼──────┐
    │ Landing│  │Assistant│  │Dictionary│
    │  View  │  │  View   │  │   View   │
    └────────┘  └────┬────┘  └──────────┘
                     │
          ┌──────────┼──────────┐
          │                     │
    ┌─────▼──────┐    ┌────────▼────────┐
    │ useLSC     │    │ handDetection   │
    │Recognition │◄───┤    Service      │
    └────────────┘    └────────┬────────┘
          │                     │
    ┌─────▼──────┐    ┌────────▼────────┐
    │signRecog   │    │  MediaPipe      │
    │  Service   │    │    Hands        │
    └────────────┘    └─────────────────┘
```

## 🔧 Servicios Principales

### 1. HandDetectionService

**Responsabilidad**: Detectar manos en frames de video usando MediaPipe Hands

**Métodos clave**:
```typescript
class HandDetectionService {
  async initialize(): Promise<void>
  async detectHands(videoElement: HTMLVideoElement): Promise<void>
  onResults(callback: (results: Results) => void): void
  extractLandmarks(results: Results): HandLandmarks[]
  dispose(): void
}
```

**Configuración MediaPipe**:
- `maxNumHands`: 2 (detecta hasta 2 manos)
- `modelComplexity`: 1 (balance entre precisión y rendimiento)
- `minDetectionConfidence`: 0.5
- `minTrackingConfidence`: 0.5

**Landmarks detectados**: 21 puntos por mano
```
0: Wrist (muñeca)
1-4: Thumb (pulgar)
5-8: Index (índice)
9-12: Middle (medio)
13-16: Ring (anular)
17-20: Pinky (meñique)
```

### 2. SignRecognitionService

**Responsabilidad**: Reconocer señas a partir de landmarks

**Patrón de reconocimiento**:
```typescript
interface SignPattern {
  name: string;
  description: string;
  category: string;
  difficulty: 'Fácil' | 'Intermedio' | 'Avanzado';
  requiredHands: 1 | 2;
  pattern: (landmarks: HandLandmarks[]) => number; // Retorna confianza 0-1
}
```

**Algoritmo simplificado**:
1. Extraer estado de dedos (extendido/flexionado)
2. Comparar con patrones conocidos
3. Calcular confianza basada en similitud
4. Retornar mejor match si confianza > 75%

**Categorías de señas**:
- `alphabet`: 27 señas (A-Z, Ñ)
- `numbers`: 11 señas (0-10)
- `greetings`: 5 señas
- `common`: 13 señas

## 🎣 Custom Hooks

### useLSCRecognition

**Propósito**: Gestionar todo el flujo de reconocimiento en tiempo real

**Estado**:
```typescript
interface RecognitionState {
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  currentSign: RecognizedSign | null;
  recognizedSigns: RecognizedSign[];
  handsDetected: number;
}
```

**API**:
```typescript
const {
  state,                    // Estado actual
  videoRef,                 // Ref para elemento <video>
  canvasRef,               // Ref para elemento <canvas>
  startRecognition,        // Iniciar cámara y detección
  stopRecognition,         // Detener y limpiar recursos
  clearHistory,            // Limpiar historial de reconocimientos
} = useLSCRecognition();
```

**Ciclo de vida**:
```
1. startRecognition()
   ↓
2. Inicializar MediaPipe
   ↓
3. Obtener stream de cámara (getUserMedia)
   ↓
4. Configurar video y canvas
   ↓
5. Iniciar loop de procesamiento (requestAnimationFrame)
   ↓
6. Para cada frame:
   a. Detectar manos (MediaPipe)
   b. Extraer landmarks
   c. Dibujar landmarks en canvas
   d. Reconocer seña
   e. Actualizar estado
   ↓
7. stopRecognition() → Limpiar recursos
```

### usePracticeGame

**Propósito**: Gestionar lógica de gamificación y ejercicios

**Estado**:
```typescript
interface PracticeStats {
  score: number;              // Puntos totales
  streak: number;             // Días consecutivos
  dailyProgress: number;      // Progreso del día
  dailyGoal: number;          // Meta diaria (50)
  totalPracticed: number;     // Ejercicios completados
  accuracy: number;           // Precisión promedio (%)
}

interface GameSession {
  isActive: boolean;
  currentExercise: Exercise | null;
  currentSignIndex: number;
  correctAnswers: number;
  incorrectAnswers: number;
  startTime: number | null;
  endTime: number | null;
}
```

**API**:
```typescript
const {
  stats,                // Estadísticas globales
  exercises,            // Lista de ejercicios
  achievements,         // Logros
  session,             // Sesión actual
  startExercise,       // Iniciar ejercicio
  checkAnswer,         // Validar respuesta
  nextSign,            // Siguiente seña
  completeExercise,    // Finalizar ejercicio
  cancelExercise,      // Cancelar sesión
  resetProgress,       // Reiniciar todo
} = usePracticeGame();
```

**Persistencia (localStorage)**:
- `lsc_practice_stats`: Estadísticas del usuario
- `lsc_achievements`: Logros desbloqueados

**Cálculo de puntos**:
```javascript
const accuracy = (correctAnswers / totalAttempts) * 100;
const earnedPoints = Math.round((accuracy / 100) * exercise.points);
```

**Sistema de logros**:
```typescript
const achievements = [
  { id: 'first-sign', requirement: 1 },          // Primera seña
  { id: 'week-streak', requirement: 7 },         // 7 días seguidos
  { id: 'century', requirement: 100 },           // 100 puntos
  { id: 'perfectionist', requirement: 1 },       // Sin errores
  { id: 'master', requirement: 7 },              // Todos los ejercicios
  { id: 'speed-demon', requirement: 1 },         // < 2 minutos
];
```

## 🎨 Sistema de Diseño

### Design Tokens

```css
/* Colors */
--color-primary-50: #eff6ff;
--color-primary-100: #dbeafe;
--color-primary-500: #3b82f6;
--color-primary-600: #2563eb;  /* Principal */
--color-primary-700: #1d4ed8;

--color-accent-50: #fff7ed;
--color-accent-100: #ffedd5;
--color-accent-500: #fb923c;
--color-accent-600: #f97316;   /* Accent */
--color-accent-700: #ea580c;

--color-success-500: #22c55e;
--color-warning-500: #eab308;
--color-error-500: #ef4444;

/* Typography */
--font-sans: 'Inter', system-ui, sans-serif;
```

### Breakpoints

```css
/* Mobile First */
@media (min-width: 390px)  { /* Mobile */ }
@media (min-width: 768px)  { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1440px) { /* Large Desktop */ }
```

## 🚀 Optimizaciones de Rendimiento

### 1. Procesamiento de Video
- **requestAnimationFrame**: Sincronizado con refresh rate del navegador
- **Canvas rendering**: Hardware-accelerated
- **Landmarks caching**: Evita recálculos innecesarios

### 2. React
- **useMemo/useCallback**: Evitar re-renders innecesarios
- **Lazy loading**: Componentes cargados bajo demanda
- **Virtual lists**: Para listas largas (diccionario)

### 3. MediaPipe
- **Model complexity 1**: Balance entre precisión y velocidad
- **CDN loading**: Modelos servidos desde CDN de MediaPipe
- **WebAssembly**: Ejecución nativa en navegador

## 🔒 Seguridad y Privacidad

### Privacidad del Usuario
- ✅ **100% local**: Todo el procesamiento en navegador
- ✅ **Sin backend**: No se envían datos a servidores
- ✅ **Sin almacenamiento en nube**: Solo localStorage
- ✅ **Permisos explícitos**: Usuario debe conceder acceso a cámara

### Datos Almacenados
```javascript
// Solo en localStorage del navegador
{
  "lsc_practice_stats": {
    "score": 245,
    "streak": 7,
    // ...
  },
  "lsc_achievements": [...]
}
```

## 🧪 Testing (Recomendado para Producción)

### Unit Tests
```typescript
// handDetectionService.test.ts
describe('HandDetectionService', () => {
  it('should initialize MediaPipe Hands', async () => {
    await handDetectionService.initialize();
    expect(handDetectionService.initialized).toBe(true);
  });
});

// signRecognitionService.test.ts
describe('SignRecognitionService', () => {
  it('should recognize sign from landmarks', () => {
    const result = signRecognitionService.recognize(mockLandmarks);
    expect(result.sign).toBe('Hola');
    expect(result.confidence).toBeGreaterThan(0.75);
  });
});
```

### Integration Tests
```typescript
// useLSCRecognition.test.tsx
describe('useLSCRecognition', () => {
  it('should start and stop recognition', async () => {
    const { result } = renderHook(() => useLSCRecognition());
    
    await act(async () => {
      await result.current.startRecognition();
    });
    
    expect(result.current.state.isActive).toBe(true);
    
    act(() => {
      result.current.stopRecognition();
    });
    
    expect(result.current.state.isActive).toBe(false);
  });
});
```

## 📊 Métricas de Performance

### Objetivo
- **Latencia de reconocimiento**: < 100ms
- **FPS del video**: 25-30 FPS
- **Tiempo de carga inicial**: < 3s
- **Uso de memoria**: < 200MB

### Monitoreo
```typescript
// Performance tracking
const startTime = performance.now();
await handDetectionService.detectHands(video);
const endTime = performance.now();
console.log(`Detection time: ${endTime - startTime}ms`);
```

## 🔮 Roadmap Futuro

### Fase 2: Machine Learning
- [ ] Entrenar modelo CNN con dataset LSC
- [ ] Implementar LSTM para señas dinámicas
- [ ] Backend FastAPI para inferencia
- [ ] Fine-tuning con datos reales

### Fase 3: Features Avanzadas
- [ ] Reconocimiento de frases completas
- [ ] Modo multijugador/competitivo
- [ ] Videos tutoriales para cada seña
- [ ] Exportar progreso a PDF
- [ ] Integración con Supabase

### Fase 4: Accesibilidad
- [ ] Text-to-speech para feedback
- [ ] Modo alto contraste
- [ ] Soporte para lectura de pantalla
- [ ] Subtítulos en tiempo real

## 📚 Referencias

### MediaPipe
- [MediaPipe Hands Documentation](https://google.github.io/mediapipe/solutions/hands)
- [Hand Landmarks Guide](https://google.github.io/mediapipe/solutions/hands#hand-landmark-model)

### LSC
- [FENASCOL](https://www.fenascol.org.co/)
- [INSOR](https://www.insor.gov.co/)

### Tecnologías
- [React Documentation](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Motion Documentation](https://motion.dev/)

---

**Última actualización**: Abril 2026

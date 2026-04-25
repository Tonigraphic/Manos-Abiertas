# LSC Recognition - Guía de Uso

## 🎯 Descripción

**LSC Recognition** es una aplicación educativa interactiva para el reconocimiento de Lengua de Señas Colombiana (LSC). La aplicación utiliza **MediaPipe Hands** para detección de manos en tiempo real directamente en el navegador, sin necesidad de backend.

## ✨ Características Principales

### 🎥 Asistente de Reconocimiento
- **Reconocimiento en tiempo real** de señas LSC usando la cámara web
- Detección automática de manos con MediaPipe Hands
- Visualización de landmarks (puntos de referencia) en las manos
- Historial de señas reconocidas con timestamps
- Indicador de confianza para cada reconocimiento

### 📚 Práctica Gamificada
- **7 ejercicios diferentes** organizados por dificultad
- Sistema de puntos y logros desbloqueables
- Racha diaria para mantener la motivación
- Feedback visual instantáneo (correcto/incorrecto)
- Progreso persistente en localStorage
- Efectos de confetti para celebrar aciertos

### 📖 Diccionario Visual
- **Catálogo completo** de 50+ señas LSC
- 4 categorías: Alfabeto (27), Números (11), Saludos (5), Comunes (13)
- Búsqueda y filtrado por categoría
- Modal de detalles para cada seña
- Información de dificultad y requerimientos

## 🚀 Cómo Usar

### 1. Asistente de Reconocimiento

1. Navega al módulo **"Asistente"**
2. Haz clic en **"Iniciar"**
3. Concede permisos de cámara cuando se solicite
4. Coloca tus manos frente a la cámara
5. Realiza señas del catálogo LSC
6. Observa el reconocimiento en tiempo real en la esquina superior izquierda
7. Revisa el historial de reconocimientos en el panel derecho

**Consejos:**
- Asegúrate de tener buena iluminación
- Mantén ambas manos visibles en el cuadro de la cámara
- Realiza las señas de forma clara y pausada
- El sistema detecta hasta 2 manos simultáneamente

### 2. Práctica Gamificada

1. Navega al módulo **"Práctica"**
2. Elige un ejercicio según tu nivel:
   - **Fácil**: Alfabeto básico, Números
   - **Intermedio**: Saludos, Frases cotidianas
   - **Avanzado**: Alfabeto completo, Desafío mixto
3. Haz clic en **"Practicar"**
4. La cámara se activará automáticamente
5. Realiza la seña que se muestra en pantalla
6. Espera el feedback visual (verde = correcto, rojo = incorrecto)
7. Continúa hasta completar todas las señas del ejercicio
8. Gana puntos y desbloquea logros

**Sistema de Puntos:**
- Fácil: 10 puntos
- Intermedio: 20 puntos
- Avanzado: 30-40 puntos
- Los puntos se calculan según precisión

**Logros:**
- 🎯 Primera Seña: Completa tu primer ejercicio
- 🔥 7 Días Seguidos: Mantén una racha de 7 días
- 💯 Centenario: Alcanza 100 puntos
- ⭐ Perfeccionista: Completa un ejercicio sin errores
- 🏆 Maestro LSC: Completa todos los ejercicios
- ⚡ Velocista: Completa un ejercicio en menos de 2 minutos

### 3. Diccionario Visual

1. Navega al módulo **"Diccionario"**
2. Explora las **50+ señas** disponibles
3. Usa el **buscador** para encontrar señas específicas
4. Filtra por **categoría**:
   - Alfabeto (A-Z, Ñ)
   - Números (0-10)
   - Saludos (Hola, Adiós, Buenos días, etc.)
   - Comunes (Gracias, Por favor, Sí, No, etc.)
5. Haz clic en cualquier seña para ver detalles completos
6. Consulta dificultad, categoría y requerimientos de manos

## 🔧 Tecnología

### Frontend
- **React 18** con TypeScript
- **Tailwind CSS v4** para estilos
- **Motion** (Framer Motion) para animaciones
- **MediaPipe Hands** para detección de manos
- **Canvas API** para visualización de landmarks
- **WebRTC** para acceso a cámara

### Reconocimiento
- **MediaPipe Hands**: Detección de 21 landmarks por mano
- **Pattern Matching**: Reconocimiento basado en configuración de dedos
- **Confianza**: Umbral de 75% para reconocimientos válidos
- **Tiempo real**: Procesamiento frame por frame (~30 FPS)

### Persistencia
- **localStorage** para:
  - Estadísticas de práctica
  - Progreso de ejercicios
  - Logros desbloqueados
  - Racha diaria

## 📊 Señas Disponibles

### Alfabeto (27 señas)
A, B, C, D, E, F, G, H, I, J, K, L, M, N, Ñ, O, P, Q, R, S, T, U, V, W, X, Y, Z

### Números (11 señas)
0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10

### Saludos (5 señas)
- Hola
- Adiós
- Buenos días
- Buenas tardes
- Buenas noches

### Comunes (13 señas)
- Gracias
- Por favor
- Disculpa
- Sí
- No
- Ayuda
- Entiendo
- No entiendo
- (y más...)

## 🎨 Diseño

### Colores
- **Primary**: Azul #2563eb
- **Accent**: Naranja #f97316
- **Tipografía**: Inter

### Responsive
- Desktop: 1440px
- Tablet: 768px
- Mobile: 390px

## ⚙️ Configuración

### Requisitos del Navegador
- Navegador moderno con soporte para:
  - WebRTC (getUserMedia)
  - Canvas API
  - ES6+
  - localStorage
- Cámara web funcional
- Permisos de cámara concedidos

### Recomendaciones
- **Iluminación**: Buena luz frontal o natural
- **Fondo**: Preferiblemente simple y contrastante
- **Distancia**: 40-80cm de la cámara
- **Posición**: Manos centradas en el cuadro

## 🔍 Troubleshooting

### La cámara no se activa
1. Verifica permisos del navegador
2. Asegúrate de usar HTTPS (requerido por WebRTC)
3. Comprueba que ninguna otra aplicación esté usando la cámara
4. Recarga la página

### El reconocimiento no funciona
1. Mejora la iluminación
2. Acerca o aleja las manos de la cámara
3. Realiza señas más claras y pausadas
4. Verifica que ambas manos estén visibles si la seña lo requiere

### Rendimiento lento
1. Cierra otras pestañas del navegador
2. Desactiva extensiones que puedan interferir
3. Usa un navegador basado en Chromium (Chrome, Edge, Brave)

## 📝 Notas de Desarrollo

Esta es una **demo educativa** con las siguientes características:

### Reconocimiento Actual
- Basado en **pattern matching simplificado**
- Detecta configuración de dedos extendidos
- Utiliza landmarks de MediaPipe para análisis geométrico
- **No incluye modelo ML entrenado** (esta es una versión demo)

### Para Producción
Para un reconocimiento preciso, se necesitaría:
1. **Dataset** de señas LSC (imágenes/videos etiquetados)
2. **Modelo ML** entrenado (CNN, LSTM, o Transformer)
3. **Backend** FastAPI para inferencia del modelo
4. **Base de datos** para usuarios y progreso
5. **Videos** reales de cada seña para el diccionario

### Arquitectura Recomendada
```
Frontend (React)
    ↓
MediaPipe Hands (detección)
    ↓
Landmarks → Backend FastAPI
    ↓
Modelo ML (TensorFlow/PyTorch)
    ↓
Resultado → Frontend
```

## 🎓 Uso Educativo

**Proyecto demo para:**
- Materia: Expresión
- Semestre: Primero
- Carrera: Diseño Gráfico
- Universidad: Universidad de Nariño

**Objetivos:**
- Demostrar aplicación de diseño UI/UX
- Implementar sistema interactivo de aprendizaje
- Integrar tecnología de visión por computadora
- Crear experiencia gamificada de educación

## 📄 Licencia

Demo educativa - Universidad de Nariño 2026

---

**Desarrollado con ❤️ para la comunidad sorda colombiana**

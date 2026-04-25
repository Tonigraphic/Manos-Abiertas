# Manos Abiertas - Design System Documentation

## Proyecto
**Nombre:** Manos Abiertas  
**Propósito:** Asistente para la comunicación en LSC  
**Materia:** Expresión - Primer Semestre  
**Programa:** Diseño Gráfico  
**Institución:** Universidad de Nariño

---

## Design Tokens

### Colores

#### Primary (Púrpura Profundo)
- `--color-primary-50`: #f3e5f5
- `--color-primary-100`: #e1bee7
- `--color-primary-200`: #ce93d8
- `--color-primary-300`: #ba68c8
- `--color-primary-400`: #ab47bc
- `--color-primary-500`: #9c27b0
- `--color-primary-600`: **#7B1FA2** *(principal)*
- `--color-primary-700`: **#6A0DAD** *(principal oscuro)*
- `--color-primary-800`: #5a0a94
- `--color-primary-900`: #4a0778

#### Accent (Naranja Vibrante)
- `--color-accent-50`: #fff4ed
- `--color-accent-100`: #ffe4d1
- `--color-accent-200`: #ffc9a3
- `--color-accent-300`: #ffa870
- `--color-accent-400`: #ff874d
- `--color-accent-500`: **#FF6B35** *(principal)*
- `--color-accent-600`: #ff5722
- `--color-accent-700`: #e64a19
- `--color-accent-800`: #d84315
- `--color-accent-900`: #bf360c

#### Complementary Colors (inspirados en paleta)

**Cyan Brillante**
- `--color-cyan-500`: #00d1e8
- `--color-cyan-600`: #00dbee
- `--color-cyan-700`: #00b8c7

**Rosa/Magenta**
- `--color-pink-500`: #e91e63
- `--color-pink-600`: #d81b60
- `--color-pink-700`: #c2185b

**Verde Lima**
- `--color-lime-500`: #cddc39
- `--color-lime-600`: #c0d43b
- `--color-lime-700`: #afb42b

**Amarillo Brillante**
- `--color-yellow-500`: #ffed00
- `--color-yellow-600`: #fdd835
- `--color-yellow-700`: #fbc02d

**Teal Oscuro**
- `--color-teal-500`: #2d5e4f
- `--color-teal-600`: #26574a
- `--color-teal-700`: #1f4d42

#### Semantic Colors
- **Success**: #22c55e (500)
- **Warning**: #f59e0b (500)
- **Error**: #ef4444 (500)

#### Neutrals
- Rango completo 50-900 para backgrounds, bordes y textos

### Tipografía - Jerarquía de 3 Niveles

**Sistema tipográfico:** Nunito + Work Sans + Inter

#### 1. TÍTULOS (H1, H2)
- **Familia:** Nunito
- **Peso:** 800 (ExtraBold)
- **Uso:** Títulos principales, encabezados destacados
- **Carácter:** Redondeada, impactante, muy amigable

#### 2. SUBTÍTULOS (H3, H4, H5, H6)
- **Familia:** Work Sans
- **Peso:** 600-700 (Semibold/Bold)
- **Uso:** Subtítulos, encabezados de sección
- **Carácter:** Geométrica, clara, jerarquizada

#### 3. TEXTOS (body, UI, inputs)
- **Familia:** Inter
- **Peso:** 400-500 (Regular/Medium)
- **Uso:** Párrafos, UI, formularios, botones
- **Carácter:** Moderna, legible, profesional

**Ventajas del sistema:**
- ✅ Clara jerarquía visual con 3 familias distintas
- ✅ Excelente contraste tipográfico
- ✅ Máxima legibilidad en pantallas (Inter)
- ✅ Redondeada y amigable (títulos Nunito)
- ✅ Profesional y geométrica (subtítulos Work Sans)

**Tamaños:**
- xs: 12px
- sm: 14px
- base: 16px
- lg: 18px
- xl: 20px
- 2xl: 24px
- 3xl: 30px
- 4xl: 36px
- 5xl: 48px

**Pesos:**
- Normal: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Espaciado
Sistema basado en múltiplos de 4px:
- 1: 4px
- 2: 8px
- 3: 12px
- 4: 16px
- 5: 20px
- 6: 24px
- 8: 32px
- 10: 40px
- 12: 48px
- 16: 64px

### Border Radius
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- 2xl: 32px
- full: 9999px

### Sombras
- sm: Sutil
- md: Estándar para cards
- lg: Elevación media
- xl: Elevación alta
- 2xl: Máxima elevación

### Motion
- **Duración corta**: 150ms (hover, focus)
- **Duración media**: 300ms (transiciones, modales)
- **Duración larga**: 500ms (animaciones complejas)
- **Easing estándar**: cubic-bezier(0.4, 0.0, 0.2, 1)

---

## Componentes

### Button
**Variantes:**
- `primary`: Púrpura profundo (#6A0DAD / #7B1FA2) con sombra
- `secondary`: Naranja vibrante (#FF6B35) con sombra
- `ghost`: Transparente, hover suave

**Tamaños:**
- `sm`: Compacto
- `md`: Estándar
- `lg`: Destacado

**Props adicionales:**
- `isLoading`: Estado de carga con spinner
- `leftIcon / rightIcon`: Iconos opcionales

### Card
**Variantes:**
- `default`: Blanco con sombra media y borde
- `featured`: Gradiente sutil con borde primario y sombra XL

**Props:**
- `hoverable`: Efecto de elevación al hover

**Subcomponentes:**
- `CardHeader`: Encabezado con borde inferior
- `CardBody`: Contenido principal
- `CardFooter`: Pie con borde superior

### Badge
**Variantes:**
- `primary`, `accent`, `success`, `warning`, `error`, `neutral`

Cada una con background, texto y borde temático.

### Input
**Estados:**
- `default`: Borde neutral
- `focus`: Ring primario + borde primario
- `error`: Ring y borde de error

**Props:**
- `label`: Etiqueta superior
- `error`: Mensaje de error
- `helperText`: Texto de ayuda
- `leftIcon / rightIcon`: Iconos integrados

### Modal
**Tamaños:**
- `sm`, `md`, `lg`, `xl`

Incluye backdrop blur, animaciones de entrada/salida y botón de cierre integrado.

### Toast
**Variantes:**
- `success`, `error`, `warning`, `info`

Con íconos automáticos y animación desde la parte superior central.

### Navigation

#### DesktopNavbar
- Logo institucional con emoji 🤟
- Navegación horizontal con estados activos
- Altura: 80px (5rem)

#### MobileBottomNav
- 4 ítems con íconos y labels
- Indicador de sección activa
- Fixed bottom para mobile

### Estados de carga

#### LoadingState
- Spinner circular animado
- Mensaje personalizable

#### EmptyState
- Ícono, título, descripción
- Acción opcional (botón)

#### ErrorState
- Emoji de advertencia
- Mensaje personalizable
- Botón de reintentar

---

## Pantallas

### 1. Home
**Objetivo:** Landing page institucional cálida

**Elementos:**
- Hero con título principal
- Badge institucional (Universidad de Nariño)
- 3 cards de módulos (Asistente, Práctica, Diccionario)
- CTA destacado

### 2. Asistente
**Objetivo:** Reconocimiento en tiempo real

**Elementos:**
- Vista de cámara (aspect-video)
- Lista de señas reconocidas con confianza
- Estados: idle, loading, active, error
- Consejos en sidebar

### 3. Práctica
**Objetivo:** Gamificación y progreso

**Elementos:**
- Métricas: Puntaje, Racha, Objetivo diario
- Lista de ejercicios con dificultad
- Logros desbloqueables
- Progreso semanal

### 4. Diccionario
**Objetivo:** Catálogo visual (plus)

**Elementos:**
- Búsqueda con filtrado
- Categorías (Alfabeto, Números, Saludos, etc.)
- Grid de cards con preview de señas
- Badge "Plus" en título

---

## Breakpoints Responsive

- **Mobile**: < 768px (usa MobileBottomNav)
- **Tablet**: 768px - 1024px
- **Desktop**: ≥ 1440px (usa DesktopNavbar)

Todos los grids y layouts usan clases responsive de Tailwind.

---

## Paleta de Identidad Visual

**Estilo:** Vibrante, moderno, expresivo, inclusivo  
**Inspiración:** Paleta de colores brillantes con alto contraste  
**Contraste:** Optimizado para accesibilidad WCAG AA  
**Elevación:** Cards con sombras pronunciadas  
**Institucional:** Púrpura profundo + Naranja vibrante, tipografía clara

**Colores Principales:**
- **Púrpura #6A0DAD / #7B1FA2**: Creatividad, comunicación, sofisticación
- **Naranja #FF6B35**: Calidez, acción, entusiasmo

**Colores Complementarios:**
- **Cyan #00DBEE**: Energía, claridad, frescura
- **Rosa #E91E63**: Expresión, vitalidad
- **Verde Lima #CDDC39**: Naturaleza, crecimiento
- **Amarillo #FFED00**: Optimismo, atención
- **Teal #2D5E4F**: Estabilidad, profundidad

**Personalidad:**
- Creativa y expresiva
- Vibrante con alto contraste
- Inclusiva y accesible
- Moderna pero cálida
- Diseñada para destacar y comunicar
- Inspirada en diseño contemporáneo

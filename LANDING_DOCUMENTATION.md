# Landing Page - LSC Recognition

## Descripción General
Landing page responsive con enfoque institucional universitario para LSC Recognition, diseñada con metodología mobile-first y optimizada para formatos desktop (1440px) y mobile (390px).

---

## Estructura de Secciones

### 1. Hero Section
**Objetivo:** Presentación impactante del proyecto

**Elementos:**
- Badge institucional: "Universidad de Nariño - Diseño Gráfico"
- Título principal con gradiente: "Aprende Lengua de Señas Colombiana con Inteligencia Artificial"
- Subtítulo académico explicativo
- Dos CTAs:
  - Primario: "Probar Asistente" (azul)
  - Secundario: "Ver Características" (ghost con borde)
- Mockup de demo interactivo con decoraciones geométricas

**Diseño:**
- Fondo con 3 gradientes orgánicos difuminados (azul, naranja, verde)
- Tipografía display grande (4xl-6xl responsive)
- Espaciado generoso (pt-20, pb-16)

### 2. Features Section
**Objetivo:** Presentar los tres módulos principales

**Elementos:**
- Badge "Módulos principales"
- Título de sección con descripción
- Grid de 3 cards (1 columna móvil, 3 columnas desktop):
  - **Asistente Inteligente** (azul)
  - **Práctica Gamificada** (naranja)
  - **Diccionario Visual** (verde)

**Cada card incluye:**
- Ícono con gradiente en círculo
- Badge de categoría
- Título y descripción
- 3 highlights con checkmarks
- Botón "Explorar módulo"
- Efecto hover con scale en ícono

**Diseño:**
- Fondo blanco semi-transparente con backdrop-blur
- Tarjetas con sombra suave y borde
- Animaciones de entrada escalonadas (delay 0.1s)

### 3. How It Works Section
**Objetivo:** Explicar el proceso de uso en 3 pasos

**Elementos:**
- Badge "Proceso simple"
- Grid de 3 pasos numerados (01, 02, 03):
  1. Selecciona un módulo
  2. Interactúa con el sistema
  3. Recibe retroalimentación

**Cada paso incluye:**
- Número grande con gradiente
- Ícono decorativo en esquina
- Título y descripción
- Conectores visuales entre pasos (desktop only)

**Diseño:**
- Cards con background gradiente suave
- Flechas decorativas entre pasos (desktop)
- Layout responsive (1 columna móvil, 3 desktop)

### 4. Scope Section
**Objetivo:** Contextualizar el alcance académico

**Elementos:**
- Badge "Contexto académico"
- Grid de 4 items informativos:
  - Público objetivo
  - Materia
  - Propósito
  - Tecnología
- Card CTA final con dos botones

**Diseño:**
- Fondo con gradiente de primary a accent
- Grid 2x2 en móvil, 4 columnas en desktop
- Íconos con gradiente en cards pequeñas
- Card CTA destacada al final

### 5. Footer Institucional
**Objetivo:** Información de contacto y navegación

**Elementos:**
- Logo con emoji 🤟
- Descripción breve
- 3 columnas (responsive):
  - Módulos con links
  - Información institucional
  - Copyright

**Diseño:**
- Fondo oscuro (neutral-900)
- Texto blanco con variaciones de opacidad
- Grid responsive (1 columna móvil, 3 desktop)

---

## Diseño Visual

### Backgrounds Decorativos
Tres gradientes radiales difuminados con blur-3xl:
1. **Top-right:** azul/púrpura (600px)
2. **Bottom-left:** naranja/rosa (500px)
3. **Center:** verde/azul (400px)

### Tipografía
- **Display (títulos principales):** 4xl-6xl, font-bold
- **Headings (secciones):** 3xl-4xl, font-bold
- **Body (descripción):** lg-xl, regular
- **Small (metadata):** sm-base, regular

### Colores
- **Primary:** Azul #2563eb
- **Accent:** Naranja #f97316
- **Success:** Verde #22c55e
- **Neutral:** Escala de grises

### Espaciado
- Secciones: py-20 (desktop), py-16 (móvil)
- Cards: p-8 o p-6
- Gaps: 8 (grid), 4 (flex)

### Efectos
- **Hover en cards:** transform scale-110 en ícono
- **Animaciones:** motion/react con delays escalonados
- **Sombras:** xl en cards featured, md en estándar
- **Blur:** backdrop-blur-sm en overlays

---

## Componentes Reutilizables Utilizados

### Button
- Variantes: primary, secondary, ghost
- Tamaños: lg principalmente
- Props: leftIcon, rightIcon

### Card
- Variantes: default, featured
- Prop: hoverable (para efectos)
- Subcomponentes: CardBody

### Badge
- Variantes: primary, accent, success, neutral
- Uso: categorización y etiquetas

---

## Responsive Breakpoints

### Mobile (< 768px)
- Hero: 1 columna, texto 4xl
- Features: 1 columna
- How it works: 1 columna sin conectores
- Scope: 2 columnas (grid)
- Footer: 1 columna

### Tablet (768px - 1024px)
- How it works: 3 columnas con conectores
- Scope: 2 columnas

### Desktop (≥ 1440px)
- Features: 3 columnas
- How it works: 3 columnas con conectores
- Scope: 4 columnas
- Decoraciones geométricas visibles

---

## Estados de Interacción

### Botones
- **Default:** Color sólido con sombra
- **Hover:** Color más oscuro, sombra más grande
- **Disabled:** Opacidad 50%, cursor not-allowed

### Cards
- **Default:** Sombra md, borde sutil
- **Hover (hoverable):** transform translateY(-4px), sombra xl
- **Active:** Sin estado especial

---

## Scroll Behavior
- Botón "Ver Características" usa smooth scroll a #features
- Navegación fluida entre secciones

---

## Notas de Implementación

1. **Mobile-first:** Todas las clases sin prefijo son móvil, se añaden md: y lg: para responsive
2. **Gradientes:** Uso extensivo de from-{color} to-{color} en backgrounds e íconos
3. **Motion:** Todas las secciones tienen initial/animate con viewport once:true
4. **Accesibilidad:** Botones semánticos, estructura de headings correcta
5. **Performance:** Imágenes con aspect-ratio, lazy loading implícito en motion

---

## Mejoras Futuras Sugeridas

- Integrar videos reales en mockup de demo
- Añadir testimonios de estudiantes
- Agregar galería de señas populares
- Implementar animación Lottie en hero
- Añadir estadísticas en tiempo real (usuarios activos, señas aprendidas)

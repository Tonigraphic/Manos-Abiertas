# 🤟 Manos Abiertas

Asistente para la comunicación en **Lengua de Señas Colombiana (LSC)**.

## 📋 Descripción

Herramienta digital integral desde el enfoque del diseño gráfico, orientada a fortalecer los procesos de comunicación entre la comunidad sorda y oyente de la **Facultad de Artes de la Universidad de Nariño**. Desarrollada como demo institucional para la materia **Expresión** del primer semestre del **Programa de Diseño Gráfico**. La aplicación utiliza **MediaPipe Web** para reconocimiento de señas 100% en el navegador, sin necesidad de backend.

## ✨ Características

### 🎯 Tres Módulos Principales

1. **Asistente Inteligente**
   - Traductor español oyente → español sordo (sin conectores)
   - Reconocimiento de señas LSC en tiempo real con cámara

2. **Práctica Gamificada**
   - 10 ejercicios organizados por categoría
   - Sistema de puntos y rachas diarias
   - Logros desbloqueables

3. **Diccionario Visual**
   - 75 señas LSC catalogadas
   - 5 categorías temáticas
   - Búsqueda instantánea

### 📚 Vocabulario LSC Disponible (75 señas)

**🎨 Colores (20 señas)**
- Conceptos: Colores, Mezclar
- Primarios: Amarillo, Rojo, Azul
- Secundarios: Naranja, Verde, Violeta, Morado
- Mezclas: Amarillo-Naranja, Rojo-Naranja, Rojo-Violeta, Azul-Violeta, Azul-Verde, Amarillo-Verde
- Neutros: Blanco, Negro, Gris, Café, Crema

**🔤 Abecedario (29 señas)**
A-K, L, LL, M-Q, R, RR, S-Z, Ñ

**👋 Saludos y Presentación (5 señas)**
Hola, Mi nombre, Mi seña, Gracias, Profesor

**🏢 Oficina del Departamento (9 señas)**
- Horarios: Horario, Horario de clase, Horario de materia
- Matrícula: Proceso de matrícula, Matrícula académica, Matrícula financiera, Matrícula de materias
- Solicitudes: Enviar tarea, Solicitar certificado

**✏️ Materiales y Diseño (10 señas)**
- Materiales: Materiales, Agua, Hojas
- Herramientas: Lápiz, Pincel
- Conceptos: Textura, Volumen, Perspectiva, Capas
- Acciones: Separar

### 🛠️ Tecnologías

- **React 18** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS v4** - Estilos
- **MediaPipe Hands** - Reconocimiento de manos
- **LocalStorage** - Persistencia de datos

## 🚀 Instalación

### Prerrequisitos

- **Node.js** 18+ 
- **pnpm** (recomendado) o npm

### Pasos

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/manos-abiertas.git

# Navegar al directorio
cd manos-abiertas

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm vite
```

La aplicación estará disponible en `http://localhost:5173`

## 🌐 Configuración de traducción IA (producción y desarrollo)

El traductor usa este orden de prioridad:

1. OpenAI en `/api/translate`
2. Hugging Face como respaldo si OpenAI no está disponible
3. Fallback local para no romper la UI

Variables recomendadas:

- `OPENAI_API_KEY`: clave de OpenAI para traducción.
- `OPENAI_TRANSLATION_MODEL`: modelo de OpenAI a usar. Ejemplo: `gpt-4o-mini`.
- `HF_TRANSLATION_TOKEN`: token fine-grained con permiso **Make calls to Inference Providers**.
- `HF_TRANSLATION_MODEL`: modelo principal para el router de Hugging Face.
- `HF_WAIT_FOR_MODEL`: `true` solo si quieres esperar cargas frías del modelo.

Configuración recomendada para empezar:

```text
OPENAI_API_KEY=<tu_openai_api_key>
OPENAI_TRANSLATION_MODEL=gpt-4o-mini
HF_TRANSLATION_TOKEN=<tu_token_fine_grained>
HF_TRANSLATION_MODEL=openai/gpt-oss-20b
HF_WAIT_FOR_MODEL=false
```

En desarrollo local, el endpoint `/api/translate` se expone desde Vite para que el traductor también use OpenAI sin depender de Vercel.
Si OpenAI falla o no hay clave, la app intenta Hugging Face y finalmente cae al fallback local.

## 📱 Uso

### Permisos necesarios
- ✅ Acceso a cámara web (para módulo Asistente)
- ✅ Buena iluminación para mejor detección
- ✅ Navegador moderno (Chrome, Edge, Firefox)

### Navegación
1. Selecciona un módulo desde la pantalla principal
2. Completa ejercicios en el modo **Práctica** para ganar puntos
3. Consulta señas en el **Diccionario**
4. Practica en tiempo real en el **Asistente**

## 🎯 Alcance y Público Objetivo

### Alcance del demo
Proyecto desarrollado como demostración funcional en la **Universidad de Nariño - Facultad de Artes**.

### Público objetivo
**Estudiantes sordos usuarios de Lengua de Señas Colombiana (LSC)** y **comunidad académica de la Universidad de Nariño**.

## 🎨 Sistema de Diseño

### Paleta de Colores Vibrante

**Colores Principales:**
- **Púrpura Profundo** `#6A0DAD` / `#7B1FA2` - Color primario (botones, enlaces, highlights)
- **Naranja Vibrante** `#FF6B35` - Color de acento (llamadas a la acción)

**Colores Complementarios:**
- **Cyan Brillante** `#00DBEE` - Elementos frescos, informativos
- **Rosa/Magenta** `#E91E63` - Alertas y expresión
- **Verde Lima** `#CDDC39` - Éxitos y confirmaciones
- **Amarillo** `#FFED00` - Destacados y advertencias
- **Teal Oscuro** `#2D5E4F` - Elementos de estabilidad

**Características:**
- **Tipografía:** 
  - Títulos: Nunito ExtraBold (H1, H2) - Redondeada y amigable
  - Subtítulos: Work Sans Semibold (H3-H6) - Geométrica y clara
  - Textos: Inter Regular (body, UI) - Moderna y legible
- **Responsive:** Desktop (1440px), Tablet (768px), Mobile (390px)
- **Contraste:** Optimizado para accesibilidad WCAG AA
- **Inspiración:** Paleta vibrante moderna con alto contraste

## 🚀 Control de Despliegues (Vercel)

El proyecto utiliza una estrategia de ramas para visualizar diferentes etapas:

- **Rama `main`**: **Link Principal Público**. Contiene el prototipo con ergonomía optimizada, HUD alineado y diseño responsivo crítico (Etapa 2).
- **Rama `v1-antiguo`**: **Link Secundario (Archivo)**. Contiene el primer prototipo funcional sin las mejoras de diseño actuales (Etapa 1).
*Cada rama genera un link independiente en el dashboard de Vercel.*

## � Documentación Adicional

- `DESIGN_SYSTEM.md` - Sistema de diseño completo
- `TECHNICAL_DOCUMENTATION.md` - Documentación técnica
- `LSC_RECOGNITION_GUIDE.md` - Guía de reconocimiento LSC

## 👥 Créditos

Desarrollado como proyecto educativo para la **Universidad de Nariño**.

## 📄 Licencia

Este proyecto es de código abierto para fines educativos.

---

© 2026 Manos Abiertas - **Desarrollado con ❤️ para la comunidad sorda colombiana**

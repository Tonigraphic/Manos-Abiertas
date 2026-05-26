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

## 🌐 Configuración de traducción IA (producción)

Para que el traductor use Hugging Face en `/api/translate`, configura estas variables en Vercel (Production y Preview):

- `HF_TRANSLATION_TOKEN`: token fine-grained con permiso **Make calls to Inference Providers**.
- `HF_TRANSLATION_MODEL`: modelo principal para el router.
- `HF_TRANSLATION_MODELS`: dejar vacío mientras estabilizas el despliegue.
- `HF_TRANSLATION_CLASSIC_MODEL`: dejar vacío mientras estabilizas el despliegue.
- `HF_TRANSLATION_CLASSIC_MODELS`: dejar vacío mientras estabilizas el despliegue.
- `HF_WAIT_FOR_MODEL`: `true` solo si quieres esperar cargas frías del modelo.

Configuración recomendada para empezar:

```text
HF_TRANSLATION_TOKEN=<tu_token_fine_grained>
HF_TRANSLATION_MODEL=openai/gpt-oss-20b
HF_TRANSLATION_MODELS=
HF_TRANSLATION_CLASSIC_MODEL=
HF_TRANSLATION_CLASSIC_MODELS=
HF_WAIT_FOR_MODEL=false
```

Si quieres copiarlo rápido, usa `.env.example` como base local y replica los mismos valores en Vercel.

En Vercel, no dejes `HF_TRANSLATION_TOKEN` vacío: si falta, la app siempre caerá a fallback local.
Los valores de modelo deben ir exactos, sin punto final ni comillas extra.

Orden de uso real en la app:

1. `HF_TRANSLATION_MODEL` contra `router.huggingface.co`
2. Fallback local si Hugging Face no responde

Si no hay token o un modelo compatible, la app hace fallback local automáticamente sin romper la UI.

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

## 📚 Documentación Adicional

- `DESIGN_SYSTEM.md` - Sistema de diseño completo
- `TECHNICAL_DOCUMENTATION.md` - Documentación técnica
- `LSC_RECOGNITION_GUIDE.md` - Guía de reconocimiento LSC

## 👥 Créditos

Desarrollado como proyecto educativo para la **Universidad de Nariño**.

## 📄 Licencia

Este proyecto es de código abierto para fines educativos.

---

© 2026 Manos Abiertas - **Desarrollado con ❤️ para la comunidad sorda colombiana**

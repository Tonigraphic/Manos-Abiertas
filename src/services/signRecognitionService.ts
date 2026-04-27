/**
 * Sign Recognition Service - Manos Abiertas LSC
 * Maneja la carga de modelos ONNX desde Hugging Face y la lógica del diccionario.
 */

import * as ort from 'onnxruntime-web';

// Configurar la ruta de los archivos WASM para que ONNX Runtime los encuentre en public/
ort.env.wasm.wasmPaths = import.meta.env.BASE_URL;

import { HandLandmarks } from './handDetectionService';
import { LSC_VOCABULARY } from '../lib/lscData';

export interface RecognizedSign {
  sign: string;
  confidence: number;
  timestamp: number;
  handedness: 'Left' | 'Right' | 'Both';
}

export interface SignPattern {
  name: string;
  description: string;
  category: string;
  difficulty: 'Fácil' | 'Intermedio' | 'Avanzado';
  requiredHands: 1 | 2;
  videoUrl?: string;
  pattern?: (landmarks: HandLandmarks[]) => number;
}

// Rutas locales a los archivos ONNX (Deben estar en public/models/)
const BASE_URL = import.meta.env.BASE_URL;
const MODEL_URLS: Record<string, string> = {
  "Abecedario": `${BASE_URL}models/alphabet.onnx`,
  "Colores": `${BASE_URL}models/colors.onnx`,
  "Diseño": `${BASE_URL}models/design.onnx`,
  "Oficina": `${BASE_URL}models/office.onnx`,
  "Saludos": `${BASE_URL}models/greetings.onnx`
};


export class SignRecognitionService {
  private patterns: Map<string, SignPattern> = new Map();
  private session: ort.InferenceSession | null = null;
  private currentCategory: string | null = null;

  constructor() {
    this.initializePatterns();
  }

  /**
   * Carga los datos del diccionario desde lscData.ts
   * Esto soluciona que el contenido desapareciera de la vista
   */
  private initializePatterns(): void {
    Object.entries(LSC_VOCABULARY).forEach(([category, signs]) => {
      // Mapeo de nombres de categoría a los IDs usados en los filtros de la UI
      const catIdMap: Record<string, string> = {
        'Abecedario': 'alphabet',
        'Colores': 'colors',
        'Saludos': 'greetings',
        'Oficina': 'office',
        'Diseño': 'design'
      };

      const categoryId = catIdMap[category] || 'all';

      signs.forEach(sign => {
        this.patterns.set(sign.label.toUpperCase(), {
          name: sign.label,
          description: `Seña para ${sign.label} en LSC`,
          category: categoryId,
          difficulty: categoryId === 'office' || categoryId === 'design' ? 'Intermedio' : 'Fácil',
          requiredHands: 1,
          videoUrl: sign.url,
          pattern: () => 0 // Inferencia manual desactivada, se usará ONNX
        });
      });
    });
    console.log(`Servicio LSC: ${this.patterns.size} señas cargadas en el diccionario.`);
  }

  /**
   * Carga el modelo ONNX correspondiente desde Hugging Face
   */
  public async loadModel(category: string): Promise<void> {
    if (this.currentCategory === category && this.session) return;

    try {
      const url = MODEL_URLS[category];
      if (!url) throw new Error(`La categoría ${category} no tiene un modelo asignado.`);

      console.log(`Cargando modelo IA local para ${category} desde: ${url}`);
      this.session = await ort.InferenceSession.create(url);
      this.currentCategory = category;
      console.log("Modelo ONNX cargado exitosamente.");
    } catch (error) {
      console.error("Error al cargar el modelo de IA:", error);
    }
  }

  /**
   * Devuelve todas las señas para el DiccionarioView
   */
  public getAllSigns(): SignPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Predicción en tiempo real (A completar con la lógica de Tensores)
   */
  public async predict(landmarks: any): Promise<RecognizedSign | null> {
    if (!this.session) return null;
    // Aquí se implementará la transformación de puntos a tensores de entrada
    return null;
  }
}

export const signRecognitionService = new SignRecognitionService();

/**
 * Sign Recognition Service - Manos Abiertas LSC
 * Carga modelos ONNX y ejecuta inferencia en tiempo real sobre secuencias
 * de landmarks de manos (30 frames × 63 features).
 */

import * as ort from 'onnxruntime-web';

// ── ONNX Runtime config ────────────────────────────────────────────────
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/';
ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;

import { HandLandmarks } from './handDetectionService';
import { LSC_VOCABULARY } from '../lib/lscData';

// ── Interfaces ─────────────────────────────────────────────────────────
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

// ── Constantes del modelo ──────────────────────────────────────────────
const SEQUENCE_LENGTH = 30;       // Frames que el modelo espera
const LANDMARKS_PER_HAND = 21;    // Puntos de referencia por mano
const COORDS_PER_LANDMARK = 3;    // x, y, z
const FEATURES_PER_FRAME = LANDMARKS_PER_HAND * COORDS_PER_LANDMARK; // 63
const TOTAL_INPUT_SIZE = SEQUENCE_LENGTH * FEATURES_PER_FRAME;        // 1890
const CONFIDENCE_THRESHOLD = 0.80; // Solo mostrar si la IA está ≥80% segura

// ── Etiquetas por categoría (orden = salida del modelo) ────────────────
const CATEGORY_LABELS: Record<string, string[]> = {};
Object.entries(LSC_VOCABULARY).forEach(([category, signs]) => {
  CATEGORY_LABELS[category] = signs.map(s => s.label);
});

// ── Rutas a los modelos ONNX en public/models/ ────────────────────────
const BASE_URL = import.meta.env.BASE_URL;
const MODEL_URLS: Record<string, string> = {
  "Abecedario": `${BASE_URL}models/alphabet.onnx`,
  "Colores": `${BASE_URL}models/colors.onnx`,
  "Diseño": `${BASE_URL}models/design.onnx`,
  "Oficina": `${BASE_URL}models/office.onnx`,
  "Saludos": `${BASE_URL}models/greetings.onnx`
};

// ── Servicio ───────────────────────────────────────────────────────────
export class SignRecognitionService {
  private patterns: Map<string, SignPattern> = new Map();
  private session: ort.InferenceSession | null = null;
  private currentCategory: string | null = null;
  private inputName: string = '';
  private outputName: string = '';
  private frameBuffer: Float32Array[] = [];
  private isPredicting = false; // Evitar inferencias simultáneas

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns(): void {
    Object.entries(LSC_VOCABULARY).forEach(([category, signs]) => {
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
          pattern: () => 0
        });
      });
    });
    console.log(`Servicio LSC: ${this.patterns.size} señas cargadas en el diccionario.`);
  }

  /**
   * Carga el modelo ONNX correspondiente a una categoría
   */
  public async loadModel(category: string): Promise<void> {
    if (this.currentCategory === category && this.session) return;

    try {
      const url = MODEL_URLS[category];
      if (!url) throw new Error(`La categoría ${category} no tiene un modelo asignado.`);

      console.log(`Cargando modelo IA para "${category}"...`);

      // Descargar como ArrayBuffer para evitar problemas de MIME type
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status} al descargar el modelo`);
      const modelBuffer = await response.arrayBuffer();

      this.session = await ort.InferenceSession.create(modelBuffer, {
        executionProviders: ['wasm'],
      });

      this.inputName = this.session.inputNames[0];
      this.outputName = this.session.outputNames[0];
      this.currentCategory = category;
      this.frameBuffer = [];
      this.isPredicting = false;

      console.log(`✓ Modelo ONNX cargado: input="${this.inputName}" [1,${SEQUENCE_LENGTH},${FEATURES_PER_FRAME}], output="${this.outputName}"`);
    } catch (error) {
      console.error("Error al cargar el modelo de IA:", error);
      this.session = null;
      this.currentCategory = null;
    }
  }

  public getAllSigns(): SignPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Agrega un frame de landmarks al buffer y predice cuando hay 30 frames.
   *
   * IMPORTANTE según especificación del modelo:
   * - Los landmarks deben ser valores normalizados de MediaPipe (0.0 a 1.0)
   * - NO se deben multiplicar por ancho/alto del canvas
   * - El modelo fue entrenado con right_hand_landmarks
   * - Si se detecta mano izquierda, se flipea el eje X
   */
  public async predict(hand: HandLandmarks): Promise<RecognizedSign | null> {
    if (!this.session || !this.currentCategory || this.isPredicting) return null;

    // 1. Extraer 63 valores brutos normalizados (NO multiplicar por canvas)
    const frame = new Float32Array(FEATURES_PER_FRAME);
    for (let i = 0; i < Math.min(hand.landmarks.length, LANDMARKS_PER_HAND); i++) {
      let x = hand.landmarks[i][0]; // Valor normalizado 0.0 - 1.0
      const y = hand.landmarks[i][1];
      const z = hand.landmarks[i][2];

      // Si es mano izquierda, flipear X para simular mano derecha
      // (el modelo fue entrenado solo con right_hand_landmarks)
      if (hand.handedness === 'Left') {
        x = 1.0 - x;
      }

      frame[i * 3 + 0] = x;
      frame[i * 3 + 1] = y;
      frame[i * 3 + 2] = z;
    }

    // 2. Sliding window: agregar frame, mantener máximo 30
    this.frameBuffer.push(frame);
    if (this.frameBuffer.length > SEQUENCE_LENGTH) {
      this.frameBuffer.shift(); // Quitar el frame más viejo
    }

    // 3. Solo predecir cuando tenemos exactamente 30 frames
    if (this.frameBuffer.length < SEQUENCE_LENGTH) {
      return null;
    }

    try {
      this.isPredicting = true;

      // 4. Construir tensor [1, 30, 63] = Float32Array de 1890 números
      const sequenceData = new Float32Array(TOTAL_INPUT_SIZE);
      for (let f = 0; f < SEQUENCE_LENGTH; f++) {
        sequenceData.set(this.frameBuffer[f], f * FEATURES_PER_FRAME);
      }
      const inputTensor = new ort.Tensor('float32', sequenceData, [1, SEQUENCE_LENGTH, FEATURES_PER_FRAME]);

      // 5. Ejecutar inferencia
      const results = await this.session.run({ [this.inputName]: inputTensor });
      const output = results[this.outputName];
      const probabilities = output.data as Float32Array;

      // 6. Argmax
      let maxIdx = 0;
      let maxVal = -Infinity;
      for (let i = 0; i < probabilities.length; i++) {
        if (probabilities[i] > maxVal) {
          maxVal = probabilities[i];
          maxIdx = i;
        }
      }

      // 7. Softmax si son logits (fuera de rango 0-1)
      let confidence = maxVal;
      if (maxVal > 1 || maxVal < 0) {
        const maxLogit = Math.max(...Array.from(probabilities));
        const exps = Array.from(probabilities).map(v => Math.exp(v - maxLogit));
        const sumExps = exps.reduce((a, b) => a + b, 0);
        confidence = exps[maxIdx] / sumExps;
      }

      // 8. Mapear índice a etiqueta
      const labels = CATEGORY_LABELS[this.currentCategory];
      if (!labels || maxIdx >= labels.length) return null;

      // 9. Aplicar threshold de confianza
      if (confidence < CONFIDENCE_THRESHOLD) return null;

      return {
        sign: labels[maxIdx],
        confidence,
        timestamp: Date.now(),
        handedness: hand.handedness,
      };
    } catch (error) {
      console.error("Error en la predicción:", error);
      return null;
    } finally {
      this.isPredicting = false;
    }
  }

  /** Número de frames acumulados en el buffer (para UI feedback) */
  public get bufferProgress(): number {
    return this.frameBuffer.length / SEQUENCE_LENGTH;
  }

  public get isModelLoaded(): boolean {
    return this.session !== null;
  }

  public get activeCategory(): string | null {
    return this.currentCategory;
  }
}

export const signRecognitionService = new SignRecognitionService();

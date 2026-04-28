/**
 * Sign Recognition Service - Manos Abiertas LSC
 * Carga modelos ONNX (Holistic LSTM) y ejecuta inferencia en tiempo real.
 *
 * Estructura del modelo (MediaPipe Holistic + Keras LSTM):
 *   Input:  [1, 30, 1662]  →  1 batch, 30 frames, 1662 features/frame
 *   Features por frame (1662 total):
 *     - Pose:      33 landmarks × 4 (x, y, z, visibility) = 132
 *     - Face:     468 landmarks × 3 (x, y, z)             = 1404
 *     - Left hand:  21 landmarks × 3 (x, y, z)            = 63
 *     - Right hand: 21 landmarks × 3 (x, y, z)            = 63
 *   Output: probabilidades por clase (softmax)
 */

import * as ort from 'onnxruntime-web';

// ── ONNX Runtime config ────────────────────────────────────────────────
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/';
ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;

import { HolisticLandmarks } from './handDetectionService';
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
}

// ── Constantes del modelo ──────────────────────────────────────────────
const SEQUENCE_LENGTH = 30;
const POSE_LANDMARKS = 33;
const POSE_COORDS = 4;           // x, y, z, visibility
const FACE_LANDMARKS = 468;
const HAND_LANDMARKS = 21;
const LANDMARK_COORDS = 3;       // x, y, z

const FEATURES_PER_FRAME =
  (POSE_LANDMARKS * POSE_COORDS) +       // 132
  (FACE_LANDMARKS * LANDMARK_COORDS) +    // 1404
  (HAND_LANDMARKS * LANDMARK_COORDS) +    // 63 (left hand)
  (HAND_LANDMARKS * LANDMARK_COORDS);     // 63 (right hand)
  // Total: 1662

const TOTAL_INPUT_SIZE = SEQUENCE_LENGTH * FEATURES_PER_FRAME; // 49860
const CONFIDENCE_THRESHOLD = 0.75;

// ── Etiquetas por categoría ────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string[]> = {};
Object.entries(LSC_VOCABULARY).forEach(([category, signs]) => {
  // .sort() es crítico porque Python asigna los índices de clase
  // en orden alfabético (ej. Ñ va después de la Z por su código Unicode)
  CATEGORY_LABELS[category] = signs.map(s => s.label).sort();
});

// ── Rutas a modelos ────────────────────────────────────────────────────
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
  private isPredicting = false;

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns(): void {
    Object.entries(LSC_VOCABULARY).forEach(([category, signs]) => {
      const catIdMap: Record<string, string> = {
        'Abecedario': 'alphabet', 'Colores': 'colors',
        'Saludos': 'greetings', 'Oficina': 'office', 'Diseño': 'design'
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
        });
      });
    });
    console.log(`Servicio LSC: ${this.patterns.size} señas cargadas.`);
  }

  public async loadModel(category: string): Promise<void> {
    if (this.currentCategory === category && this.session) return;

    try {
      const url = MODEL_URLS[category];
      if (!url) throw new Error(`Categoría ${category} sin modelo`);

      console.log(`Cargando modelo Holistic para "${category}"...`);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = await response.arrayBuffer();

      this.session = await ort.InferenceSession.create(buffer, {
        executionProviders: ['wasm'],
      });

      this.inputName = this.session.inputNames[0];
      this.outputName = this.session.outputNames[0];
      this.currentCategory = category;
      this.frameBuffer = [];
      this.isPredicting = false;

      console.log(`✓ Modelo cargado: "${this.inputName}" [1,${SEQUENCE_LENGTH},${FEATURES_PER_FRAME}] → "${this.outputName}"`);
    } catch (error) {
      console.error("Error al cargar modelo:", error);
      this.session = null;
      this.currentCategory = null;
    }
  }

  public getAllSigns(): SignPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Construye un frame de 1662 features a partir de los datos de MediaPipe Holistic.
   * Orden: pose(132) + face(1404) + leftHand(63) + rightHand(63)
   */
  private buildFrame(holistic: HolisticLandmarks): Float32Array {
    const frame = new Float32Array(FEATURES_PER_FRAME);
    let offset = 0;

    // 1. Pose: 33 landmarks × 4 (x, y, z, visibility)
    for (let i = 0; i < POSE_LANDMARKS; i++) {
      if (holistic.pose && i < holistic.pose.length) {
        frame[offset + 0] = holistic.pose[i][0]; // x
        frame[offset + 1] = holistic.pose[i][1]; // y
        frame[offset + 2] = holistic.pose[i][2]; // z
        frame[offset + 3] = holistic.pose[i][3] ?? 0; // visibility
      }
      offset += POSE_COORDS;
    }

    // 2. Face: 468 landmarks × 3 (x, y, z)
    for (let i = 0; i < FACE_LANDMARKS; i++) {
      if (holistic.face && i < holistic.face.length) {
        frame[offset + 0] = holistic.face[i][0];
        frame[offset + 1] = holistic.face[i][1];
        frame[offset + 2] = holistic.face[i][2];
      }
      offset += LANDMARK_COORDS;
    }

    // 3. Left hand: 21 landmarks × 3 (x, y, z)
    for (let i = 0; i < HAND_LANDMARKS; i++) {
      if (holistic.leftHand && i < holistic.leftHand.length) {
        frame[offset + 0] = holistic.leftHand[i][0];
        frame[offset + 1] = holistic.leftHand[i][1];
        frame[offset + 2] = holistic.leftHand[i][2];
      }
      offset += LANDMARK_COORDS;
    }

    // 4. Right hand: 21 landmarks × 3 (x, y, z)
    for (let i = 0; i < HAND_LANDMARKS; i++) {
      if (holistic.rightHand && i < holistic.rightHand.length) {
        frame[offset + 0] = holistic.rightHand[i][0];
        frame[offset + 1] = holistic.rightHand[i][1];
        frame[offset + 2] = holistic.rightHand[i][2];
      }
      offset += LANDMARK_COORDS;
    }

    return frame;
  }

  /**
   * Agrega un frame holístico al buffer y predice al completar 30 frames.
   * Input: [1, 30, 1662] — todos los landmarks de MediaPipe Holistic.
   */
  public async predictHolistic(holistic: HolisticLandmarks): Promise<RecognizedSign | null> {
    if (!this.session || !this.currentCategory || this.isPredicting) return null;

    // 1. Construir frame de 1662 features
    const frame = this.buildFrame(holistic);

    // 2. Sliding window
    this.frameBuffer.push(frame);
    if (this.frameBuffer.length > SEQUENCE_LENGTH) {
      this.frameBuffer.shift();
    }

    // 3. Solo predecir con 30 frames completos
    if (this.frameBuffer.length < SEQUENCE_LENGTH) return null;

    try {
      this.isPredicting = true;

      // 4. Tensor [1, 30, 1662]
      const data = new Float32Array(TOTAL_INPUT_SIZE);
      for (let f = 0; f < SEQUENCE_LENGTH; f++) {
        data.set(this.frameBuffer[f], f * FEATURES_PER_FRAME);
      }
      const inputTensor = new ort.Tensor('float32', data, [1, SEQUENCE_LENGTH, FEATURES_PER_FRAME]);

      // 5. Inferencia
      const results = await this.session.run({ [this.inputName]: inputTensor });
      const probs = results[this.outputName].data as Float32Array;

      // 6. Argmax
      let maxIdx = 0, maxVal = -Infinity;
      for (let i = 0; i < probs.length; i++) {
        if (probs[i] > maxVal) { maxVal = probs[i]; maxIdx = i; }
      }

      // 7. Softmax si son logits
      let confidence = maxVal;
      if (maxVal > 1 || maxVal < 0) {
        const maxL = Math.max(...Array.from(probs));
        const exps = Array.from(probs).map(v => Math.exp(v - maxL));
        const sum = exps.reduce((a, b) => a + b, 0);
        confidence = exps[maxIdx] / sum;
      }

      // 8. Threshold + label
      const labels = CATEGORY_LABELS[this.currentCategory];
      if (!labels || maxIdx >= labels.length || confidence < CONFIDENCE_THRESHOLD) return null;

      // Detectar qué mano(s) están presentes
      const hasLeft = holistic.leftHand && holistic.leftHand.length > 0;
      const hasRight = holistic.rightHand && holistic.rightHand.length > 0;
      const handedness = hasLeft && hasRight ? 'Both' : hasRight ? 'Right' : 'Left';

      return {
        sign: labels[maxIdx],
        confidence,
        timestamp: Date.now(),
        handedness: handedness as 'Left' | 'Right' | 'Both',
      };
    } catch (error) {
      console.error("Error en predicción:", error);
      return null;
    } finally {
      this.isPredicting = false;
    }
  }

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

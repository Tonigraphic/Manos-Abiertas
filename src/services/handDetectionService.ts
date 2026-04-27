import { Hands, Results, HAND_CONNECTIONS } from '@mediapipe/hands';

export interface HandLandmarks {
  landmarks: number[][];
  handedness: 'Left' | 'Right';
  timestamp: number;
}

export class HandDetectionService {
  private hands: Hands | null = null;
  private isInitialized = false;
  private onResultsCallback: ((results: Results) => void) | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.hands = new Hands({
        locateFile: (file) => {
          // Forzamos la carga desde un CDN confiable y rápido
          return `https://jsdelivr.net{file}`;
        },
      });

      this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1, // 1 es ideal para web/móvil por velocidad
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      this.hands.onResults((results) => {
        if (this.onResultsCallback) {
          this.onResultsCallback(results);
        }
      });

      // Pequeño truco: hacemos una detección "vacía" para despertar al modelo
      await this.hands.initialize();
      this.isInitialized = true;
      console.log("MediaPipe: Detección de manos lista.");
    } catch (error) {
      console.error('Error MediaPipe:', error);
      throw new Error('No se pudo iniciar la detección de manos');
    }
  }

  async detectHands(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.hands || !this.isInitialized) return;
    
    // Solo enviamos si el video realmente tiene datos (evita que la pantalla se ponga gris)
    if (videoElement.readyState >= 2) {
      await this.hands.send({ image: videoElement });
    }
  }

  onResults(callback: (results: Results) => void): void {
    this.onResultsCallback = callback;
  }

  extractLandmarks(results: Results): HandLandmarks[] {
    if (!results.multiHandLandmarks) return [];

    return results.multiHandLandmarks.map((handLandmarks, index) => ({
      landmarks: handLandmarks.map((l) => [l.x, l.y, l.z]),
      handedness: results.multiHandedness[index].label as 'Left' | 'Right',
      timestamp: Date.now(),
    }));
  }

  get initialized(): boolean {
    return this.isInitialized;
  }
}

export const handDetectionService = new HandDetectionService();

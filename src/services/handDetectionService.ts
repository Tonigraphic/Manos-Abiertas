import { Holistic, Results } from '@mediapipe/holistic';

export interface HandLandmarks {
  landmarks: number[][];
  handedness: 'Left' | 'Right';
  timestamp: number;
}

export interface HolisticLandmarks {
  leftHand?: number[][];
  rightHand?: number[][];
  pose?: number[][];
  face?: number[][];
  timestamp: number;
}

export class HandDetectionService {
  private holistic: Holistic | null = null;
  private isInitialized = false;
  private onResultsCallback: ((results: Results) => void) | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.holistic = new Holistic({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
        },
      });

      this.holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        refineFaceLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      this.holistic.onResults((results) => {
        if (this.onResultsCallback) {
          this.onResultsCallback(results);
        }
      });

      // Inicialización inicial
      await this.holistic.initialize();
      this.isInitialized = true;
      console.log("MediaPipe: Holistic tracking listo.");
    } catch (error) {
      console.error('Error MediaPipe Holistic:', error);
      throw new Error('No se pudo iniciar la detección holística');
    }
  }

  async detectHands(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.holistic || !this.isInitialized) return;
    
    if (videoElement.readyState >= 2) {
      await this.holistic.send({ image: videoElement });
    }
  }

  onResults(callback: (results: Results) => void): void {
    this.onResultsCallback = callback;
  }

  extractLandmarks(results: Results): HandLandmarks[] {
    // Para mantener retrocompatibilidad con la firma existente
    const hands: HandLandmarks[] = [];
    const timestamp = Date.now();

    if (results.leftHandLandmarks) {
      hands.push({
        landmarks: results.leftHandLandmarks.map((l) => [l.x, l.y, l.z]),
        handedness: 'Left',
        timestamp
      });
    }

    if (results.rightHandLandmarks) {
      hands.push({
        landmarks: results.rightHandLandmarks.map((l) => [l.x, l.y, l.z]),
        handedness: 'Right',
        timestamp
      });
    }

    return hands;
  }

  extractHolistic(results: Results): HolisticLandmarks {
    return {
      leftHand: results.leftHandLandmarks?.map((l) => [l.x, l.y, l.z]),
      rightHand: results.rightHandLandmarks?.map((l) => [l.x, l.y, l.z]),
      pose: results.poseLandmarks?.map((l) => [l.x, l.y, l.z]),
      face: results.faceLandmarks?.map((l) => [l.x, l.y, l.z]),
      timestamp: Date.now()
    };
  }

  get initialized(): boolean {
    return this.isInitialized;
  }
}

export const handDetectionService = new HandDetectionService();

/**
 * Hand Detection Service using MediaPipe Hands
 * Detects hands in real-time from webcam feed
 */

import { Hands, Results } from '@mediapipe/hands';

export interface HandLandmarks {
  landmarks: number[][];
  handedness: 'Left' | 'Right';
  timestamp: number;
}

export interface DetectionResult {
  success: boolean;
  hands: HandLandmarks[];
  error?: string;
}

export class HandDetectionService {
  private hands: Hands | null = null;
  private isInitialized = false;
  private onResultsCallback: ((results: Results) => void) | null = null;

  /**
   * Initialize MediaPipe Hands
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.hands.onResults((results) => {
        if (this.onResultsCallback) {
          this.onResultsCallback(results);
        }
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing MediaPipe Hands:', error);
      throw new Error('Failed to initialize hand detection');
    }
  }

  /**
   * Process a video frame
   */
  async detectHands(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.hands || !this.isInitialized) {
      throw new Error('Hand detection service not initialized');
    }

    await this.hands.send({ image: videoElement });
  }

  /**
   * Set callback for detection results
   */
  onResults(callback: (results: Results) => void): void {
    this.onResultsCallback = callback;
  }

  /**
   * Extract landmarks from results
   */
  extractLandmarks(results: Results): HandLandmarks[] {
    if (!results.multiHandLandmarks || !results.multiHandedness) {
      return [];
    }

    return results.multiHandLandmarks.map((handLandmarks, index) => {
      const landmarks = handLandmarks.map((landmark) => [
        landmark.x,
        landmark.y,
        landmark.z,
      ]);

      const handedness = results.multiHandedness[index].label as 'Left' | 'Right';

      return {
        landmarks,
        handedness,
        timestamp: Date.now(),
      };
    });
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.hands) {
      this.hands.close();
      this.hands = null;
    }
    this.isInitialized = false;
    this.onResultsCallback = null;
  }

  /**
   * Check if service is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
export const handDetectionService = new HandDetectionService();

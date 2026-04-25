/**
 * Custom hook for LSC (Lengua de Señas Colombiana) Recognition
 * Manages hand detection and sign recognition in real-time
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { handDetectionService, HandLandmarks } from '../services/handDetectionService';
import { signRecognitionService, RecognizedSign } from '../services/signRecognitionService';
import { Results } from '@mediapipe/hands';

export interface RecognitionState {
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  currentSign: RecognizedSign | null;
  recognizedSigns: RecognizedSign[];
  handsDetected: number;
}

export interface UseLSCRecognitionReturn {
  state: RecognitionState;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  startRecognition: () => Promise<void>;
  stopRecognition: () => void;
  clearHistory: () => void;
}

export function useLSCRecognition(): UseLSCRecognitionReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<RecognitionState>({
    isActive: false,
    isLoading: false,
    error: null,
    currentSign: null,
    recognizedSigns: [],
    handsDetected: 0,
  });

  /**
   * Handle detection results from MediaPipe
   */
  const handleResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Extract hand landmarks
    const landmarks = handDetectionService.extractLandmarks(results);

    // Update hands detected count
    setState(prev => ({
      ...prev,
      handsDetected: landmarks.length,
    }));

    // Draw hand landmarks
    if (results.multiHandLandmarks) {
      for (const handLandmarks of results.multiHandLandmarks) {
        drawHandLandmarks(ctx, handLandmarks, canvas.width, canvas.height);
      }
    }

    // Recognize sign
    if (landmarks.length > 0) {
      const recognized = signRecognitionService.recognize(landmarks);
      
      if (recognized) {
        setState(prev => ({
          ...prev,
          currentSign: recognized,
          recognizedSigns: [
            recognized,
            ...prev.recognizedSigns.slice(0, 19) // Keep last 20
          ],
        }));
      }
    }
  }, []);

  /**
   * Draw hand landmarks on canvas
   */
  const drawHandLandmarks = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    width: number,
    height: number
  ) => {
    // Draw connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [5, 9], [9, 13], [13, 17] // Palm
    ];

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;

    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];

      ctx.beginPath();
      ctx.moveTo(startPoint.x * width, startPoint.y * height);
      ctx.lineTo(endPoint.x * width, endPoint.y * height);
      ctx.stroke();
    });

    // Draw landmarks
    ctx.fillStyle = '#f97316';
    landmarks.forEach(landmark => {
      ctx.beginPath();
      ctx.arc(
        landmark.x * width,
        landmark.y * height,
        5,
        0,
        2 * Math.PI
      );
      ctx.fill();
    });
  };

  /**
   * Process video frame
   */
  const processFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !state.isActive) return;

    try {
      await handDetectionService.detectHands(video);
    } catch (error) {
      console.error('Error processing frame:', error);
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [state.isActive]);

  /**
   * Start recognition
   */
  const startRecognition = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Initialize MediaPipe if not already initialized
      if (!handDetectionService.initialized) {
        await handDetectionService.initialize();
      }

      // Set up results callback
      handDetectionService.onResults(handleResults);

      // Get webcam stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      streamRef.current = stream;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) {
        throw new Error('Video or canvas element not found');
      }

      // Set up video
      video.srcObject = stream;
      await video.play();

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      setState(prev => ({
        ...prev,
        isActive: true,
        isLoading: false,
        error: null,
      }));

      // Start processing frames
      processFrame();

    } catch (error) {
      console.error('Error starting recognition:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isActive: false,
        error: error instanceof Error ? error.message : 'Error al iniciar el reconocimiento',
      }));
    }
  }, [handleResults, processFrame]);

  /**
   * Stop recognition
   */
  const stopRecognition = useCallback(() => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState(prev => ({
      ...prev,
      isActive: false,
      currentSign: null,
      handsDetected: 0,
    }));
  }, []);

  /**
   * Clear recognition history
   */
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      recognizedSigns: [],
      currentSign: null,
    }));
    signRecognitionService.clearHistory();
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopRecognition();
    };
  }, [stopRecognition]);

  return {
    state,
    videoRef,
    canvasRef,
    startRecognition,
    stopRecognition,
    clearHistory,
  };
}

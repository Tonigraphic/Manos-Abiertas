import { useState, useEffect, useCallback, useRef } from 'react';
import { wsClient, streamRecognition } from '@/lib/websocket';
import type { RecognitionResult, RecognizedSign } from '@/types';

export function useRecognition() {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognizedSigns, setRecognizedSigns] = useState<RecognizedSign[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopStreamRef = useRef<(() => void) | null>(null);

  const startRecognition = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Connect WebSocket
      await wsClient.connect();

      // Start streaming recognition
      if (videoRef.current) {
        const stopFn = await streamRecognition(
          videoRef.current,
          (result: RecognitionResult) => {
            const newSign: RecognizedSign = {
              id: Date.now().toString(),
              sign: result.sign,
              confidence: result.confidence,
              timestamp: new Date().toISOString(),
            };

            setRecognizedSigns(prev => [newSign, ...prev.slice(0, 9)]);
          },
          10 // 10 fps
        );

        stopStreamRef.current = stopFn;
      }

      setIsActive(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Error starting recognition:', err);
      setError(err instanceof Error ? err.message : 'Error al iniciar reconocimiento');
      setIsLoading(false);
      stopRecognition();
    }
  }, []);

  const stopRecognition = useCallback(() => {
    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Stop recognition streaming
    if (stopStreamRef.current) {
      stopStreamRef.current();
      stopStreamRef.current = null;
    }

    // Disconnect WebSocket
    wsClient.disconnect();

    setIsActive(false);
  }, []);

  const clearHistory = useCallback(() => {
    setRecognizedSigns([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecognition();
    };
  }, [stopRecognition]);

  return {
    isActive,
    isLoading,
    error,
    recognizedSigns,
    videoRef,
    startRecognition,
    stopRecognition,
    clearHistory,
  };
}

import { useEffect, useRef, useState, useCallback } from 'react';
import { handDetectionService } from '../services/handDetectionService';
import { signRecognitionService, RecognizedSign } from '../services/signRecognitionService';
import { Results } from '@mediapipe/hands';

export function useLSCRecognition() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isActiveRef = useRef(false);

  const [state, setState] = useState({
    isActive: false,
    isLoading: false,
    error: null as string | null,
    currentSign: null as RecognizedSign | null,
    recognizedSigns: [] as RecognizedSign[],
    handsDetected: 0,
  });

  // DIBUJO: Ahora solo dibuja los puntos, no el video (el video se ve por sí solo)
  const onResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    if (!canvas || !isActiveRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setState(prev => ({ ...prev, handsDetected: results.multiHandLandmarks.length }));
      
      for (const landmarks of results.multiHandLandmarks) {
        // Dibujamos solo los puntos naranjas sobre la mano
        ctx.fillStyle = '#f97316';
        for (const point of landmarks) {
          ctx.beginPath();
          ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // Procesar con IA
      const extracted = handDetectionService.extractLandmarks(results);
      if (extracted.length > 0) {
        signRecognitionService.predict(extracted).then(recognized => {
          if (recognized && recognized.confidence > 0.75) {
            setState(prev => ({
              ...prev,
              currentSign: recognized,
              recognizedSigns: [recognized, ...prev.recognizedSigns.slice(0, 9)]
            }));
          }
        });
      }
    } else {
      setState(prev => ({ ...prev, handsDetected: 0 }));
    }
  }, []);

  const startRecognition = async (category: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // 1. Iniciar cámara primero (más rápido)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Esperamos a que el video realmente tenga imagen
        await new Promise((resolve) => {
          if (!videoRef.current) return;
          videoRef.current.onloadeddata = () => {
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
            }
            resolve(true);
          };
        });
        await videoRef.current.play();
      }

      // 2. Cargar IA mientras la cámara ya se ve
      await signRecognitionService.loadModel(category);
      await handDetectionService.initialize();
      handDetectionService.onResults(onResults);

      isActiveRef.current = true;
      setState(prev => ({ ...prev, isActive: true, isLoading: false }));

      const run = async () => {
        if (!isActiveRef.current) return;
        if (videoRef.current?.readyState === 4) {
          await handDetectionService.detectHands(videoRef.current);
        }
        requestAnimationFrame(run);
      };
      run();

    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, error: "Error de acceso", isLoading: false }));
    }
  };

  const stopRecognition = useCallback(() => {
    isActiveRef.current = false;
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setState(prev => ({ ...prev, isActive: false, currentSign: null }));
  }, []);

  return { state, videoRef, canvasRef, startRecognition, stopRecognition };
}

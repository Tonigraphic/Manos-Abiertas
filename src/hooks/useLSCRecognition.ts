import { useEffect, useRef, useState, useCallback } from 'react';
import { handDetectionService } from '../services/handDetectionService';
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

export function useLSCRecognition() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isActiveRef = useRef(false);
  const requestRef = useRef<number>();

  const [state, setState] = useState<RecognitionState>({
    isActive: false,
    isLoading: false,
    error: null,
    currentSign: null,
    recognizedSigns: [],
    handsDetected: 0,
  });

  const drawResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !isActiveRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sincronización forzada de dimensiones
    if (video.videoWidth > 0 && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // EFECTO ESPEJO (Mirror)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    
    // DIBUJAR VIDEO (Esto asegura la imagen en pantalla)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // DIBUJAR PUNTOS Y RECONOCER
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setState(prev => ({ ...prev, handsDetected: results.multiHandLandmarks.length }));
      
      for (const landmarks of results.multiHandLandmarks) {
        ctx.fillStyle = '#f97316';
        for (const point of landmarks) {
          ctx.beginPath();
          ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // ENVIAR A IA
      const extracted = handDetectionService.extractLandmarks(results);
      if (extracted.length > 0) {
        // Pasamos el objeto completo de la mano detectada
        signRecognitionService.predict(extracted[0]).then(recognized => {
          if (recognized && recognized.confidence > 0.8) {
            setState(prev => ({
              ...prev,
              currentSign: recognized,
              recognizedSigns: [recognized, ...prev.recognizedSigns.slice(0, 15)]
            }));
          }
        });
      }
    } else {
      setState(prev => ({ ...prev, handsDetected: 0, currentSign: null }));
    }
    ctx.restore();
  }, []);

  const startRecognition = async (category: string = 'Abecedario') => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // 1. Cargar IA
      await signRecognitionService.loadModel(category);

      // 2. Configurar Cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Esperar a que el video tenga datos reales
        await new Promise((resolve) => {
          if (!videoRef.current) return;
          videoRef.current.onloadeddata = () => resolve(true);
        });

        await videoRef.current.play();
      }

      // 3. MediaPipe
      await handDetectionService.initialize();
      handDetectionService.onResults(drawResults);

      isActiveRef.current = true;
      setState(prev => ({ ...prev, isActive: true, isLoading: false }));

      // Bucle de detección estable
      const runDetection = async () => {
        if (!isActiveRef.current) return;
        if (videoRef.current && videoRef.current.readyState >= 2) {
          await handDetectionService.detectHands(videoRef.current);
        }
        requestRef.current = requestAnimationFrame(runDetection);
      };

      runDetection();

    } catch (err) {
      console.error("Error LSC:", err);
      setState(prev => ({ 
        ...prev, 
        error: "No se pudo activar la cámara.", 
        isLoading: false,
        isActive: false 
      }));
    }
  };

  const stopRecognition = useCallback(() => {
    isActiveRef.current = false;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setState(prev => ({ ...prev, isActive: false, currentSign: null, handsDetected: 0 }));
  }, []);

  useEffect(() => {
    return () => stopRecognition();
  }, [stopRecognition]);

  return { state, videoRef, canvasRef, startRecognition, stopRecognition };
}

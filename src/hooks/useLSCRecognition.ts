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
  const [state, setState] = useState<RecognitionState>({
    isActive: false,
    isLoading: false,
    error: null,
    currentSign: null,
    recognizedSigns: [],
    handsDetected: 0,
  });

  const isActiveRef = useRef(false);

  const drawResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !isActiveRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Asegurar que el canvas coincida con el video en cada frame por si cambia el tamaño
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // EFECTO ESPEJO (Mirror)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    
    // DIBUJAR VIDEO (Esto es lo que evita la pantalla negra)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // DIBUJAR PUNTOS DE LA IA
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setState(prev => ({ ...prev, handsDetected: results.multiHandLandmarks.length }));
      
      for (const landmarks of results.multiHandLandmarks) {
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 4;
        
        ctx.fillStyle = '#f97316';
        for (const point of landmarks) {
          ctx.beginPath();
          ctx.arc(point.x * canvas.width, point.y * canvas.height, 5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // PREDICCIÓN EN TIEMPO REAL
      const extracted = handDetectionService.extractLandmarks(results);
      if (extracted.length > 0) {
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
      if (state.handsDetected !== 0) setState(prev => ({ ...prev, handsDetected: 0 }));
    }
    ctx.restore();
  }, [state.handsDetected]);

  const startRecognition = async (category: string = 'Abecedario') => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // 1. Cargar modelo ONNX desde Hugging Face
      await signRecognitionService.loadModel(category);

      // 2. Acceso a cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Ajuste manual de dimensiones del canvas inmediato
        if (canvasRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
        }
      }

      // 3. MediaPipe
      await handDetectionService.initialize();
      handDetectionService.onResults(drawResults);

      isActiveRef.current = true;
      setState(prev => ({ ...prev, isActive: true, isLoading: false }));

      // Bucle de detección infinito
      const runDetection = async () => {
        if (!isActiveRef.current) return;
        
        if (videoRef.current && videoRef.current.readyState >= 2) {
          try {
            await handDetectionService.detectHands(videoRef.current);
          } catch (e) {
            console.warn("MediaPipe busy");
          }
        }
        requestAnimationFrame(runDetection);
      };

      runDetection();

    } catch (err) {
      console.error("Error iniciando cámara:", err);
      setState(prev => ({ 
        ...prev, 
        error: "No se pudo conectar con la cámara.", 
        isLoading: false,
        isActive: false 
      }));
    }
  };

  const stopRecognition = useCallback(() => {
    isActiveRef.current = false;
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setState(prev => ({ ...prev, isActive: false, currentSign: null, handsDetected: 0 }));
  }, []);

  useEffect(() => {
    return () => { stopRecognition(); };
  }, [stopRecognition]);

  return { state, videoRef, canvasRef, startRecognition, stopRecognition };
}

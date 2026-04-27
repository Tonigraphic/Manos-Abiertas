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

  // Usamos una ref para el estado activo para que el bucle de animación no se rompa
  const isActiveRef = useRef(false);

  const drawResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !canvasRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // EFECTO ESPEJO
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    
    // Dibujar el frame de la cámara
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setState(prev => ({ ...prev, handsDetected: results.multiHandLandmarks.length }));
      
      for (const landmarks of results.multiHandLandmarks) {
        // Dibujar Conexiones Básicas
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        
        // Dibujar Puntos (Landmarks)
        ctx.fillStyle = '#f97316';
        for (const point of landmarks) {
          ctx.beginPath();
          ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // Procesar con el servicio de reconocimiento (IA)
      const extracted = handDetectionService.extractLandmarks(results);
      if (extracted.length > 0) {
        // Realizamos la predicción con el modelo .onnx cargado
        signRecognitionService.predict(extracted[0]).then(recognized => {
          if (recognized) {
            setState(prev => ({
              ...prev,
              currentSign: recognized,
              recognizedSigns: [recognized, ...prev.recognizedSigns.slice(0, 15)]
            }));
          }
        });
      }
    } else {
      setState(prev => ({ ...prev, handsDetected: 0 }));
    }
    ctx.restore();
  }, []);

  const startRecognition = async (category: string = 'alphabet') => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // 1. Cargar modelo de Hugging Face
      await signRecognitionService.loadModel(category);

      // 2. Acceder a la cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: "user" 
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Ajustar canvas al tamaño real del video
        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
          }
        };
        
        await videoRef.current.play();
      }

      // 3. Inicializar MediaPipe
      await handDetectionService.initialize();
      handDetectionService.onResults(drawResults);

      isActiveRef.current = true;
      setState(prev => ({ ...prev, isActive: true, isLoading: false }));

      // Bucle de animación constante
      const runDetection = async () => {
        if (!isActiveRef.current) return;
        
        if (videoRef.current && videoRef.current.readyState >= 2) {
          await handDetectionService.detectHands(videoRef.current);
        }
        requestAnimationFrame(runDetection);
      };

      runDetection();

    } catch (err) {
      console.error("Error en useLSCRecognition:", err);
      setState(prev => ({ 
        ...prev, 
        error: "No se pudo acceder a la cámara. Verifica los permisos del navegador.", 
        isLoading: false,
        isActive: false 
      }));
    }
  };

  const stopRecognition = useCallback(() => {
    isActiveRef.current = false;
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setState(prev => ({ 
      ...prev, 
      isActive: false, 
      currentSign: null, 
      handsDetected: 0 
    }));
  }, []);

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      stopRecognition();
    };
  }, [stopRecognition]);

  return { state, videoRef, canvasRef, startRecognition, stopRecognition };
}

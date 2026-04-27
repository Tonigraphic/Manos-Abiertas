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

  // Función para dibujar los puntos (Simplificada y corregida)
  const drawResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // EFECTO ESPEJO: Para que sea natural al usuario
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    
    // Dibujar el frame de la cámara
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks) {
      setState(prev => ({ ...prev, handsDetected: results.multiHandLandmarks.length }));
      
      for (const landmarks of results.multiHandLandmarks) {
        // Dibujar conexiones
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3;
        // Aquí podrías usar DrawingUtils de MediaPipe o tu lógica de líneas
        
        // Dibujar puntos
        ctx.fillStyle = '#f97316';
        for (const point of landmarks) {
          ctx.beginPath();
          ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // ENVIAR A LA IA (Aquí conectamos con tus modelos .onnx)
      const landmarks = handDetectionService.extractLandmarks(results);
      if (landmarks.length > 0) {
        // Nota: predict ahora es async en el servicio
        signRecognitionService.predict(landmarks).then(recognized => {
          if (recognized) {
            setState(prev => ({
              ...prev,
              currentSign: recognized,
              recognizedSigns: [recognized, ...prev.recognizedSigns.slice(0, 15)]
            }));
          }
        });
      }
    }
    ctx.restore();
  }, []);

  const startRecognition = async (category: string = 'alphabet') => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // 1. CARGAR EL MODELO DE HUGGING FACE ANTES DE EMPEZAR
      await signRecognitionService.loadModel(category);

      // 2. INICIALIZAR CÁMARA
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Esperar a que el video cargue metadata para ajustar el canvas
        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
          }
        };
        await videoRef.current.play();
      }

      // 3. CONFIGURAR MEDIAPIPE
      await handDetectionService.initialize();
      handDetectionService.onResults(drawResults);

      // Bucle de detección
      const runDetection = async () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          await handDetectionService.detectHands(videoRef.current);
        }
        if (state.isActive) requestAnimationFrame(runDetection);
      };

      setState(prev => ({ ...prev, isActive: true, isLoading: false }));
      runDetection();

    } catch (err) {
      setState(prev => ({ ...prev, error: "No se pudo acceder a la cámara", isLoading: false }));
    }
  };

  const stopRecognition = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setState(prev => ({ ...prev, isActive: false }));
  }, []);

  return { state, videoRef, canvasRef, startRecognition, stopRecognition };
}

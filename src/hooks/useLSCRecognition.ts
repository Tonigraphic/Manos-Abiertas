import { useEffect, useRef, useState, useCallback } from 'react';
import { handDetectionService } from '../services/handDetectionService';
import { signRecognitionService, RecognizedSign } from '../services/signRecognitionService';
import { Results } from '@mediapipe/holistic';

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

  // DIBUJO: Dibuja puntos para manos y pose
  const onResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !isActiveRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajuste de tamaño del lienzo al video real
    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let detectedCount = 0;
    
    // Dibujar mano izquierda
    if (results.leftHandLandmarks) {
      detectedCount++;
      ctx.fillStyle = '#f97316'; // Naranja
      for (const point of results.leftHandLandmarks) {
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Dibujar mano derecha
    if (results.rightHandLandmarks) {
      detectedCount++;
      ctx.fillStyle = '#f97316'; // Naranja
      for (const point of results.rightHandLandmarks) {
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Dibujar pose (cuerpo)
    if (results.poseLandmarks) {
      ctx.fillStyle = '#3b82f6'; // Azul
      // Solo dibujamos los puntos de los brazos y hombros (indices 11 a 22 aproximadamente)
      for (let i = 11; i <= 22; i++) {
        const point = results.poseLandmarks[i];
        if (point && point.visibility && point.visibility > 0.5) {
          ctx.beginPath();
          ctx.arc(point.x * canvas.width, point.y * canvas.height, 5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    setState(prev => ({ ...prev, handsDetected: detectedCount }));

    // Enviar a la IA (mantenemos la compatibilidad enviando los landmarks de las manos)
    const extracted = handDetectionService.extractLandmarks(results);
    if (extracted.length > 0) {
      signRecognitionService.predict(extracted[0]).then(recognized => {
        if (recognized && recognized.confidence > 0.7) {
          setState(prev => ({
            ...prev,
            currentSign: recognized,
            recognizedSigns: [recognized, ...prev.recognizedSigns.slice(0, 9)]
          }));
        }
      });
    }
  }, []);

  const startRecognition = async (category: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // 1. Cargar el modelo ONNX
      await signRecognitionService.loadModel(category);

      // 2. Pedir cámara con configuración estándar
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } } // Resolución baja para fluidez
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // 3. Iniciar MediaPipe
      await handDetectionService.initialize();
      handDetectionService.onResults(onResults);

      isActiveRef.current = true;
      setState(prev => ({ ...prev, isActive: true, isLoading: false }));

      const run = async () => {
        if (!isActiveRef.current || !videoRef.current) return;
        if (videoRef.current.readyState === 4) {
          await handDetectionService.detectHands(videoRef.current);
        }
        requestAnimationFrame(run);
      };
      run();

    } catch (err) {
      console.error("Error cámara:", err);
      setState(prev => ({ ...prev, error: "No se pudo activar la cámara", isLoading: false }));
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

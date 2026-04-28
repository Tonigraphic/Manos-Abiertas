import { useRef, useState, useCallback } from 'react';
import { handDetectionService } from '../services/handDetectionService';
import { signRecognitionService, RecognizedSign } from '../services/signRecognitionService';
import { Results } from '@mediapipe/holistic';

// ── Configuración de rendimiento ───────────────────────────────────────
// El modelo necesita ~30 frames para predecir. A 20fps → ~1.5s para primera predicción.
const DETECTION_INTERVAL_MS = 50; // ~20 fps de detección MediaPipe

export function useLSCRecognition() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isActiveRef = useRef(false);
  const animFrameRef = useRef<number>(0);

  const [state, setState] = useState({
    isActive: false,
    isLoading: false,
    error: null as string | null,
    currentSign: null as RecognizedSign | null,
    recognizedSigns: [] as RecognizedSign[],
    handsDetected: 0,
    bufferProgress: 0,
  });

  // ── Dibujo de landmarks ───────────────────────────────────────────────
  const drawLandmarks = useCallback((ctx: CanvasRenderingContext2D, results: Results, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);

    // Mano izquierda — naranja
    if (results.leftHandLandmarks) {
      ctx.fillStyle = '#f97316';
      for (const p of results.leftHandLandmarks) {
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Mano derecha — naranja
    if (results.rightHandLandmarks) {
      ctx.fillStyle = '#f97316';
      for (const p of results.rightHandLandmarks) {
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Pose (brazos/hombros) — azul sutil
    if (results.poseLandmarks) {
      ctx.fillStyle = 'rgba(59,130,246,0.6)';
      for (let i = 11; i <= 22; i++) {
        const p = results.poseLandmarks[i];
        if (p && p.visibility && p.visibility > 0.5) {
          ctx.beginPath();
          ctx.arc(p.x * w, p.y * h, 5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
  }, []);

  // ── Callback de resultados de MediaPipe ───────────────────────────────
  const onResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !isActiveRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const hasLeft = !!results.leftHandLandmarks;
    const hasRight = !!results.rightHandLandmarks;
    const count = (hasLeft ? 1 : 0) + (hasRight ? 1 : 0);

    drawLandmarks(ctx, results, canvas.width, canvas.height);

    // Extraer landmarks (valores normalizados 0-1, SIN multiplicar por canvas)
    const extracted = handDetectionService.extractLandmarks(results);

    // Actualizar conteo de manos y progreso del buffer
    setState(prev => ({
      ...prev,
      handsDetected: count,
      bufferProgress: signRecognitionService.bufferProgress,
    }));

    // Enviar CADA frame al servicio (sin throttle).
    // El servicio maneja el buffer de 30 frames internamente.
    if (extracted.length > 0) {
      // Priorizar mano derecha (el modelo fue entrenado con right_hand_landmarks)
      const rightHand = extracted.find(h => h.handedness === 'Right');
      const hand = rightHand || extracted[0];

      signRecognitionService.predict(hand).then(recognized => {
        if (recognized) {
          setState(prev => ({
            ...prev,
            currentSign: recognized,
            bufferProgress: signRecognitionService.bufferProgress,
            recognizedSigns: [recognized, ...prev.recognizedSigns.slice(0, 9)]
          }));
        }
      });
    }
  }, [drawLandmarks]);

  // ── Iniciar reconocimiento ────────────────────────────────────────────
  const startRecognition = async (category: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // 1. Cargar modelo y cámara en paralelo
      const modelPromise = signRecognitionService.loadModel(category);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      await modelPromise;

      // 2. Iniciar MediaPipe Holistic
      await handDetectionService.initialize();
      handDetectionService.onResults(onResults);

      isActiveRef.current = true;
      setState(prev => ({ ...prev, isActive: true, isLoading: false, bufferProgress: 0 }));

      // 3. Bucle de detección a ~20fps
      let lastDetection = 0;
      const run = async () => {
        if (!isActiveRef.current || !videoRef.current) return;

        const now = performance.now();
        if (now - lastDetection >= DETECTION_INTERVAL_MS) {
          lastDetection = now;
          if (videoRef.current.readyState >= 2) {
            try {
              await handDetectionService.detectHands(videoRef.current);
            } catch { /* frame aislado puede fallar */ }
          }
        }

        animFrameRef.current = requestAnimationFrame(run);
      };
      animFrameRef.current = requestAnimationFrame(run);

    } catch (err) {
      console.error("Error al iniciar:", err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : "No se pudo activar la cámara",
        isLoading: false
      }));
    }
  };

  // ── Detener reconocimiento ────────────────────────────────────────────
  const stopRecognition = useCallback(() => {
    isActiveRef.current = false;
    cancelAnimationFrame(animFrameRef.current);

    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;

    setState(prev => ({ ...prev, isActive: false, currentSign: null, handsDetected: 0, bufferProgress: 0 }));
  }, []);

  return { state, videoRef, canvasRef, startRecognition, stopRecognition };
}

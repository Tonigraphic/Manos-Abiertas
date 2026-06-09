import React, { useRef, useEffect, useState } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { Holistic } from '@mediapipe/holistic';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { signRecognitionService, HolisticLandmarks, RecognizedSign } from '../services/signRecognitionService'; //

interface CameraFeedProps {
  onCameraReady: () => void;
  onSignRecognized: (sign: RecognizedSign | null) => void;
  activeCategory: string | null;
}

export function CameraFeed({ onCameraReady, onSignRecognized, activeCategory }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext('2d');

    if (!canvasCtx) return;

    const holistic = new Holistic({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
    });

    holistic.onResults((results) => {
      if (!canvasCtx || !videoElement || !activeCategory) return;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      // Extraer landmarks para el servicio de reconocimiento
      const holisticLandmarks: HolisticLandmarks = {
        pose: results.poseLandmarks ? results.poseLandmarks.map(lm => [lm.x, lm.y, lm.z, lm.visibility || 0]) : [],
        face: results.faceLandmarks ? results.faceLandmarks.map(lm => [lm.x, lm.y, lm.z]) : [],
        leftHand: results.leftHandLandmarks ? results.leftHandLandmarks.map(lm => [lm.x, lm.y, lm.z]) : [],
        rightHand: results.rightHandLandmarks ? results.rightHandLandmarks.map(lm => [lm.x, lm.y, lm.z]) : [],
      };

      // Dibujar landmarks (opcional, para depuración o visualización)
      drawConnectors(canvasCtx, results.poseLandmarks, Holistic.POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
      drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });
      drawConnectors(canvasCtx, results.leftHandLandmarks, Holistic.HAND_CONNECTIONS, { color: '#CC0000', lineWidth: 5 });
      drawLandmarks(canvasCtx, results.leftHandLandmarks, { color: '#FF0000', lineWidth: 2 });
      drawConnectors(canvasCtx, results.rightHandLandmarks, Holistic.HAND_CONNECTIONS, { color: '#00CC00', lineWidth: 5 });
      drawLandmarks(canvasCtx, results.rightHandLandmarks, { color: '#00FF00', lineWidth: 2 });
      drawConnectors(canvasCtx, results.faceLandmarks, Holistic.FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
      drawLandmarks(canvasCtx, results.faceLandmarks, { color: '#FFC0CB', lineWidth: 1 });

      canvasCtx.restore();

      // Realizar predicción solo si el modelo está cargado y no estamos ya prediciendo
      if (signRecognitionService.isModelLoaded && !isProcessing) { //
        setIsProcessing(true); // Bloquear nuevas predicciones hasta que esta termine
        signRecognitionService.predictHolistic(holisticLandmarks) //
          .then(recognized => {
            onSignRecognized(recognized);
            setIsProcessing(false);
          })
          .catch(error => {
            console.error("Error en la predicción:", error);
            setIsProcessing(false);
          });
      }
    });

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await holistic.send({ image: videoElement });
      },
      width: 640,
      height: 480,
    });

    camera.start()
      .then(() => {
        console.log("Cámara iniciada.");
        onCameraReady();
      })
      .catch((error) => {
        console.error("Error al iniciar la cámara:", error);
        // Manejar error de permisos o dispositivo no encontrado
      });

    return () => {
      camera.stop();
      holistic.close();
      console.log("Cámara detenida y Holistic cerrado.");
    };
  }, [onCameraReady, onSignRecognized, activeCategory, isProcessing]);

  return (
    <>
      <video ref={videoRef} className="hidden" autoPlay playsInline muted />
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
    </>
  );
}
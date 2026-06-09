import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraFeed } from '../components/CameraFeed';
import { InstructionOverlay } from '../components/InstructionOverlay';
import { ExerciseDisplay } from '../components/ExerciseDisplay';
import { FeedbackDisplay } from '../components/FeedbackDisplay';
import { ProgressBar } from '../components/ProgressBar';
import { signRecognitionService, RecognizedSign } from '../services/signRecognitionService'; //
import { LSC_VOCABULARY } from '../lib/lscData'; // Asumiendo que tienes un archivo para el vocabulario LSC

interface Exercise {
  id: string;
  sign: string;
  category: string;
  videoUrl?: string;
}

export function PracticePage() {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [score, setScore] = useState(0);
  const [exerciseProgress, setExerciseProgress] = useState(0);
  const recognizedSignRef = useRef<RecognizedSign | null>(null); // Usar ref para evitar re-renders excesivos

  // Cargar un modelo de ejemplo al iniciar el componente
  useEffect(() => {
    const loadInitialModel = async () => {
      // Aquí deberías tener lógica para seleccionar la categoría del ejercicio
      // Por ahora, cargamos una categoría de ejemplo, por ejemplo, "Abecedario"
      try {
        await signRecognitionService.loadModel("Abecedario"); //
        console.log("Modelo de Abecedario cargado para práctica.");
      } catch (error) {
        console.error("Error al cargar el modelo para práctica:", error);
        // Manejar error, quizás mostrar un mensaje al usuario
      }
    };
    loadInitialModel();

    // Limpiar el estado del servicio al desmontar
    return () => {
      signRecognitionService.resetTemporalState(); //
    };
  }, []);

  // Lógica para iniciar un nuevo ejercicio
  const startNewExercise = useCallback(() => {
    // Aquí deberías obtener un ejercicio aleatorio o secuencial
    // Ejemplo: Tomar una seña del vocabulario LSC
    const alphabetSigns = LSC_VOCABULARY.Abecedario;
    if (alphabetSigns && alphabetSigns.length > 0) {
      const randomIndex = Math.floor(Math.random() * alphabetSigns.length);
      const selectedSign = alphabetSigns[randomIndex];
      setCurrentExercise({
        id: selectedSign.label,
        sign: selectedSign.label,
        category: "Abecedario",
        videoUrl: selectedSign.url,
      });
      setFeedback(null);
      setExerciseProgress(0);
    }
  }, []);

  useEffect(() => {
    if (isCameraReady && !currentExercise) {
      startNewExercise();
    }
  }, [isCameraReady, currentExercise, startNewExercise]);

  // Callback para recibir las señas reconocidas desde CameraFeed
  const handleSignRecognized = useCallback((recognized: RecognizedSign | null) => {
    recognizedSignRef.current = recognized; // Actualizar la ref

    if (currentExercise && recognized && recognized.sign.toUpperCase() === currentExercise.sign.toUpperCase()) {
      setFeedback('correct');
      setScore(prev => prev + 10); // Ejemplo de puntuación
      setExerciseProgress(prev => prev + 1); // Avanzar en el progreso
      // Después de un acierto, podrías iniciar un nuevo ejercicio automáticamente
      setTimeout(() => startNewExercise(), 1500);
    } else if (recognized && recognized.sign.toUpperCase() !== currentExercise?.sign.toUpperCase()) {
      setFeedback('incorrect');
      // Podrías añadir lógica para penalizar o dar pistas
    }
  }, [currentExercise, startNewExercise]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-700 to-indigo-900 text-white p-4">
      {/* Overlay de instrucciones */}
      <InstructionOverlay
        show={showInstructions}
        onClose={() => setShowInstructions(false)}
        onToggle={() => setShowInstructions(prev => !prev)}
      />

      <h1 className="text-4xl font-extrabold mb-6 text-center">Práctica Gamificada LSC</h1>

      <div className="relative w-full max-w-4xl bg-gray-800 rounded-lg shadow-2xl p-6 flex flex-col lg:flex-row gap-6">
        {/* Columna izquierda: Cámara y Feedback */}
        <div className="flex-1 flex flex-col items-center">
          <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden mb-4">
            <CameraFeed
              onCameraReady={() => setIsCameraReady(true)}
              onSignRecognized={handleSignRecognized}
              activeCategory={signRecognitionService.activeCategory} //
            />
            {!isCameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 text-lg">
                Cargando cámara y modelo...
              </div>
            )}
          </div>
          <FeedbackDisplay feedback={feedback} />
        </div>

        {/* Columna derecha: Ejercicio y Progreso */}
        <div className="lg:w-1/3 flex flex-col justify-between">
          <ExerciseDisplay exercise={currentExercise} />
          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-2">Progreso</h2>
            <ProgressBar current={exerciseProgress} total={10} /> {/* Ejemplo de 10 ejercicios */}
            <p className="text-lg mt-2">Puntuación: {score}</p>
            {/* Aquí puedes añadir más elementos como rachas diarias, logros, etc. */}
          </div>
          <button
            onClick={() => setShowInstructions(true)}
            className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Ver Instrucciones
          </button>
        </div>
      </div>
    </div>
  );
}
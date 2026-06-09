import React from 'react';
import { motion } from 'framer-motion';

interface ExerciseDisplayProps {
  exercise: { sign: string; videoUrl?: string } | null;
}

export function ExerciseDisplay({ exercise }: ExerciseDisplayProps) {
  if (!exercise) {
    return (
      <div className="bg-gray-700 p-4 rounded-md text-center">
        <p className="text-lg">Cargando ejercicio...</p>
      </div>
    );
  }

  return (
    <motion.div
      key={exercise.sign} // Cambiar key para forzar animación al cambiar de ejercicio
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-700 p-4 rounded-md text-center"
    >
      <h2 className="text-3xl font-bold mb-2 text-orange-400">Realiza la seña:</h2>
      <p className="text-5xl font-extrabold mb-4">{exercise.sign.toUpperCase()}</p>
      {exercise.videoUrl && (
        <video
          src={exercise.videoUrl}
          className="w-full h-48 object-contain bg-black rounded-md mb-2"
          autoPlay
          loop
          muted
          playsInline
        />
      )}
      <p className="text-sm text-gray-400">Observa el video para guiarte.</p>
    </motion.div>
  );
}
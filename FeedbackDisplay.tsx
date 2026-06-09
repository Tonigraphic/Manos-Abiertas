import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedbackDisplayProps {
  feedback: 'correct' | 'incorrect' | null;
}

export function FeedbackDisplay({ feedback }: FeedbackDisplayProps) {
  return (
    <div className="h-16 flex items-center justify-center w-full">
      <AnimatePresence>
        {feedback === 'correct' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="text-green-400 text-3xl font-bold"
          >
            ¡Correcto! ✅
          </motion.div>
        )}
        {feedback === 'incorrect' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="text-red-400 text-3xl font-bold"
          >
            Intenta de nuevo ❌
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
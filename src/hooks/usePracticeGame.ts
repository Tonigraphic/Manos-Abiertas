/**
 * Custom hook for gamified practice mode
 * Manages game state, scoring, and exercises
 */

import { useState, useCallback, useEffect } from 'react';
import { signRecognitionService, SignPattern } from '../services/signRecognitionService';
import { RecognizedSign } from '../services/signRecognitionService';

export interface PracticeStats {
  score: number;
  streak: number;
  dailyProgress: number;
  dailyGoal: number;
  totalPracticed: number;
  accuracy: number;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  difficulty: 'Fácil' | 'Intermedio' | 'Avanzado';
  category: string;
  points: number;
  signs: SignPattern[];
  completed: boolean;
  bestScore: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  requirement: number;
  progress: number;
}

export interface GameSession {
  isActive: boolean;
  currentExercise: Exercise | null;
  currentSignIndex: number;
  correctAnswers: number;
  incorrectAnswers: number;
  startTime: number | null;
  endTime: number | null;
}

const STORAGE_KEY = 'lsc_practice_stats';
const ACHIEVEMENTS_KEY = 'lsc_achievements';

export function usePracticeGame() {
  const [stats, setStats] = useState<PracticeStats>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      score: 0,
      streak: 0,
      dailyProgress: 0,
      dailyGoal: 50,
      totalPracticed: 0,
      accuracy: 100,
    };
  });

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [session, setSession] = useState<GameSession>({
    isActive: false,
    currentExercise: null,
    currentSignIndex: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    startTime: null,
    endTime: null,
  });

  /**
   * Initialize exercises from sign patterns - Basado en vocabulario disponible
   */
  useEffect(() => {
    const allSigns = signRecognitionService.getAllSigns();

    const exerciseList: Exercise[] = [
      {
        id: 'colors-primary',
        title: 'Colores Primarios',
        description: 'Amarillo, Azul y Rojo',
        difficulty: 'Fácil',
        category: 'colors',
        points: 10,
        signs: allSigns.filter(s =>
          s.category === 'colors' &&
          ['Amarillo', 'Azul', 'Rojo'].includes(s.name)
        ),
        completed: false,
        bestScore: 0,
      },
      {
        id: 'colors-secondary',
        title: 'Colores Secundarios',
        description: 'Naranja, Verde, Violeta y Morado',
        difficulty: 'Fácil',
        category: 'colors',
        points: 10,
        signs: allSigns.filter(s =>
          s.category === 'colors' &&
          ['Naranja', 'Verde', 'Violeta', 'Morado'].includes(s.name)
        ),
        completed: false,
        bestScore: 0,
      },
      {
        id: 'colors-neutral',
        title: 'Colores Neutros',
        description: 'Blanco, Negro, Gris, Café y Crema',
        difficulty: 'Fácil',
        category: 'colors',
        points: 10,
        signs: allSigns.filter(s =>
          s.category === 'colors' &&
          ['Blanco', 'Negro', 'Gris', 'Café', 'Crema'].includes(s.name)
        ),
        completed: false,
        bestScore: 0,
      },
      {
        id: 'alphabet-basics',
        title: 'Abecedario (A-M)',
        description: 'Primeras 13 letras del alfabeto LSC',
        difficulty: 'Fácil',
        category: 'alphabet',
        points: 15,
        signs: allSigns.filter(s => s.category === 'alphabet').slice(0, 13),
        completed: false,
        bestScore: 0,
      },
      {
        id: 'alphabet-advanced',
        title: 'Abecedario (N-Z)',
        description: 'Últimas letras incluido Ñ, LL y RR',
        difficulty: 'Fácil',
        category: 'alphabet',
        points: 15,
        signs: allSigns.filter(s => s.category === 'alphabet').slice(13),
        completed: false,
        bestScore: 0,
      },
      {
        id: 'greetings',
        title: 'Saludos y Presentación',
        description: 'Hola, Mi nombre, Mi seña, Profesor, Gracias',
        difficulty: 'Fácil',
        category: 'greetings',
        points: 10,
        signs: allSigns.filter(s => s.category === 'greetings'),
        completed: false,
        bestScore: 0,
      },
      {
        id: 'office',
        title: 'Oficina del Departamento',
        description: 'Horarios, matrícula y trámites académicos',
        difficulty: 'Intermedio',
        category: 'office',
        points: 20,
        signs: allSigns.filter(s => s.category === 'office'),
        completed: false,
        bestScore: 0,
      },
      {
        id: 'design-materials',
        title: 'Materiales y Diseño',
        description: 'Herramientas y conceptos de diseño gráfico',
        difficulty: 'Intermedio',
        category: 'design',
        points: 20,
        signs: allSigns.filter(s => s.category === 'design'),
        completed: false,
        bestScore: 0,
      },
      {
        id: 'full-alphabet',
        title: 'Abecedario Completo',
        description: 'Desafío: A-Z + Ñ, LL, RR (29 letras)',
        difficulty: 'Avanzado',
        category: 'alphabet',
        points: 30,
        signs: allSigns.filter(s => s.category === 'alphabet'),
        completed: false,
        bestScore: 0,
      },
      {
        id: 'all-colors',
        title: 'Todos los Colores',
        description: 'Desafío: 20 colores y mezclas',
        difficulty: 'Avanzado',
        category: 'colors',
        points: 30,
        signs: allSigns.filter(s => s.category === 'colors'),
        completed: false,
        bestScore: 0,
      },
    ];

    setExercises(exerciseList);
  }, []);

  /**
   * Initialize achievements
   */
  useEffect(() => {
    const saved = localStorage.getItem(ACHIEVEMENTS_KEY);
    const baseAchievements: Achievement[] = [
      {
        id: 'first-sign',
        title: 'Primera Seña',
        description: 'Completa tu primer ejercicio',
        icon: '🎯',
        unlocked: false,
        requirement: 1,
        progress: 0,
      },
      {
        id: 'week-streak',
        title: '7 Días Seguidos',
        description: 'Mantén una racha de 7 días',
        icon: '🔥',
        unlocked: false,
        requirement: 7,
        progress: 0,
      },
      {
        id: 'century',
        title: 'Centenario',
        description: 'Alcanza 100 puntos',
        icon: '💯',
        unlocked: false,
        requirement: 100,
        progress: 0,
      },
      {
        id: 'perfectionist',
        title: 'Perfeccionista',
        description: 'Completa un ejercicio sin errores',
        icon: '⭐',
        unlocked: false,
        requirement: 1,
        progress: 0,
      },
      {
        id: 'master',
        title: 'Maestro LSC',
        description: 'Completa todos los ejercicios',
        icon: '🏆',
        unlocked: false,
        requirement: 7,
        progress: 0,
      },
      {
        id: 'speed-demon',
        title: 'Velocista',
        description: 'Completa un ejercicio en menos de 2 minutos',
        icon: '⚡',
        unlocked: false,
        requirement: 1,
        progress: 0,
      },
    ];

    if (saved) {
      const savedAchievements = JSON.parse(saved);
      setAchievements(savedAchievements);
    } else {
      setAchievements(baseAchievements);
    }
  }, []);

  /**
   * Save stats to localStorage
   */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }, [stats]);

  /**
   * Save achievements to localStorage
   */
  useEffect(() => {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  }, [achievements]);

  /**
   * Start an exercise
   */
  const startExercise = useCallback((exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    setSession({
      isActive: true,
      currentExercise: exercise,
      currentSignIndex: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      startTime: Date.now(),
      endTime: null,
    });
  }, [exercises]);

  /**
   * Check if recognized sign matches current target
   */
  const checkAnswer = useCallback((recognized: RecognizedSign): boolean => {
    if (!session.currentExercise || !session.isActive) return false;

    const targetSign = session.currentExercise.signs[session.currentSignIndex];
    const isCorrect = recognized.sign.toLowerCase() === targetSign.name.toLowerCase();

    if (isCorrect) {
      setSession(prev => ({
        ...prev,
        correctAnswers: prev.correctAnswers + 1,
      }));
    } else {
      setSession(prev => ({
        ...prev,
        incorrectAnswers: prev.incorrectAnswers + 1,
      }));
    }

    return isCorrect;
  }, [session]);

  /**
   * Move to next sign in exercise
   */
  const nextSign = useCallback(() => {
    if (!session.currentExercise) return false;

    const isLastSign = session.currentSignIndex >= session.currentExercise.signs.length - 1;

    if (isLastSign) {
      // Exercise completed
      return false;
    }

    setSession(prev => ({
      ...prev,
      currentSignIndex: prev.currentSignIndex + 1,
    }));

    return true;
  }, [session]);

  /**
   * Complete the current exercise
   */
  const completeExercise = useCallback(() => {
    if (!session.currentExercise) return;

    const totalAttempts = session.correctAnswers + session.incorrectAnswers;
    const accuracy = totalAttempts > 0 ? (session.correctAnswers / totalAttempts) * 100 : 0;
    const earnedPoints = Math.round((accuracy / 100) * session.currentExercise.points);
    const duration = session.startTime ? Date.now() - session.startTime : 0;

    // Update stats
    setStats(prev => ({
      ...prev,
      score: prev.score + earnedPoints,
      dailyProgress: prev.dailyProgress + earnedPoints,
      totalPracticed: prev.totalPracticed + 1,
      accuracy: Math.round(((prev.accuracy * prev.totalPracticed) + accuracy) / (prev.totalPracticed + 1)),
    }));

    // Update exercise
    setExercises(prev => prev.map(ex => {
      if (ex.id === session.currentExercise!.id) {
        return {
          ...ex,
          completed: true,
          bestScore: Math.max(ex.bestScore, earnedPoints),
        };
      }
      return ex;
    }));

    // Check achievements
    checkAchievements(earnedPoints, accuracy, duration);

    // End session
    setSession(prev => ({
      ...prev,
      isActive: false,
      endTime: Date.now(),
    }));

    return {
      accuracy,
      earnedPoints,
      duration,
    };
  }, [session]);

  /**
   * Check and unlock achievements
   */
  const checkAchievements = useCallback((earnedPoints: number, accuracy: number, duration: number) => {
    setAchievements(prev => prev.map(achievement => {
      if (achievement.unlocked) return achievement;

      let shouldUnlock = false;
      let newProgress = achievement.progress;

      switch (achievement.id) {
        case 'first-sign':
          newProgress = stats.totalPracticed + 1;
          shouldUnlock = newProgress >= achievement.requirement;
          break;
        case 'week-streak':
          newProgress = stats.streak;
          shouldUnlock = newProgress >= achievement.requirement;
          break;
        case 'century':
          newProgress = stats.score + earnedPoints;
          shouldUnlock = newProgress >= achievement.requirement;
          break;
        case 'perfectionist':
          if (accuracy === 100) {
            newProgress = 1;
            shouldUnlock = true;
          }
          break;
        case 'master':
          const completedCount = exercises.filter(ex => ex.completed).length;
          newProgress = completedCount;
          shouldUnlock = newProgress >= achievement.requirement;
          break;
        case 'speed-demon':
          if (duration < 120000) { // 2 minutes
            newProgress = 1;
            shouldUnlock = true;
          }
          break;
      }

      return {
        ...achievement,
        progress: newProgress,
        unlocked: shouldUnlock,
        unlockedAt: shouldUnlock ? Date.now() : undefined,
      };
    }));
  }, [stats, exercises]);

  /**
   * Cancel current session
   */
  const cancelExercise = useCallback(() => {
    setSession({
      isActive: false,
      currentExercise: null,
      currentSignIndex: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      startTime: null,
      endTime: null,
    });
  }, []);

  /**
   * Reset all progress
   */
  const resetProgress = useCallback(() => {
    setStats({
      score: 0,
      streak: 0,
      dailyProgress: 0,
      dailyGoal: 50,
      totalPracticed: 0,
      accuracy: 100,
    });
    setExercises(prev => prev.map(ex => ({
      ...ex,
      completed: false,
      bestScore: 0,
    })));
    setAchievements(prev => prev.map(a => ({
      ...a,
      unlocked: false,
      progress: 0,
      unlockedAt: undefined,
    })));
  }, []);

  return {
    stats,
    exercises,
    achievements,
    session,
    startExercise,
    checkAnswer,
    nextSign,
    completeExercise,
    cancelExercise,
    resetProgress,
  };
}

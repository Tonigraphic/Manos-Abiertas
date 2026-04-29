import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { Badge } from '../components/lsc/Badge';
import { BackToHome } from '../components/lsc/BackToHome';
import { Trophy, Target, Flame, Star, Play, Camera, Check, X as XIcon, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InstructionsModal } from '../components/lsc/InstructionsModal';
import { usePracticeGame } from '../../hooks/usePracticeGame';
import { useLSCRecognition } from '../../hooks/useLSCRecognition';
import confetti from 'canvas-confetti';

interface PracticeViewProps {
  onNavigateHome?: () => void;
}

export function PracticeView({ onNavigateHome }: PracticeViewProps = {}) {
  const {
    stats,
    exercises,
    achievements,
    session,
    startExercise,
    checkAnswer,
    nextSign,
    completeExercise,
    cancelExercise,
  } = usePracticeGame();

  const {
    state: recognitionState,
    videoRef,
    canvasRef,
    startRecognition,
    stopRecognition,
  } = useLSCRecognition();

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Monitor recognition during practice
  useEffect(() => {
    if (!session.isActive || !session.currentExercise) return;

    const lastRecognized = recognitionState.recognizedSigns[0];
    if (!lastRecognized) return;

    const isCorrect = checkAnswer(lastRecognized);
    
    if (isCorrect) {
      setFeedbackMessage({ type: 'success', text: `¡Correcto! ${lastRecognized.sign}` });
      
      // Confetti on correct answer
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });

      // Move to next sign after delay
      setTimeout(() => {
        const hasNext = nextSign();
        if (!hasNext) {
          // Exercise completed
          const result = completeExercise();
          stopRecognition();
          
          // Big confetti for completion
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
        setFeedbackMessage(null);
      }, 1500);
    } else {
      setFeedbackMessage({ 
        type: 'error', 
        text: `Incorrecto. Se esperaba: ${session.currentExercise.signs[session.currentSignIndex].name}` 
      });
      
      setTimeout(() => {
        setFeedbackMessage(null);
      }, 2000);
    }
  }, [recognitionState.recognizedSigns]);

  const handleStartExercise = async (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;
    
    startExercise(exerciseId);
    
    // Map exercise category to ONNX Model URL category
    const onnxCategoryMap: Record<string, string> = {
      'alphabet': 'Abecedario',
      'colors': 'Colores',
      'greetings': 'Saludos',
      'office': 'Oficina',
      'design': 'Diseño'
    };
    
    const onnxCat = onnxCategoryMap[exercise.category] || 'Abecedario';
    await startRecognition(onnxCat);
  };

  const handleCancelExercise = () => {
    cancelExercise();
    stopRecognition();
  };

  const currentSign = session.currentExercise?.signs[session.currentSignIndex];
  const progress = session.currentExercise 
    ? ((session.currentSignIndex + 1) / session.currentExercise.signs.length) * 100 
    : 0;

  if (session.isActive && session.currentExercise) {
    return (
      <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
        {/* Header compacto */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-[var(--color-neutral-200)] bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft size={18} />}
                onClick={handleCancelExercise}
              >
                Salir
              </Button>
              <Badge variant="primary">
                {session.correctAnswers} / {session.currentExercise.signs.length}
              </Badge>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                  {session.currentExercise.title}
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {session.currentSignIndex + 1}/{session.currentExercise.signs.length}
                </p>
              </div>
              <div className="w-full bg-[var(--color-neutral-200)] rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-accent-500)] h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content compacto */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6">
          <div className="max-w-5xl mx-auto h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-full">
              <Card className="overflow-hidden h-full flex flex-col">
                <CardBody className="p-0 flex-1 flex flex-col">
                  <div className="flex-1 bg-gradient-to-br from-[var(--color-neutral-100)] to-[var(--color-neutral-200)] flex items-center justify-center relative overflow-hidden">
                    <video ref={videoRef} className="hidden" playsInline />
                    <canvas ref={canvasRef} className="w-full h-full object-contain" />

                    <AnimatePresence>
                      {feedbackMessage && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className={`absolute inset-0 flex items-center justify-center ${
                            feedbackMessage.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
                          } backdrop-blur-sm`}
                        >
                          <div className={`px-6 py-3 rounded-xl shadow-2xl ${
                            feedbackMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                          }`}>
                            <div className="flex items-center gap-3">
                              {feedbackMessage.type === 'success' ? <Check size={24} /> : <XIcon size={24} />}
                              <p className="text-xl font-bold">{feedbackMessage.text}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardBody>
              </Card>
            </div>

            <div className="flex flex-col gap-3">
              <Card className="bg-gradient-to-br from-[var(--color-primary-50)] to-[var(--color-accent-50)] border-0">
                <CardBody className="p-4">
                  <p className="text-xs text-[var(--color-text-secondary)] mb-2">Realiza esta seña:</p>
                  <h3 className="text-3xl font-bold text-[var(--color-primary-600)] mb-2">
                    {currentSign?.name}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {currentSign?.description}
                  </p>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="p-4">
                  <h3 className="font-semibold text-sm text-[var(--color-text-primary)] mb-3">Progreso</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--color-text-secondary)]">Correctas</span>
                      <span className="font-semibold text-green-600">{session.correctAnswers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--color-text-secondary)]">Incorrectas</span>
                      <span className="font-semibold text-red-600">{session.incorrectAnswers}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-[var(--color-neutral-50)]">
                <CardBody className="p-3">
                  <h4 className="font-semibold text-xs text-[var(--color-text-primary)] mb-2">💡 Tips</h4>
                  <ul className="space-y-1 text-xs text-[var(--color-text-secondary)]">
                    <li>• Manos en el cuadro</li>
                    <li>• Seña clara</li>
                    <li>• Espera feedback</li>
                  </ul>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden bg-[var(--color-surface)] relative">
      <InstructionsModal 
        id="practice"
        title="Práctica Gamificada"
        instructions={[
          "Completa ejercicios diarios para mantener tu racha y ganar puntos.",
          "Cada ejercicio evaluará tu conocimiento de las señas LSC de forma interactiva.",
          "Desbloquea logros a medida que avanzas y acumulas experiencia.",
          "Asegúrate de practicar todos los días para no perder tu racha."
        ]}
      />

      {/* Header compacto */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-[var(--color-neutral-200)] bg-white">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">Práctica</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Mejora tus habilidades con ejercicios diarios
          </p>
        </div>
      </div>

      {/* Stats compactos */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-3 bg-[var(--color-neutral-50)] border-b border-[var(--color-neutral-200)]">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-3">
          <Card>
            <CardBody className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <Trophy size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-secondary)]">Puntaje</p>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{stats.score}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-600 rounded-lg flex items-center justify-center">
                <Flame size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-secondary)]">Racha</p>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{stats.streak} días</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <Target size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">Objetivo</p>
                <div className="w-full bg-[var(--color-neutral-200)] rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-accent-500)] h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((stats.dailyProgress / stats.dailyGoal) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  {stats.dailyProgress}/{stats.dailyGoal}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Content scrollable */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="px-4 py-3">
                <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Ejercicios disponibles</h3>
              </CardHeader>
              <CardBody className="p-4">
                <div className="space-y-2">
                  {exercises.map((exercise, index) => (
                    <motion.div
                      key={exercise.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-[var(--color-neutral-50)] rounded-lg border border-[var(--color-neutral-200)] hover:border-[var(--color-primary-300)] transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                          <span className="text-xl">{exercise.completed ? '✅' : '📚'}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-[var(--color-text-primary)]">{exercise.title}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              variant={
                                exercise.difficulty === 'Fácil' ? 'success' :
                                exercise.difficulty === 'Intermedio' ? 'warning' : 'error'
                              }
                              className="text-xs px-2 py-0"
                            >
                              {exercise.difficulty}
                            </Badge>
                            <span className="text-xs text-[var(--color-text-secondary)]">
                              +{exercise.points} pts · {exercise.signs.length} señas
                            </span>
                          </div>
                          {exercise.bestScore > 0 && (
                            <p className="text-xs text-[var(--color-primary-600)] mt-0.5">
                              Mejor: {exercise.bestScore}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant={exercise.completed ? 'ghost' : 'primary'}
                        size="sm"
                        leftIcon={<Play size={16} />}
                        onClick={() => handleStartExercise(exercise.id)}
                      >
                        {exercise.completed ? 'Repetir' : 'Iniciar'}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-3">
            <Card>
              <CardHeader className="px-4 py-3">
                <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Logros</h3>
              </CardHeader>
              <CardBody className="p-4">
                <div className="space-y-2">
                  {achievements.slice(0, 4).map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-2 p-2 rounded-lg border ${
                        achievement.unlocked
                          ? 'bg-[var(--color-primary-50)] border-[var(--color-primary-200)]'
                          : 'bg-[var(--color-neutral-50)] border-[var(--color-neutral-200)] opacity-50'
                      }`}
                    >
                      <span className="text-xl">{achievement.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs text-[var(--color-text-primary)] truncate">
                          {achievement.title}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)] truncate">
                          {achievement.description}
                        </p>
                        {!achievement.unlocked && achievement.progress > 0 && (
                          <div className="mt-1">
                            <div className="w-full bg-[var(--color-neutral-200)] rounded-full h-1">
                              <div
                                className="bg-[var(--color-primary-500)] h-1 rounded-full"
                                style={{ width: `${(achievement.progress / achievement.requirement) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      {achievement.unlocked && <Star size={14} className="text-[var(--color-primary-600)] flex-shrink-0" />}
                    </motion.div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-[var(--color-accent-50)] to-[var(--color-accent-100)] border-[var(--color-accent-200)]">
              <CardBody className="p-4">
                <h4 className="font-semibold text-sm text-[var(--color-text-primary)] mb-2">📊 Estadísticas</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--color-text-secondary)]">Total practicado</span>
                    <span className="font-semibold text-sm text-[var(--color-text-primary)]">{stats.totalPracticed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--color-text-secondary)]">Precisión</span>
                    <span className="font-semibold text-sm text-[var(--color-text-primary)]">{stats.accuracy}%</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
        {onNavigateHome && <BackToHome onClick={onNavigateHome} />}
      </div>
    </div>
  );
}
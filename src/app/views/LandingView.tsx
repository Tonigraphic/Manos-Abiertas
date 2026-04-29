import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { Badge } from '../components/lsc/Badge';
import { Bot, Target, BookOpen, Sparkles, Video, CheckCircle, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

// Importación del logo con la ruta corregida para el build
import logoPrincipal from '../../assets/logo.png'; 

interface LandingViewProps {
  onNavigate: (view: string) => void;
}

export function LandingView({ onNavigate }: LandingViewProps) {
  const features = [
    {
      id: 'translator',
      title: 'Traductor a Glosa LSC',
      description: 'Convierte texto o voz en español a la estructura gramatical de la Lengua de Señas Colombiana',
      icon: Bot,
      gradient: 'from-blue-500 to-blue-600',
      badge: 'Módulo Principal',
      highlights: ['Traducción instantánea', 'Reconocimiento de voz', 'Síntesis de voz'],
    },
    {
      id: 'assistant',
      title: 'Reconocimiento LSC',
      description: 'Reconocimiento en tiempo real de señas utilizando Inteligencia Artificial y la cámara de tu dispositivo',
      icon: Video,
      gradient: 'from-purple-500 to-purple-600',
      badge: 'Innovación',
      highlights: ['Detección en tiempo real', 'Precisión avanzada', 'Múltiples categorías'],
    },
    {
      id: 'dictionary',
      title: 'Diccionario Visual',
      description: 'Catálogo completo de señas organizadas por categorías con videos demostrativos',
      icon: BookOpen,
      gradient: 'from-green-500 to-green-600',
      badge: 'Complementario',
      highlights: ['Búsqueda avanzada', 'Categorización', 'Videos HD'],
    },
    {
      id: 'practice',
      title: 'Práctica Gamificada',
      description: 'Sistema de puntos, rachas diarias y ejercicios progresivos para mejorar habilidades',
      icon: Target,
      gradient: 'from-orange-500 to-orange-600',
      badge: 'Popular',
      highlights: ['Sistema de puntos', 'Racha de días', 'Logros'],
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-surface)] relative overflow-hidden">
      {/* Decoración de Fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-orange-200/30 to-pink-200/30 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge Institucional */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full mb-8 shadow-md border border-[var(--color-neutral-200)]">
              <GraduationCap size={20} className="text-[var(--color-primary-600)]" />
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                Universidad de Nariño - Programa de Diseño Gráfico
              </span>
            </div>

            {/* LOGO AJUSTADO: Tamaño equilibrado y responsive */}
            <div className="flex justify-center mb-8">
              <img 
                src={logoPrincipal} 
                alt="Logo Manos Abiertas" 
                className="h-32 sm:h-52 lg:h-[280px] w-auto object-contain drop-shadow-xl" 
              />
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--color-text-primary)] mb-6 leading-tight">
              Asistente para la comunicación en LSC
            </h1>

            <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
              Herramienta digital integral desde el enfoque del diseño gráfico, orientada a fortalecer
              los procesos de comunicación entre la comunidad sorda y oyente de la Universidad de Nariño.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                variant="primary"
                size="lg"
                onClick={() => onNavigate('translator')}
                className="w-full sm:w-auto px-6 py-4 text-base sm:px-8 sm:py-6 sm:text-lg font-bold shadow-xl hover:scale-105 transition-transform"
              >
                Probar Asistente
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto border-2 border-[var(--color-neutral-300)] px-6 py-4 text-base sm:px-8 sm:py-6 sm:text-lg font-bold bg-white/50"
              >
                Ver Características
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 px-4 sm:px-6 lg:px-8 bg-white/60 backdrop-blur-md border-t border-neutral-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="primary" className="mb-4 text-sm px-6 py-2 uppercase font-black tracking-widest">
              Módulos principales
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Nuestras Herramientas
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto font-medium">
              Diseñamos una experiencia complementaria para fortalecer la inclusión académica en la Facultad de Artes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hoverable className="h-full border-none shadow-lg hover:shadow-2xl transition-all bg-white/80">
                  <CardBody className="p-8">
                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-md`}>
                      <feature.icon size={28} className="text-white" />
                    </div>
                    <Badge variant="accent" className="mb-3 px-3 py-1">{feature.badge}</Badge>
                    <h3 className="text-xl font-bold mb-3 text-neutral-800">{feature.title}</h3>
                    <p className="text-neutral-600 mb-6 leading-relaxed text-sm">
                      {feature.description}
                    </p>
                    <ul className="space-y-2 mb-8">
                      {feature.highlights.map((h, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                          <CheckCircle size={16} className="text-green-500" />
                          {h}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      variant="primary" 
                      className="w-full py-4 font-bold" 
                      onClick={() => onNavigate(feature.id)}
                    >
                      Explorar módulo
                    </Button>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
